import { createClient } from '@supabase/supabase-js';

export async function onRequest(context) {
    const { request, env } = context;

    if (request.method !== 'POST' && request.method !== 'GET') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    const SUPABASE_URL = env.SUPABASE_URL;
    const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_KEY) {
        return new Response(JSON.stringify({ error: 'Server misconfiguration' }), { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // --- GET: Fetch All Leads (Admin) ---
    if (request.method === 'GET') {
        const { data, error } = await supabase
            .from('leads')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        }

        return new Response(JSON.stringify(data), {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // --- POST: Create New Lead ---
    try {
        const formData = await request.json();
        const { name, phone, service } = formData;

        if (!name || !phone) {
            return new Response(JSON.stringify({ error: 'Name and Phone are required' }), { status: 400 });
        }

        const { error } = await supabase.from('leads').insert([{
            name: name,
            phone: phone,
            notes: `Web Form Request - Interested in: ${service}`,
            status: 'new'
        }]);

        if (error) {
            console.error("Supabase Error:", error);
            return new Response(JSON.stringify({ error: 'Failed to save lead' }), { status: 500 });
        }

        // --- Notification Logic ---
        const notificationResult = await sendEmailNotification(env, { name, phone, service });

        return new Response(JSON.stringify({
            success: true,
            message: 'Lead saved',
            notification: notificationResult
        }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (err) {
        console.error("Lead Error:", err);
        return new Response(JSON.stringify({ error: 'Invalid Request' }), { status: 400 });
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
