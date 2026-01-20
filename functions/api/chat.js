import { createClient } from '@supabase/supabase-js';

export async function onRequest(context) {
    const { request, env } = context;

    if (request.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    const SUPABASE_URL = env.SUPABASE_URL;
    const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_KEY) {
        return new Response(JSON.stringify({ error: 'Server misconfiguration: Missing Supabase' }), { status: 500 });
    }

    try {
        const { messages } = await request.json();
        const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

        if (env.AI) {
            return await handleAIChat(env, messages, supabase);
        } else {
            console.log("No AI Binding found. Using Rule-Based logic.");
            return await handleRuleBasedChat(env, messages, supabase);
        }

    } catch (error) {
        console.error("Server Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}

async function handleAIChat(env, messages, supabase) {
    // 1. The "Internal" Sales Manual (Injected as a safe JSON string)
    const MANUAL_CONTENT = "VETERAN GUTTERS & GUARDS - SALES PROTOCOL & KNOWLEDGE BASE\r\n\r\nMISSION:\r\nTo provide standard-setting gutter solutions while honoring our veteran roots. \r\nGoal: Qualify the lead and book a free on-site estimate.\r\nNEVER give a price over chat. \"We need to measure to be accurate.\"\r\n\r\nPRODUCT KNOWLEDGE:\r\n- 6\" Seamless Gutters (Aluminum).\r\n- Micro-Mesh Gutter Guards (Surgical grade stainless steel, no-clog guarantee).\r\n- Veteran-Owned & Operated.\r\n- Lifecycle: We clean, seal, realign, and reinforce existing gutters before installing guards.\r\n\r\nSALES SCRIPTING:\r\n\r\n1. THE OPENER:\r\n\"Hi! I'm the Veteran Gutters assistant. I can help you with a free estimate or check availability. What can I do for you?\"\r\n\r\n2. QUALIFYING QUESTIONS (Ask one at a time):\r\n- \"Are you looking for new gutters, gutter guards, or repairs?\"\r\n- \"To check our schedule in your area, may I have your zip code?\"\r\n- \"What is your street address?\"\r\n- \"What is your full name?\"\r\n- \"What is the best phone number to reach you?\"\r\n- \"When would be a good time for a tech to stop by for a free 15-minute measure? (Morning/Afternoon?)\"\r\n\r\n3. OBJECTION HANDLING:\r\n\r\nOBJECTION: \"How much does it cost?\"\r\nREBUTTAL: \"It depends entirely on the linear footage and the condition of your fascia. We offer a 100% free, no-obligation estimate. It takes about 15 minutes. Would you like to set that up?\"\r\n\r\nOBJECTION: \"I just want a ballpark price.\"\r\nREBUTTAL: \"I understand. However, every home is different. Pricing varies based on corners, stories, and roof pitch. We'd rather give you an exact price than a wrong guess. When are you available?\"\r\n\r\nOBJECTION: \"Are you expensive?\"\r\nREBUTTAL: \"We are competitive, but we focus on value. We use surgical-grade stainless steel micro-mesh that never clogs. It's a lifetime solution, not a quick fix.\"\r\n\r\nOBJECTION: \"I need to talk to my spouse.\"\r\nREBUTTAL: \"Of course. Does [Day/Time] work for both of you? It helps if you're both there to ask questions.\"\r\n\r\n4. CLOSING THE APPOINTMENT:\r\n\"Great. I have your info. I've sent this to our scheduling team. Jesse (our scheduling manager) will give you a quick call to confirm the exact arrival window. Thank you for choosing Veteran Gutters!\"\r\n";

    const SYSTEM_PROMPT = `
    You are the Veteran Gutters AI Sales Assistant.
    Your mission is to qualify leads and book appointments.
    
    KNOWLEDGE BASE:
    ${MANUAL_CONTENT}

    RULES:
    - Keep responses short (under 3 sentences).
    - Ask only ONE question at a time.
    - Your goal is to collect: Name, Phone, Address, and Preferred Time.
    - Once you have these 4 things, you MUST output a JSON object to save the lead.
    - If asked for price, say: "Estimates are free, but we need to measure the home for accuracy."
    
    FORMAT:
    Return a JSON object.
    If the conversation is ongoing, return: {"response": "your message"}
    If the lead is complete (Name, Phone, Address, Time collected), return: 
    {
      "response": "I've secured your info. Jesse will call you shortly.",
      "lead": {
        "name": "...",
        "phone": "...",
        "address": "...",
        "notes": "..."
      }
    }
    `;

    try {
        const response = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                ...messages
            ]
        });

        let aiText = response.response || "";
        let jsonMatch = aiText.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
            try {
                const data = JSON.parse(jsonMatch[0]);
                if (data.lead) {
                    await supabase.from('leads').insert([{
                        name: data.lead.name,
                        phone: data.lead.phone,
                        notes: `AI Lead: ${data.lead.notes} (Addr: ${data.lead.address})`,
                        status: 'new'
                    }]);
                    await sendEmailNotification(env, {
                        name: data.lead.name,
                        phone: data.lead.phone,
                        service: "[AI Lead] " + data.lead.notes
                    });
                }
                return new Response(JSON.stringify({
                    role: 'assistant',
                    content: data.response
                }), { headers: { 'Content-Type': 'application/json' } });
            } catch (e) {
                return new Response(JSON.stringify({
                    role: 'assistant',
                    content: aiText
                }), { headers: { 'Content-Type': 'application/json' } });
            }
        }
        return new Response(JSON.stringify({
            role: 'assistant',
            content: aiText
        }), { headers: { 'Content-Type': 'application/json' } });

    } catch (err) {
        console.error("AI Error:", err);
        return await handleRuleBasedChat(env, messages, supabase);
    }
}

async function handleRuleBasedChat(env, messages, supabase) {
    const userMessages = messages.filter(m => m.role === 'user');
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
            botResponseText = "Hello! I'm the Veteran Gutters Assistant.\\n\\nTo get started with a free estimate, what is your **Name**?";
            break;
        case 'DISCOVER':
            botResponseText = `Nice to meet you, ${slots.name}. What specific issues are you seeing? (e.g., Leaks, Clogs, or New Install?)`;
            break;
        case 'QUALIFY':
            botResponseText = "Understood. Protecting the foundation is key.\\n\\nWould you say this project is urgent?";
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
        response: botResponseText
    }), { headers: { 'Content-Type': 'application/json' } });
}

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
