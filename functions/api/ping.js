export async function onRequest(context) {
    const envKeys = context.env ? Object.keys(context.env) : ["no-env"];
    return new Response(JSON.stringify({
        message: "PONG FROM NEW FILE",
        envKeys: envKeys
    }), {
        headers: { "Content-Type": "application/json" }
    });
}
