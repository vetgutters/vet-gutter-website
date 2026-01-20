/**
 * Fix Form Accessibility - Add visually-hidden labels
 */

const fs = require('fs');
const path = require('path');
const glob = require('fs').readdirSync;

// CSS for visually-hidden labels (add to styles.css if not present)
const srOnlyCSS = `
/* Screen Reader Only - Visually Hidden but Accessible */
.sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
}
`;

// Fix forms in a file
function fixFormAccessibility(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // Add ID to inputs if missing and add labels
    const formPatterns = [
        {
            old: '<input type="text" name="name" class="pf-input" placeholder="Your Name" required>',
            new: '<label for="lead-name" class="sr-only">Your Name</label>\n                            <input type="text" id="lead-name" name="name" class="pf-input" placeholder="Your Name" required autocomplete="name">'
        },
        {
            old: '<input type="tel" name="phone" class="pf-input" placeholder="Phone Number" required>',
            new: '<label for="lead-phone" class="sr-only">Phone Number</label>\n                            <input type="tel" id="lead-phone" name="phone" class="pf-input" placeholder="Phone Number" required autocomplete="tel">'
        },
        {
            old: '<select name="service" class="pf-select">',
            new: '<label for="lead-service" class="sr-only">Service Type</label>\n                            <select id="lead-service" name="service" class="pf-select">'
        }
    ];

    for (const pattern of formPatterns) {
        if (content.includes(pattern.old) && !content.includes('sr-only')) {
            content = content.replace(new RegExp(escapeRegExp(pattern.old), 'g'), pattern.new);
            changed = true;
        }
    }

    if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ ${path.basename(filePath)}: Added form labels`);
        return true;
    }
    return false;
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Add sr-only CSS to styles.css
function addSrOnlyCSS() {
    const cssPath = path.join(__dirname, 'styles.css');
    let css = fs.readFileSync(cssPath, 'utf8');

    if (!css.includes('.sr-only')) {
        css += '\n' + srOnlyCSS;
        fs.writeFileSync(cssPath, css, 'utf8');
        console.log('✅ styles.css: Added .sr-only CSS class');
        return true;
    }
    console.log('⏭️  styles.css: .sr-only already exists');
    return false;
}

// Find all HTML files
function getAllHtmlFiles(dir) {
    const files = [];
    const items = fs.readdirSync(dir, { withFileTypes: true });

    for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
            files.push(...getAllHtmlFiles(fullPath));
        } else if (item.isFile() && item.name.endsWith('.html')) {
            files.push(fullPath);
        }
    }
    return files;
}

console.log('🔧 Fixing Form Accessibility...\n');

// Add CSS first
addSrOnlyCSS();

// Fix all HTML files
const htmlFiles = getAllHtmlFiles(__dirname);
let fixed = 0;

for (const file of htmlFiles) {
    if (fixFormAccessibility(file)) fixed++;
}

console.log(`\n✨ Fixed ${fixed} files with accessible form labels`);
