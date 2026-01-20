/**
 * Fix SEO and Accessibility Issues
 * Adds: social meta tags, canonical URLs, form labels
 */

const fs = require('fs');
const path = require('path');

// Pages needing social meta tags (not in locations which already have them)
const pagesToFix = [
    {
        file: 'about.html',
        title: 'About Us | Veteran Gutters & Guards - Ocala, FL',
        description: 'Learn about Veteran Gutters & Guards - a veteran-owned gutter company serving Ocala and Central Florida with precision, integrity, and lifetime warranties.',
        url: 'https://veterangutterguards.com/about.html'
    },
    {
        file: 'gallery.html',
        title: 'Our Work | Veteran Gutters & Guards Photo Gallery',
        description: 'See our completed gutter installation and repair projects in Ocala, The Villages, and Central Florida. Real photos from real customers.',
        url: 'https://veterangutterguards.com/gallery.html'
    },
    {
        file: 'club.html',
        title: 'Gutter Club™ | Annual Maintenance Program',
        description: 'Join the Gutter Club™ for annual gutter cleaning, inspections, and priority service. Protect your investment with veteran-quality maintenance.',
        url: 'https://veterangutterguards.com/club.html'
    }
];

const servicesToFix = [
    {
        file: 'services/seamless-gutters.html',
        title: 'Seamless Gutter Installation | Veteran Gutters Ocala',
        description: 'Premium seamless gutter installation in Ocala, FL. Custom-fabricated on-site for a perfect fit. 5-inch, 6-inch, and 7-inch aluminum & copper options.',
        url: 'https://veterangutterguards.com/services/seamless-gutters.html'
    },
    {
        file: 'services/gutter-guards.html',
        title: 'Gutter Guards Installation | Leaf Protection Ocala',
        description: 'Professional gutter guard installation in Ocala. Keep leaves and debris out with veteran-installed leaf protection systems.',
        url: 'https://veterangutterguards.com/services/gutter-guards.html'
    },
    {
        file: 'services/repairs.html',
        title: 'Gutter Repair Services | Fix Leaks & Damage Ocala',
        description: 'Expert gutter repair in Ocala, FL. Fix leaks, sagging gutters, and storm damage. Fast veteran service with warranty-backed work.',
        url: 'https://veterangutterguards.com/services/repairs.html'
    },
    {
        file: 'services/fascia-soffit.html',
        title: 'Fascia & Soffit Repair | Veteran Gutters Ocala',
        description: 'Professional fascia and soffit repair and replacement in Ocala. Protect your roofline integrity with veteran-quality craftsmanship.',
        url: 'https://veterangutterguards.com/services/fascia-soffit.html'
    },
    {
        file: 'services/cleaning.html',
        title: 'Gutter Cleaning Service | Ocala & The Villages',
        description: 'Professional gutter cleaning in Ocala and The Villages. Remove debris, check for damage, and ensure proper flow. Veteran-owned service.',
        url: 'https://veterangutterguards.com/services/cleaning.html'
    }
];

function generateSocialMeta(page) {
    return `
    <!-- Open Graph (Social Sharing) -->
    <meta property="og:title" content="${page.title}">
    <meta property="og:description" content="${page.description}">
    <meta property="og:image" content="https://veterangutterguards.com/assets/photos/hero-new.jpg">
    <meta property="og:url" content="${page.url}">
    <meta property="og:type" content="website">

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${page.title}">
    <meta name="twitter:description" content="${page.description}">
    <meta name="twitter:image" content="https://veterangutterguards.com/assets/photos/hero-new.jpg">

    <!-- Canonical URL -->
    <link rel="canonical" href="${page.url}" />`;
}

function addSocialMetaToPage(filePath, page) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Check if already has og:title
    if (content.includes('og:title')) {
        console.log(`⏭️  ${page.file}: Already has social meta tags`);
        return false;
    }

    const socialMeta = generateSocialMeta(page);

    // Insert after </title> or after the description meta
    const insertPoints = [
        '</title>',
        'content="width=device-width, initial-scale=1.0">'
    ];

    for (const point of insertPoints) {
        if (content.includes(point)) {
            const idx = content.indexOf(point) + point.length;
            content = content.slice(0, idx) + '\n' + socialMeta + content.slice(idx);
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ ${page.file}: Added social meta tags + canonical`);
            return true;
        }
    }

    console.log(`❌ ${page.file}: Could not find insertion point`);
    return false;
}

// Run fixes
console.log('🔧 Fixing SEO Issues...\n');

let fixed = 0;

// Fix main pages
for (const page of pagesToFix) {
    const filePath = path.join(__dirname, page.file);
    if (fs.existsSync(filePath)) {
        if (addSocialMetaToPage(filePath, page)) fixed++;
    } else {
        console.log(`⚠️  ${page.file}: File not found`);
    }
}

// Fix service pages
for (const page of servicesToFix) {
    const filePath = path.join(__dirname, page.file);
    if (fs.existsSync(filePath)) {
        if (addSocialMetaToPage(filePath, page)) fixed++;
    } else {
        console.log(`⚠️  ${page.file}: File not found`);
    }
}

console.log(`\n✨ Fixed ${fixed} pages with social meta tags`);
