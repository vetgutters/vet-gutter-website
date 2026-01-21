const fs = require('fs');
const path = require('path');

const dirs = [
    { path: 'locations', expected: '../styles.css' },
    { path: 'services', expected: '../styles.css' }
];

let totalFiles = 0;
let passCount = 0;
let failCount = 0;
let failures = [];

console.log("🔍 STARTING TOTAL SITE AUDIT...\n");

dirs.forEach(dirConfig => {
    const dirPath = path.join(__dirname, dirConfig.path);
    if (!fs.existsSync(dirPath)) return;

    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.html'));

    files.forEach(file => {
        totalFiles++;
        const content = fs.readFileSync(path.join(dirPath, file), 'utf8');

        // Loose check for styles.css to account for query strings (?v=3)
        // and to ensure it's a relative path (../)
        const hasStyle = content.includes(dirConfig.expected);

        if (hasStyle) {
            passCount++;
        } else {
            failCount++;
            failures.push(`${dirConfig.path}/${file}`);
        }
    });
});

console.log("-".repeat(30));
console.log(`📂 Scanned: ${totalFiles} pages`);
console.log(`✅ PASSED:  ${passCount}`);
console.log(`❌ FAILED:  ${failCount}`);

if (failures.length > 0) {
    console.log("\n⚠️  FAILURES DETECTED IN:");
    failures.forEach(f => console.log(`   - ${f}`));
} else {
    console.log("\n✨ ALL PAGES VERIFIED.");
}
