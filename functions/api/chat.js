import { createClient } from '@supabase/supabase-js';

export async function onRequest(context) {
    const { request, env } = context;

    if (request.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    // --- Configuration ---
    const SUPABASE_URL = env.SUPABASE_URL;
    const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY;
    const OPENAI_API_KEY = env.OPENAI_API_KEY;

    if (!SUPABASE_URL || !SUPABASE_KEY) {
        return new Response(JSON.stringify({ error: 'Server misconfiguration: Missing Supabase' }), { status: 500 });
    }

    try {
        const { messages } = await request.json();
        const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

        // --- BRANCH LOGIC ---
        // If we have an AI Key, use the Big Brain. Otherwise, stick to the script.
        if (OPENAI_API_KEY) {
            return await handleAIChat(env, messages, supabase, OPENAI_API_KEY);
        } else {
            console.log("No OPENAI_API_KEY found. Using Rule-Based logic.");
            return await handleRuleBasedChat(env, messages, supabase);
        }

    } catch (error) {
        console.error("Server Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}

// ==========================================
// 🧠 MODE A: ARTIFICIAL INTELLIGENCE (Smart)
// ==========================================
async function handleAIChat(env, messages, supabase, apiKey) {
    const SYSTEM_PROMPT = `
You are standard-issue Veteran Gutters AI.
Role: Professional, concise, veteran-owned demeanor. "No fluff, just results."
Goal: qualify leads for Gutter Guards, Repairs, or Cleaning.
Location: Serving Ocala, The Villages, and Marion County.

YOUR PRIME DIRECTIVE: Collect the user's Name, Phone, and Address. 
- Ask one question at a time.
- Once you have Name, Phone, and Address, you MUST call the "save_lead" tool.
- If they ask about price, say "We need to see the home to give an exact price, but estimates are free."
- If asked "Are you a bot?", say "I'm the digital outpost for Veteran Gutters."

Services:
- Seamless Gutters (6" K-Style)
- Micro-Mesh Guards (No more cleaning)
- Repairs (Leaks, Rot)
- Cleaning (Hand bagged, no mess)
    `;

    // 1. Prepare Tools
    const tools = [
        {
            type: "function",
            function: {
                name: "save_lead",
                description: "Save a qualified lead to the database when Name, Phone, and Address are collected.",
                parameters: {
                    type: "object",
                    properties: {
                        name: { type: "string" },
                        phone: { type: "string" },
                        address: { type: "string" },
                        service_interest: { type: "string", description: "Inferred service (e.g. Repairs, Guards)" },
                        notes: { type: "string", description: "Summary of issue or conversation" }
                    },
                    required: ["name", "phone", "address"]
                }
            }
        }
    ];

    // 2. Call OpenAI (using simple fetch to avoid library bloat)
    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: "gpt-4-turbo-preview", // or gpt-3.5-turbo if cost sensitive
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                ...messages
            ],
            tools: tools,
            tool_choice: "auto"
        })
    });

    const aiData = await aiRes.json();

    if (aiData.error) {
        console.error("OpenAI Error:", aiData.error);
        return await handleRuleBasedChat(env, messages, supabase); // Fallback if API fails
    }

    const aiMessage = aiData.choices[0].message;

    // 3. Handle Tool Calls (Lead Capture)
    if (aiMessage.tool_calls) {
        const toolCall = aiMessage.tool_calls[0];
        if (toolCall.function.name === 'save_lead') {
            const leadArgs = JSON.parse(toolCall.function.arguments);

            // Save to DB
            await supabase.from('leads').insert([{
                name: leadArgs.name,
                phone: leadArgs.phone,
                notes: `${leadArgs.service_interest} - ${leadArgs.notes}\n(Address: ${leadArgs.address})`,
                status: 'new'
            }]);

            // Notify
            await sendEmailNotification(env, {
                name: leadArgs.name,
                phone: leadArgs.phone,
                service: "[AI Lead] " + leadArgs.service_interest
            });

            return new Response(JSON.stringify({
                role: 'assistant',
                content: "Excellent. I've secured your information. Jesse will reach out shortly to confirm your appointment time. Over and out."
            }), { headers: { 'Content-Type': 'application/json' } });
        }
    }

    // 4. Return Text Response
    return new Response(JSON.stringify({
        role: 'assistant',
        content: aiMessage.content
    }), { headers: { 'Content-Type': 'application/json' } });
}

// ==========================================
// 📜 MODE B: RULE-BASED (The Script)
// ==========================================
async function handleRuleBasedChat(env, messages, supabase) {
    // ... (Existing Logic from original chat.js) ...
    const userMessages = messages.filter(m => m.role === 'user');

    // Slots extraction (Index based - strict order)
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
    if (slots.urgency) currentState = 'CAPTURE_CONTACT';
    if (slots.phone) currentState = 'CAPTURE_EMAIL';
    if (slots.email) currentState = 'CAPTURE_ADDRESS';
    if (slots.address) currentState = 'CONFIRM';

    let botResponseText = "";
    let isComplete = false;

    switch (currentState) {
        case 'GREETING':
            botResponseText = "Hello! I'm the Veteran Gutters Assistant.\n\nTo get started with a free estimate, what is your **Name**?";
            break;
        case 'DISCOVER':
            botResponseText = `Nice to meet you, ${slots.name}. What specific issues are you seeing? (e.g., Leaks, Clogs, or New Install?)`;
            break;
        case 'QUALIFY':
            botResponseText = "Understood. Protecting the foundation is key.\n\nWould you say this project is urgent?";
            break;
        case 'CAPTURE_CONTACT':
            botResponseText = "We can help. To have Jesse contact you for a price, what is your **Phone Number**?";
            break;
        case 'CAPTURE_EMAIL':
            botResponseText = "Got it. And what is your **Email Address**?";
            break;
        case 'CAPTURE_ADDRESS':
            botResponseText = "Finally, what is the **Property Address**?";
            break;
        case 'CONFIRM':
            isComplete = true;
            botResponseText = "Excellent! Jesse will contact you shortly to confirm. We'll be in touch!";
            break;
    }

    if (isComplete) {
        const lead = {
            name: slots.name,
            phone: slots.phone,
            notes: `Script Lead: ${slots.issue} (Urgency: ${slots.urgency})`,
            status: 'new'
        };
        await supabase.from('leads').insert([lead]);
        await sendEmailNotification(env, { name: lead.name, phone: lead.phone, service: "Chatbot Script Lead" });
    }

    return new Response(JSON.stringify({
        role: 'assistant',
        content: botResponseText
    }), { headers: { 'Content-Type': 'application/json' } });
}

// --- Helper: Copied from leads.js logic ---
async function sendEmailNotification(env, lead) {
    const API_KEY = env.RESEND_API_KEY;
    if (!API_KEY) return "skipped";

    try {
        await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                from: 'Veteran Gutters Leads <leads@veterangutterguards.com>',
                to: ['Vetgutters@gmail.com'],
                subject: `🚀 New Lead: ${lead.name}`,
                html: `<p>Name: ${lead.name}</p><p>Phone: ${lead.phone}</p><p>Info: ${lead.service}</p>`
            })
        });
        return "sent";
    } catch (e) {
        return "failed";
    }
}
