export async function onRequest(context) {
    if (context.request.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }
    try {
        const { messages } = await context.request.json();
        return new Response(JSON.stringify({
            response: "System Reset. AI Temporarily Offline.",
            debug: {
                messageCount: messages ? messages.length : 0,
                envKeys: Object.keys(context.env || {})
            }
        }), {
            headers: { "Content-Type": "application/json" }
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
