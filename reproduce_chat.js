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
        messages: [
            { role: "user", content: "Hi, I need a quote for gutters." }
        ]
    });

    console.log(`Sending request to https://${options.hostname}${options.path}...`);

    const req = https.request(options, (res) => {
        console.log(`Status Code: ${res.statusCode}`);
        console.log(`Status Message: ${res.statusMessage}`);

        let data = '';

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            console.log(`Raw Response Body:`);
            console.log(data);
            try {
                const json = JSON.parse(data);
                console.log("Parsed JSON:", json);
            } catch (e) {
                console.log("Response is not valid JSON.");
            }
        });
    });

    req.on('error', (e) => {
        console.error(`Problem with request: ${e.message}`);
    });

    req.write(payload);
    req.end();
}

testChat();
