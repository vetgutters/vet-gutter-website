export async function onRequest(context) {
    return new Response(JSON.stringify({ message: "PONG FROM NEW FILE" }), {
        headers: { "Content-Type": "application/json" }
    });
}
