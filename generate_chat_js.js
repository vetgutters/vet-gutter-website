const fs = require('fs');
const path = require('path');

const manualPath = path.join(__dirname, 'manual_final.txt');
const templatePath = path.join(__dirname, 'chat_template.js');
const outputPath = path.join(__dirname, 'functions', 'api', 'chat.js');

try {
    const manualContent = fs.readFileSync(manualPath, 'utf8');
    let template = fs.readFileSync(templatePath, 'utf8');

    // Escape backticks in manual content just in case
    const safeManualContent = manualContent.replace(/`/g, '\\`').replace(/\$/g, '\\$');

    const finalContent = template.replace('{{MANUAL_CONTENT}}', safeManualContent);

    fs.writeFileSync(outputPath, finalContent);
    console.log('Successfully generated chat.js with manual content.');

} catch (err) {
    console.error('Error generating chat.js:', err);
}
