import { createClient } from '@supabase/supabase-js';
// import { google } from 'googleapis';

export async function onRequest(context) {
    const { request, env } = context;

    if (request.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    // --- Configuration ---
    const SUPABASE_URL = env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY;
    const GOOGLE_SERVICE_ACCOUNT_JSON = env.GOOGLE_SERVICE_ACCOUNT_JSON;
    const CALENDAR_ID = 'Vetgutters@gmail.com';

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        return new Response(JSON.stringify({ error: 'Server misconfiguration: Missing Supabase' }), { status: 500 });
    }

    try {
        const { messages } = await request.json();
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // --- 1. Determine Conversation State ---
        // We infer state based on what "slots" are filled in the conversation so far.
        // Slots: Name, Issue, Urgency (Timeline), Phone, Email, Address
        const userMessages = messages.filter(m => m.role === 'user');
        const lastUserMsg = userMessages[userMessages.length - 1]?.content || "";

        // Simple slot extraction (in a real app, use an LLM or Regex to extract these reliably)
        // For this non-LLM version, we assume sequential answers to our specific questions.
        const slots = {
            name: userMessages[0]?.content,
            issue: userMessages[1]?.content,
            urgency: userMessages[2]?.content,
            phone: userMessages[3]?.content,
            email: userMessages[4]?.content,
            address: userMessages[5]?.content
        };

        let currentState = 'GREETING';
        if (slots.name) currentState = 'DISCOVER';
        if (slots.issue) currentState = 'QUALIFY';
        if (slots.urgency) currentState = 'CAPTURE_CONTACT'; // Simplified: Jump to contact after urgency
        if (slots.phone) currentState = 'CAPTURE_EMAIL';
        if (slots.email) currentState = 'CAPTURE_ADDRESS';
        if (slots.address) currentState = 'CONFIRM';

        // --- 2. RAG / Knowledge Base Retrieval (Objection Handling) ---
        // Check if the user's latest message sounds like an objection (simple keyword check for this version)
        // In full version: env.AI.run('@cf/baai/bge-base-en-v1.5', { text: lastUserMsg }) -> Supabase.rpc('match_documents')

        let trainingNote = "";
        const lowerMsg = lastUserMsg.toLowerCase();

        if (lowerMsg.includes("expensive") || lowerMsg.includes("price") || lowerMsg.includes("cost")) {
            // Retrieve "Price Objection" chunk
            const { data: kbData } = await supabase.from('kb_chunks').select('content').textSearch('content', 'price').limit(1);
            if (kbData && kbData.length > 0) trainingNote = `\n\n(Training Manual: ${kbData[0].content})`;
            else trainingNote = "\n\n(Manual: Value > Price. Protect the investment.)";
        }

        // --- 3. State Machine Output ---
        let botResponseText = "";
        let isComplete = false;

        switch (currentState) {
            case 'GREETING':
                botResponseText = "Hello! I'm the Veteran Gutters Assistant. I can help you protect your largest investment—your home.\n\nTo get started with a free estimate, what is your **Name**?";
                break;

            case 'DISCOVER':
                botResponseText = `Nice to meet you, ${slots.name}. I imagine you see the benefit in protecting your home from water damage.\n\nWhat specific issues are you seeing with your current gutters? (e.g., Leaks, Clogs, Overflow, or just need new ones?)`;
                break;

            case 'QUALIFY':
                // "Investment Tie-Down" & "Urgency"
                botResponseText = `I understand. Keeping water away from your foundation is critical.\n\nWould you agree that projects that protect your home are best done **sooner rather than later**?${trainingNote}`;
                break;

            case 'CAPTURE_CONTACT':
                // Transition to booking
                botResponseText = "Great. We can certainly help with that.\n\nTo have Jesse come out and give you an exact price, what is the best **Phone Number** to reach you at?";
                break;

            case 'CAPTURE_EMAIL':
                botResponseText = "Got it. And what is your **Email Address**?";
                break;

            case 'CAPTURE_ADDRESS':
                botResponseText = "Perfect. Finally, what is the **Property Address** where we should send the estimator?";
                break;

            case 'CONFIRM':
                isComplete = true;
                botResponseText = "Excellent! I have your information.\n\n**One last favor**: Jesse will contact you shortly to confirm the time. If the price looks good, great! If not, just let him know.\n\nWe'll be in touch shortly!";
                break;
        }

        // --- 4. Finalize & Save ---
        if (isComplete) {
            const leadPayload = {
                name: slots.name,
                notes: `Issue: ${slots.issue}\nUrgency: ${slots.urgency}\nChat Log: ${JSON.stringify(messages).substring(0, 1000)}`,
                phone: slots.phone,
                email: slots.email,
                address: slots.address,
                status: 'new'
            };

            const { error } = await supabase.from('leads').insert([leadPayload]);

            if (error) {
                console.error("Supabase Save Error:", error);
                botResponseText += "\n(Note: Saved locally. We will call you.)";
            } else {
                // --- Notification Logic ---
                // Send email notification for chat leads
                await sendEmailNotification(env, {
                    name: leadPayload.name,
                    phone: leadPayload.phone,
                    service: "Chatbot Lead (See Notes)"
                });
            }
        }

        return new Response(JSON.stringify({
            response: botResponseText,
            role: 'assistant',
            content: botResponseText
        }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error("Server Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}

// --- Helper: Send Email via Resend (or similar) ---
async function sendEmailNotification(env, lead) {
    const API_KEY = env.RESEND_API_KEY;
    if (!API_KEY) {
        console.log("Email Notification Skipped: No RESEND_API_KEY in environment variables.");
        return "skipped_no_key";
    }

    try {
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                from: 'Veteran Gutters Leads <leads@veterangutterguards.com>', // Requires verified domain in Resend
                to: ['Vetgutters@gmail.com'], // Replace with env.OWNER_EMAIL if desired
                subject: `🚀 New Lead: ${lead.name}`,
                html: `
                    <h1>New Website Lead</h1>
                    <p><strong>Name:</strong> ${lead.name}</p>
                    <p><strong>Phone:</strong> <a href="tel:${lead.phone}">${lead.phone}</a></p>
                    <p><strong>Service:</strong> ${lead.service}</p>
                    <hr>
                    <p><em><small>Sent from Veteran Gutters Website</small></em></p>
                `
            })
        });

        if (res.ok) {
            return "sent";
        } else {
            const err = await res.text();
            console.error("Email API Error:", err);
            return "failed_api";
        }
    } catch (e) {
        console.error("Email Fetch Error:", e);
        return "failed_network";
    }
}
