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
    const MANUAL_CONTENT = {{ __INJECT_MANUAL_HERE__ }
};

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
        response: aiText
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
        response: botResponseText
    }), { headers: { 'Content-Type': 'application/json' } });
}
