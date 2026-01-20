const fs = require('fs');
const path = require('path');

const manualPath = path.join(__dirname, 'manual_final.txt');
const templatePath = path.join(__dirname, 'chat_template.js');
const outputPath = path.join(__dirname, 'functions', 'api', 'chat.js');

try {
    const manualContent = fs.readFileSync(manualPath, 'utf8');
    let template = fs.readFileSync(templatePath, 'utf8');

    // Use JSON.stringify to safely escape everything (newlines, quotes, backslashes)
    const safeManualJSON = JSON.stringify(manualContent);

    // Replace the placeholder with the quoted JSON string
    const finalContent = template.replace('{{MANUAL_CONTENT_JSON}}', safeManualJSON);

    fs.writeFileSync(outputPath, finalContent);
    console.log('Successfully generated chat.js with JSON.stringify injection.');

} catch (err) {
    console.error('Error generating chat.js:', err);
}
