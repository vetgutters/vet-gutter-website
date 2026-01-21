/**
 * Service Pages Fixer Script
 * Fixes common issues across all service pages
 */

const fs = require('fs');
const path = require('path');

const servicesDir = path.join(__dirname, 'services');

const replacements = [
    // Domain fixes
    { from: /veteranguttersguards\.com/g, to: 'veterangutterguards.com' },

    // Copyright year
    { from: /©\s*2024/g, to: '© 2026' },
    { from: /&copy;\s*2024/g, to: '&copy; 2026' },

    // Grammar fixes
    { from: /Repairs or replaced soffit/g, to: 'Repair or replace damaged soffit' },
];

// Add favicon after stylesheet link if not present
function addFavicon(content) {
    if (!content.includes('rel="icon"')) {
        content = content.replace(
            /<link rel="stylesheet" href="\.\.\/styles\.css">/,
            '<link rel="stylesheet" href="../styles.css">\n    <link rel="icon" type="image/png" href="/assets/logo-shield.png">'
        );
    }
    return content;
}

// Main processing
function processServicePages() {
    const files = fs.readdirSync(servicesDir).filter(f => f.endsWith('.html'));

    // console.log(`Processing ${files.length} service pages...\n`);

    files.forEach(file => {
        const filePath = path.join(servicesDir, file);
        let content = fs.readFileSync(filePath, 'utf8');

        // Apply all replacements
        replacements.forEach(rep => {
            content = content.replace(rep.from, rep.to);
        });

        // Add favicon
        content = addFavicon(content);

        // Write back
        fs.writeFileSync(filePath, content, 'utf8');
        // console.log(`✓ Fixed: ${file}`);
    });

    // console.log('\n✅ All service pages updated!');
}

processServicePages();