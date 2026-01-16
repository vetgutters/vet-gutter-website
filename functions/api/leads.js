import { createClient } from '@supabase/supabase-js';

export async function onRequest(context) {
    const { request, env } = context;

    if (request.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    const SUPABASE_URL = env.SUPABASE_URL;
    const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_KEY) {
        return new Response(JSON.stringify({ error: 'Server misconfiguration' }), { status: 500 });
    }

    try {
        const formData = await request.json();
        const { name, phone, service } = formData;

        if (!name || !phone) {
            return new Response(JSON.stringify({ error: 'Name and Phone are required' }), { status: 400 });
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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

        return new Response(JSON.stringify({ success: true, message: 'Lead saved' }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: 'Invalid Request' }), { status: 400 });
    }
}
