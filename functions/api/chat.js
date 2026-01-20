export async function onRequest(context) {
    const { request, env } = context;

    if (request.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    try {
        const { messages } = await request.json();

        // If AI binding exists, use it
        if (env.AI) {
            return await handleAIChat(env, messages);
        } else {
            // Fallback to rule-based
            return await handleRuleBasedChat(messages);
        }

    } catch (error) {
        console.error("Server Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}

async function handleAIChat(env, messages) {
    const MANUAL_CONTENT = "VETERAN GUTTERS & GUARDS - SALES PROTOCOL & KNOWLEDGE BASE\r\n\r\nMISSION:\r\nTo provide standard-setting gutter solutions while honoring our veteran roots. \r\nGoal: Qualify the lead and book a free on-site estimate.\r\nNEVER give a price over chat. \"We need to measure to be accurate.\"\r\n\r\nPRODUCT KNOWLEDGE:\r\n- 6\" Seamless Gutters (Aluminum).\r\n- Micro-Mesh Gutter Guards (Surgical grade stainless steel, no-clog guarantee).\r\n- Veteran-Owned & Operated.\r\n- Lifecycle: We clean, seal, realign, and reinforce existing gutters before installing guards.\r\n\r\nSALES SCRIPTING:\r\n\r\n1. THE OPENER:\r\n\"Hi! I'm the Veteran Gutters assistant. I can help you with a free estimate or check availability. What can I do for you?\"\r\n\r\n2. QUALIFYING QUESTIONS (Ask one at a time):\r\n- \"Are you looking for new gutters, gutter guards, or repairs?\"\r\n- \"To check our schedule in your area, may I have your zip code?\"\r\n- \"What is your street address?\"\r\n- \"What is your full name?\"\r\n- \"What is the best phone number to reach you?\"\r\n- \"When would be a good time for a tech to stop by for a free 15-minute measure? (Morning/Afternoon?)\"\r\n\r\n3. OBJECTION HANDLING:\r\n\r\nOBJECTION: \"How much does it cost?\"\r\nREBUTTAL: \"It depends entirely on the linear footage and the condition of your fascia. We offer a 100% free, no-obligation estimate. It takes about 15 minutes. Would you like to set that up?\"\r\n\r\nOBJECTION: \"I just want a ballpark price.\"\r\nREBUTTAL: \"I understand. However, every home is different. Pricing varies based on corners, stories, and roof pitch. We'd rather give you an exact price than a wrong guess. When are you available?\"\r\n\r\nOBJECTION: \"Are you expensive?\"\r\nREBUTTAL: \"We are competitive, but we focus on value. We use surgical-grade stainless steel micro-mesh that never clogs. It's a lifetime solution, not a quick fix.\"\r\n\r\nOBJECTION: \"I need to talk to my spouse.\"\r\nREBUTTAL: \"Of course. Does [Day/Time] work for both of you? It helps if you're both there to ask questions.\"\r\n\r\n4. CLOSING THE APPOINTMENT:\r\n\"Great. I have your info. I've sent this to our scheduling team. Jesse (our scheduling manager) will give you a quick call to confirm the exact arrival window. Thank you for choosing Veteran Gutters!\"\r\n";

const SYSTEM_PROMPT = `You are the Veteran Gutters AI Sales Assistant. Your mission is to qualify leads and book appointments.

KNOWLEDGE BASE:
${MANUAL_CONTENT}

RULES:
- Keep responses short (under 3 sentences).
- Ask only ONE question at a time.
- Your goal is to collect: Name, Phone, Address, and Preferred Time.
- If asked for price, say: "Estimates are free, but we need to measure the home for accuracy."

Always respond in plain text. Be friendly and professional.`;

try {
    const response = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
        messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...messages
        ]
    });

    const aiText = response.response || "I'm here to help! What can I assist you with today?";

    return new Response(JSON.stringify({
        role: 'assistant',
        content: aiText
    }), { headers: { 'Content-Type': 'application/json' } });

} catch (err) {
    console.error("AI Error:", err);
    return await handleRuleBasedChat(messages);
}
}

async function handleRuleBasedChat(messages) {
    const userMessages = messages.filter(m => m.role === 'user');
    const msgCount = userMessages.length;

    let botResponseText = "";

    if (msgCount === 0 || msgCount === 1) {
        botResponseText = "Hello! I'm the Veteran Gutters Assistant. To get started with a free estimate, what is your name?";
    } else if (msgCount === 2) {
        botResponseText = "Nice to meet you! What specific gutter issues are you seeing? (e.g., Leaks, Clogs, or New Install?)";
    } else if (msgCount === 3) {
        botResponseText = "Understood. To have Jesse contact you for a price, what is your phone number?";
    } else if (msgCount === 4) {
        botResponseText = "Got it. And what is the property address?";
    } else {
        botResponseText = "Excellent! Jesse will contact you shortly. We'll be in touch!";
    }

    return new Response(JSON.stringify({
        role: 'assistant',
        content: botResponseText
    }), { headers: { 'Content-Type': 'application/json' } });
}
