export async function onRequest(context) {
    const { request, env } = context;

    // 1. Setup & Auth
    const ACCOUNT_SID = env.TWILIO_ACCOUNT_SID;
    const AUTH_TOKEN = env.TWILIO_AUTH_TOKEN;
    const FROM_PHONE = env.TWILIO_PHONE_NUMBER;
    const ADMIN_PHONE = "3212787996"; // Jesse's Phone

    if (request.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405 });
    }

    // 2. Parse Lead Data
    let data;
    try {
        data = await request.json();
    } catch (e) {
        return new Response("Invalid JSON", { status: 400 });
    }

    const { name, phone, service } = data;

    // 3. Check Protocol Status (Do we have ammo?)
    if (!ACCOUNT_SID || !AUTH_TOKEN || !FROM_PHONE) {
        // console.log("🐺 The Wolf is dormant. (Missing Twilio Keys)");
        return new Response(JSON.stringify({ status: "skipped", message: "Wolf Dormant" }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // 4. Execute Protocol (Make the Call)
    // We use Twilio Studio Flow or a TwiML Bin usually, but here we'll use raw API to call Jesse.
    // When Jesse picks up, we play a message.

    // TwiML to speak to Jesse:
    const twiml = `
        <Response>
            <Say voice="alice">New Lead Detected. ${name}. Interested in ${service}. Press 1 to connect.</Say>
            <Gather numDigits="1" action="/api/wolf-connect?clientPhone=${encodeURIComponent(phone)}">
                <Pause length="1"/>
            </Gather>
        </Response>
    `;

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/Calls.json`;

    try {
        const body = new URLSearchParams({
            'To': ADMIN_PHONE,
            'From': FROM_PHONE,
            'Twiml': twiml
        });

        const auth = btoa(`${ACCOUNT_SID}:${AUTH_TOKEN}`);

        const res = await fetch(twilioUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: body
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Twilio Error: ${err}`);
        }

        return new Response(JSON.stringify({ status: "success", message: "Wolf Howling" }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error("Wolf Failed:", error);
        return new Response(JSON.stringify({ status: "error", error: error.message }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }
}