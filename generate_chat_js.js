const fs = require('fs');
const path = require('path');

const manualPath = path.join(__dirname, 'manual_final.txt');
const templatePath = path.join(__dirname, 'chat_template.js');
const outputPath = path.join(__dirname, 'functions', 'api', 'chat.js');

try {
    const manualContent = fs.readFileSync(manualPath, 'utf8');
    let template = fs.readFileSync(templatePath, 'utf8');

    // Use JSON.stringify to safely escape everything
    const safeManualJSON = JSON.stringify(manualContent);

    // UNIQUE PLACEHOLDER REPLACEMENT
    const finalContent = template.replace('{{__INJECT_MANUAL_HERE__}}', safeManualJSON);

    fs.writeFileSync(outputPath, finalContent);
    console.log('Successfully generated chat.js with JSON.stringify injection.');

} catch (err) {
    console.error('Error generating chat.js:', err);
}
