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
    const MANUAL_CONTENT = {{ MANUAL_CONTENT_JSON }
};

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
        content: botResponseText
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
