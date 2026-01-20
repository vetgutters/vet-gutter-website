const fs = require('fs');
const path = require('path');

const manualPath = path.join(__dirname, 'manual_lite.txt');
const templatePath = path.join(__dirname, 'chat_template.js');
const outputPath = path.join(__dirname, 'functions', 'api', 'chat.js');

try {
    const manualContent = fs.readFileSync(manualPath, 'utf8');
    let template = fs.readFileSync(templatePath, 'utf8');

    console.log("Template length:", template.length);
    console.log("Template snippet around placeholder:");
    const snippet = template.match(/.{0,20}__INJECT_MANUAL_HERE__.{0,20}/s);
    if (snippet) {
        fs.writeFileSync('debug_log.txt', JSON.stringify(snippet[0]));
    } else {
        fs.writeFileSync('debug_log.txt', "Placeholder NOT FOUND in template!");
    }

    const safeManualJSON = JSON.stringify(manualContent);

    // Adjusted Regex: handle single or double closing braces, and spaces
    const regex = /\{\{\s*__INJECT_MANUAL_HERE__\s*\}?\s*\}?/;
    if (regex.test(template)) {
        console.log("Regex MATCHES template.");
    } else {
        console.log("Regex DOES NOT MATCH template.");
    }

    // Use a FUNCTION for replacement to avoid $ patterns being interpreted
    const finalContent = template.replace(
        regex,
        () => safeManualJSON
    );

    if (finalContent.length === template.length) {
        console.log("WARNING: Content length unchanged. Replacement did not happen?");
    }

    fs.writeFileSync(outputPath, finalContent);
    console.log('Finished writing chat.js');

} catch (err) {
    console.error('Error generating chat.js:', err);
}
