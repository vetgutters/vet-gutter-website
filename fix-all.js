/**
 * Final Fix Script - Catches all remaining issues
 */

const fs = require('fs');
const path = require('path');

const rootDir = __dirname;

// Find all HTML files recursively
function findHtmlFiles(dir) {
    const files = [];
    const items = fs.readdirSync(dir);

    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules' && !item.startsWith('temp')) {
            files.push(...findHtmlFiles(fullPath));
        } else if (item.endsWith('.html') && !item.startsWith('temp')) {
            files.push(fullPath);
        }
    }

    return files;
}

const replacements = [
    // Domain fixes
    { from: /veteranguttersguards\.com/g, to: 'veterangutterguards.com' },

    // Copyright year - various formats
    { from: /© 2024/g, to: '© 2026' },
    { from: /&copy; 2024/g, to: '&copy; 2026' },
    { from: /\u00A9 2024/g, to: '© 2026' },

    // Grammar fixes
    { from: /Easy online form for estimate we preferred times\./g, to: 'Fill out our simple form with your preferred times.' },
    { from: /Select a convenient preferred time window start\./g, to: 'Pick a time that works best for your schedule.' },
    { from: /Repairs or replaced soffit/g, to: 'Repair or replace damaged soffit' },

    // County text fix - more specific to avoid matching description meta
    { from: /communities throughout\s+Marion County\./g, to: 'communities throughout Marion, Sumter, and Lake Counties.' },
];

// Localize reviews
function localizeReviews(content, filePath) {
    const fileName = path.basename(filePath, '.html');

    // Only process location files
    if (!filePath.includes('locations')) return content;

    // Skip ocala.html - that one should say Ocala
    if (fileName === 'ocala') return content;

    const cityName = fileName
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
        .replace('Of ', 'of ');

    content = content.replace(
        /gutter guards in Ocala\./g,
        `gutter guards in ${cityName}.`
    );

    return content;
}

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Apply all replacements
    replacements.forEach(rep => {
        content = content.replace(rep.from, rep.to);
    });

    // Localize reviews
    content = localizeReviews(content, filePath);

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        return true;
    }
    return false;
}

// Main
const files = findHtmlFiles(rootDir);
console.log(`Found ${files.length} HTML files\n`);

let fixedCount = 0;
files.forEach(file => {
    const relativePath = path.relative(rootDir, file);
    if (processFile(file)) {
        console.log(`✓ Fixed: ${relativePath}`);
        fixedCount++;
    }
});

console.log(`\n✅ Fixed ${fixedCount} files`);
