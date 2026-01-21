const https = require('https');

async function testChat() {
    const options = {
        hostname: 'veterangutterguards.com',
        path: '/api/chat',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    const payload = JSON.stringify({
        messages: [{ role: "user", content: "Hello" }]
    });

    console.log(`POST to https://${options.hostname}${options.path}...`);

    const req = https.request(options, (res) => {
        // console.log(`Status: ${res.statusCode}`);
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
            // console.log("Body:", data);
        });
    });

    req.on('error', (e) => {
        console.error(`Error: ${e.message}`);
    });

    req.write(payload);
    req.end();
}

testChat();