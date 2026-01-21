
const fs = require('fs');
const path = require('path');

// Configuration
const ROOT_DIR = __dirname;
const DOMAIN = 'https://veterangutterguards.com';
const TODAY = new Date().toISOString().split('T')[0];

console.log("🦎 Axolotl Protocol Initiated: Regenerating Site...");

// 1. REGENERATE LOCATIONS
try {
    console.log("   --> Regrowing Location Pages...");
    require('./generate-pages.js');
    console.log("   --> Applying Geo-Coordinates & Fixes...");
    require('./fix-locations.js');
} catch (e) {
    console.error("   !!! Error regenerating pages:", e.message);
}

// 2. REGENERATE SITEMAP
console.log("   --> Rebuilding Sitemap...");
try {
    let urls = [];
    function scanForSitemap(dir, baseUrl) {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
            const fp = path.join(dir, file);
            if (fs.statSync(fp).isDirectory()) {
                if (file !== 'node_modules' && file !== '.git' && file !== 'assets') {
                    scanForSitemap(fp, baseUrl + "/" + file);
                }
            } else if (file.endsWith('.html')) {
                let relPath = fp.replace(ROOT_DIR, '').replace(/\\/g, '/');
                if (relPath.startsWith('/')) relPath = relPath.substring(1);

                if (relPath.includes('admin') || relPath.includes('404') || relPath.includes('template') || relPath.includes('components')) return;

                let priority = "0.8";
                if (relPath === 'index.html') { priority = "1.0"; relPath = ""; }
                else if (relPath.includes('locations')) priority = "0.9";

                urls.push({
                    loc: `${DOMAIN}/${relPath}`,
                    lastmod: TODAY,
                    priority: priority
                });
            }
        });
    }
    scanForSitemap(ROOT_DIR, "");

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    urls.forEach(u => {
        xml += `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n    <priority>${u.priority}</priority>\n  </url>\n`;
    });
    xml += `</urlset>`;
    fs.writeFileSync(path.join(ROOT_DIR, 'sitemap.xml'), xml);
    console.log(`      + Indexed ${urls.length} pages.`);
} catch (e) {
    console.error("   !!! Error building sitemap:", e.message);
}
console.log("✅ Axolotl Transformation Complete.");
