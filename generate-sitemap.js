const fs = require('fs');
const path = require('path');

const DOMAIN = 'https://veterangutterguards.com';
const TODAY = new Date().toISOString().split('T')[0];

console.log("🚀 Starting Protocol: The Indexer");

// 1. Core Pages
const corePages = [
    '',
    '/about.html',
    '/club.html',
    '/gallery.html',
    '/partners.html',
    '/services/gutter-guards.html',
    '/services/seamless-gutters.html',
    '/services/cleaning.html',
    '/services/repairs.html',
    '/services/fascia-soffit.html'
];

let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

// Add Core Pages
corePages.forEach(p => {
    sitemap += `  <url>
    <loc>${DOMAIN}${p}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>\n`;
});

// 2. Scan Locations Folder (The Spiderweb)
const locationsDir = path.join(__dirname, 'locations');
if (fs.existsSync(locationsDir)) {
    const files = fs.readdirSync(locationsDir);

    files.forEach(file => {
        if (file.endsWith('.html')) {
            sitemap += `  <url>
    <loc>${DOMAIN}/locations/${file}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>\n`;
        }
    });
    console.log(`✅ Indexed ${files.length} Location Pages.`);
}

sitemap += `</urlset>`;

// 3. Write Sitemap
fs.writeFileSync('sitemap.xml', sitemap);
console.log("🦅 sitemap.xml generated successfully.");
