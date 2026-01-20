const https = require('https');

async function testPing() {
    const options = {
        hostname: 'veterangutterguards.com',
        path: '/api/ping',
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    };

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
        });
    });

    req.on('error', (e) => {
        console.error(`Problem with request: ${e.message}`);
    });

    req.end();
}

testPing();
