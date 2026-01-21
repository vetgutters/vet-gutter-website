const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, '..', 'sales_manual_chunks.jsonl');
const outputFile = path.join(__dirname, 'manual_final.txt');

try {
    const data = fs.readFileSync(inputFile, 'utf8');
    const lines = data.split('\n').filter(line => line.trim() !== '');

    let fullText = '';
    lines.forEach(line => {
        try {
            const json = JSON.parse(line);
            if (json.text) {
                fullText += json.text + '\n\n';
            }
        } catch (e) {
            console.error('Error parsing line:', e);
        }
    });

    fs.writeFileSync(outputFile, fullText);
    // console.log('Successfully extracted manual to:', outputFile);

} catch (err) {
    console.error('Error reading/writing file:', err);
}