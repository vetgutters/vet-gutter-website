/**
 * Location Page Fixer Script
 * Fixes common issues across all location pages:
 * - Domain mismatch (veteranguttersguards -> veterangutterguards)
 * - Copyright year (2024 -> 2026)
 * - Grammar issues
 * - County text
 * - Admin links removal
 * - Favicon addition
 * - GTM placeholder fix
 */

const fs = require('fs');
const path = require('path');

const locationsDir = path.join(__dirname, 'locations');

// Location-specific geo coordinates
const geoCoordinates = {
    'ocala': { lat: 29.1872, lng: -82.1401 },
    'the-villages': { lat: 28.9019, lng: -81.9681 },
    'belleview': { lat: 29.0539, lng: -82.0612 },
    'dunnellon': { lat: 29.0461, lng: -82.4606 },
    'lady-lake': { lat: 28.9178, lng: -81.9297 },
    'wildwood': { lat: 28.8653, lng: -82.0401 },
    'leesburg': { lat: 28.8108, lng: -81.8778 },
    'summerfield': { lat: 29.0267, lng: -82.0028 },
    'fruitland-park': { lat: 28.8618, lng: -81.9067 },
    'oxford': { lat: 28.9378, lng: -82.0417 },
    'inverness': { lat: 28.8361, lng: -82.3298 },
    'hernando': { lat: 28.9000, lng: -82.3717 },
    'citrus-springs': { lat: 28.9931, lng: -82.4639 },
    'silver-springs-shores': { lat: 29.1033, lng: -82.0200 },
    'marion-oaks': { lat: 29.0111, lng: -82.2111 },
    'stone-creek': { lat: 29.1122, lng: -82.0578 },
    'on-top-of-the-world': { lat: 29.1050, lng: -82.1250 },
    'oak-run': { lat: 29.1189, lng: -82.1589 },
    'pine-run': { lat: 29.0667, lng: -82.0833 },
    'marion-landing': { lat: 29.0889, lng: -82.0611 },
    'village-of-fenney': { lat: 28.8833, lng: -82.0167 },
    'village-of-marsh-bend': { lat: 28.9333, lng: -81.9833 },
    'village-of-monarch-grove': { lat: 28.9100, lng: -81.9600 },
    'village-of-deluna': { lat: 28.9200, lng: -81.9700 },
    'village-of-citrus-grove': { lat: 28.8950, lng: -81.9850 }
};

// Replacements to apply
const replacements = [
    // Domain fixes
    { from: /veteranguttersguards\.com/g, to: 'veterangutterguards.com' },

    // Copyright year
    { from: /©\s*2024/g, to: '© 2026' },
    { from: /&copy;\s*2024/g, to: '&copy; 2026' },

    // Grammar fixes
    { from: /Easy online form for estimate we preferred times\./g, to: 'Fill out our simple form with your preferred times.' },
    { from: /Select a convenient preferred time window start\./g, to: 'Pick a time that works best for your schedule.' },
    { from: /Repairs or replaced soffit/g, to: 'Repair or replace damaged soffit' },

    // County text fix
    { from: /throughout\s+Marion County\./g, to: 'throughout Marion, Sumter, and Lake Counties.' },

    // GTM placeholder fix
    {
        from: /<noscript><iframe src="https:\/\/www\.googletagmanager\.com\/ns\.html\?id=GTM-XXXXXX"[^>]*>[^<]*<\/iframe><\/noscript>/g,
        to: '<!-- Google Tag Manager - TODO: Replace with real GTM ID -->\n    <!-- <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXX" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript> -->'
    },

    // Remove admin/partner links in footer
    {
        from: /<p style="font-size: 0\.8rem; margin-top: 10px;">\s*<a href="[^"]*admin[^"]*"[^>]*>Admin<\/a>\s*<a href="[^"]*partners[^"]*"[^>]*>Partner Portal<\/a>\s*<\/p>/gs,
        to: '<p style="font-size: 0.75rem; margin-top: 10px; color: #444;">Veteran-owned business proudly serving Central Florida.</p>'
    }
];

// Add favicon after stylesheet link if not present
function addFavicon(content) {
    if (!content.includes('rel="icon"')) {
        // Match stylesheet link with optional query string
        content = content.replace(
            /<link rel="stylesheet" href="\.\.\/styles\.css(\?v=\d+)?">/,
            '<link rel="stylesheet" href="../styles.css?v=3">\n    <link rel="icon" type="image/png" href="/assets/logo-shield.png">'
        );
    }
    return content;
}

// Fix geo coordinates based on location name
function fixGeoCoordinates(content, locationName) {
    const coords = geoCoordinates[locationName];
    if (coords) {
        // Replace latitude
        content = content.replace(
            /"latitude":\s*[\d.]+/,
            `"latitude": ${coords.lat}`
        );
        // Replace longitude  
        content = content.replace(
            /"longitude":\s*-?[\d.]+/,
            `"longitude": ${coords.lng}`
        );
    }
    return content;
}

// Localize reviews - change "in Ocala" to the local city
function localizeReviews(content, locationName) {
    const cityName = locationName
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

// Main processing
function processLocationPages() {
    const files = fs.readdirSync(locationsDir).filter(f => f.endsWith('.html'));

    // console.log(`Processing ${files.length} location pages...\n`);

    files.forEach(file => {
        const filePath = path.join(locationsDir, file);
        let content = fs.readFileSync(filePath, 'utf8');
        const locationName = file.replace('.html', '');

        // Apply all replacements
        replacements.forEach(rep => {
            content = content.replace(rep.from, rep.to);
        });

        // Add favicon
        content = addFavicon(content);

        // Fix geo coordinates
        content = fixGeoCoordinates(content, locationName);

        // Localize reviews
        content = localizeReviews(content, locationName);

        // Write back
        fs.writeFileSync(filePath, content, 'utf8');
        // console.log(`✓ Fixed: ${file}`);
    });

    // console.log('\n✅ All location pages updated!');
}

processLocationPages();