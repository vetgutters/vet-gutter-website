const fs = require('fs');
const path = require('path');

const manualPath = path.join(__dirname, 'manual_final.txt');
const templatePath = path.join(__dirname, 'chat_template.js');
const outputPath = path.join(__dirname, 'functions', 'api', 'chat.js');

try {
    const manualContent = fs.readFileSync(manualPath, 'utf8');
    let template = fs.readFileSync(templatePath, 'utf8');

    // CRITICAL: Escape backslashes FIRST, then backticks, then dollars.
    // This prevents "C:\Path" from becoming a distinct escape sequence, 
    // and prevents a trailing backslash from escaping the closing backtick.
    const safeManualContent = manualContent
        .replace(/\\/g, '\\\\')  // Escape backslashes
        .replace(/`/g, '\\`')    // Escape backticks
        .replace(/\$/g, '\\$');  // Escape template literal interpolation starts

    const finalContent = template.replace('{{MANUAL_CONTENT}}', safeManualContent);

    fs.writeFileSync(outputPath, finalContent);
    console.log('Successfully generated chat.js with robust escaping.');

} catch (err) {
    console.error('Error generating chat.js:', err);
}
