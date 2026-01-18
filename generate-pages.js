const fs = require('fs');
const path = require('path');

// --- 1. Target Neighborhoods (The "Sprawl") ---
const neighborhoods = [
    // The Villages
    { name: "The Villages", slug: "the-villages", area: "The Villages" },
    { name: "Village of Fenney", slug: "village-of-fenney", area: "The Villages" },
    { name: "Village of Marsh Bend", slug: "village-of-marsh-bend", area: "The Villages" },
    { name: "Village of Monarch Grove", slug: "village-of-monarch-grove", area: "The Villages" },
    { name: "Village of DeLuna", slug: "village-of-deluna", area: "The Villages" },
    { name: "Ocala", slug: "ocala" },
    { name: "The Villages", slug: "the-villages" },
    { name: "Belleview", slug: "belleview" },
    { name: "Lady Lake", slug: "lady-lake" },
    { name: "Dunnellon", slug: "dunnellon" },
    { name: "Wildwood", slug: "wildwood" },
    { name: "Leesburg", slug: "leesburg" },
    { name: "Summerfield", slug: "summerfield" },
    { name: "Fruitland Park", slug: "fruitland-park" },
    { name: "Oxford", slug: "oxford" },
    { name: "Inverness", slug: "inverness" },
    { name: "Hernando", slug: "hernando" },
    { name: "Citrus Springs", slug: "citrus-springs" },
    { name: "Silver Springs Shores", slug: "silver-springs-shores" },
    { name: "Marion Oaks", slug: "marion-oaks" },
    { name: "Village of Fenney", slug: "village-of-fenney" },
    { name: "Village of Marsh Bend", slug: "village-of-marsh-bend" },
    { name: "Village of Monarch Grove", slug: "village-of-monarch-grove" },
    { name: "Village of DeLuna", slug: "village-of-deluna" },
    { name: "On Top of the World", slug: "on-top-of-the-world" },
    { name: "Stone Creek", slug: "stone-creek" },
    { name: "Oak Run", slug: "oak-run" },
    { name: "Pine Run", slug: "pine-run" },
    { name: "Marion Landing", slug: "marion-landing" }
];

// 2. Define Content Overrides for uniqueness
const contentOverrides = {
    'ocala': {
        heroTitle: 'Protecting Ocala\'s Homes, <span style="color: var(--gold);">Barns & Estates</span>',
        heroSubtext: 'Farm & Barn Solutions: We install high-capacity 6" gutters perfect for large rooflines on barns and estate homes. Veteran-owned and operated in Ocala.',
        metaDesc: 'Veteran-owned gutter installation for Ocala homes, barns, and estates. High-capacity seamless gutters and leaf protection.'
    },
    'the-villages': {
        heroTitle: 'Enjoy Your Retirement. <span style="color: var(--gold);">Stay Off The Ladder.</span>',
        heroSubtext: 'We specialize in Gutter Guards for The Villages. Never clean your gutters again. Protect your home and your safety with our lifetime warranty systems.',
        metaDesc: 'Gutter guards and installation for The Villages. Stay safe and off the ladder with our lifetime warranty leaf protection systems.'
    }
};

const locationsDir = path.join(__dirname, 'locations');

// Ensure locations directory exists
if (!fs.existsSync(locationsDir)) {
    fs.mkdirSync(locationsDir);
}

// Read the premium template (index.html)
let indexTemplate = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8');

// 3. Prepare the Template for Injection
// We need to make sure we're strictly replacing specific parts.
// Instead of generic {{NAME}}, we will identity specific blocks in index.html to replace.
// The index.html has:
// <h1>Protect Your Home with <span style="color: var(--gold);">Precision</span></h1>
// <p class="hero-subtext">Veteran-owned gutter installation and leaf protection. We don't just hang gutters; we engineer water management systems.</p>

// We will use more robust replacement by targeting the specific strings in index.html
const baseHeroTitle = '<h1>Protect Your Home with <span style="color: var(--gold);">Precision</span></h1>';
const baseHeroSubtext = '<p class="hero-subtext">Veteran-owned gutter installation and leaf protection. We don\'t just hang\n                    gutters; we engineer water management systems.</p>';
const baseTitle = '<title>Veteran Gutters & Guards - Ocala, FL</title>';
const baseMetaDesc = '<meta name="description"\n        content="Veteran-owned gutter installation and repair services in Ocala, FL. Seamless gutters, guards, fascia, and soffit repairs. Licensed, insured, and warranty-backed.">';

// Check if our base strings essentially exist (ignoring whitespace for safety if possible, but strict replace is safer for now)
if (!indexTemplate.includes('Protect Your Home with')) {
    console.error("CRITICAL: Template mismatch. Could not find Hero Title in index.html");
    process.exit(1);
}

neighborhoods.forEach(neighborhood => {
    let pageContent = indexTemplate;

    // --- A. Dynamic Content Injection ---

    // 1. Determine Content (Override or Default)
    const override = contentOverrides[neighborhood.slug];

    let heroTitle = override?.heroTitle
        ? `<h1>${override.heroTitle}</h1>`
        : `<h1>Protect Your <span style="color: var(--gold);">${neighborhood.name}</span> Home</h1>`;

    let heroSubtext = override?.heroSubtext
        ? `<p class="hero-subtext">${override.heroSubtext}</p>`
        : `<p class="hero-subtext">Veteran-owned gutter installation and leaf protection. We don't just hang gutters; we engineer water management systems for ${neighborhood.name} properties.</p>`;

    let metaDesc = override?.metaDesc
        ? `<meta name="description" content="${override.metaDesc}">`
        : `<meta name="description" content="Veteran-owned gutter installation and repair services in ${neighborhood.name}, FL. Seamless gutters, guards, fascia, and soffit repairs. Licensed, insured, and warranty-backed.">`;

    // 2. Perform Replacements
    // Title tag
    pageContent = pageContent.replace(/<title>.*<\/title>/, `<title>Veteran Gutters & Guards - ${neighborhood.name}, FL</title>`);

    // Meta Description
    // We use a regex to catch the multi-line meta desc in index.html
    pageContent = pageContent.replace(/<meta name="description"[\s\S]*?content="[\s\S]*?">/, metaDesc);

    // Hero Title
    // We replace the entire H1 tag
    pageContent = pageContent.replace(/<h1>[\s\S]*?<\/h1>/, heroTitle);

    // Hero Subtext
    // We replace the entire p.hero-subtext tag
    pageContent = pageContent.replace(/<p class="hero-subtext">[\s\S]*?<\/p>/, heroSubtext);

    // City Name Injections (General)
    // Replace "Ocala" with "{{NAME}}" in specific contexts if we missed any, 
    // BUT we must be careful not to break "Ocala" links in the footer or service area list.
    // Strategy: We will ONLY replace specific "Serving Ocala" text usage that isn't a link.
    // actually, let's use the {{NAME}} pattern for specific text we know is in the body

    // "Serving Ocala" (Veteran Badge)
    pageContent = pageContent.replace('Serving Ocala', `Serving ${neighborhood.name}`);

    // "Our Services in Ocala" (Services Header)
    // The index.html just says "Our Services". Let's make it local.
    pageContent = pageContent.replace('<h2>Our Services</h2>', `<h2>Our Services in ${neighborhood.name}</h2>`);

    // "Serving Ocala & Nearby Areas" (Check list)
    pageContent = pageContent.replace('Serving Ocala & Nearby Areas', `Serving ${neighborhood.name}`);

    // "See why Ocala homeowners trust us"
    pageContent = pageContent.replace('why Ocala homeowners', `why ${neighborhood.name} homeowners`);

    // "See Our Work [in Ocala]" - index says "See Our Work"
    pageContent = pageContent.replace('<h2 class="banner-title">See Our Work</h2>', `<h2 class="banner-title">See Our Work in ${neighborhood.name}</h2>`);

    // "Serving Ocala, The Villages, and..." (Banner Subtitle)
    pageContent = pageContent.replace(
        'Serving Ocala, The Villages, and surrounding communities.',
        `Serving ${neighborhood.name} and surrounding communities.`
    );

    // "Ready to protect your [Ocala] home?" (Final CTA) -> Index says "Ready for a clear...?"
    // Let's customize it.
    pageContent = pageContent.replace('Ready for a clear, no-pressure estimate?', `Ready to protect your ${neighborhood.name} home?`);

    // Storm Banner
    pageContent = pageContent.replace('Heavy rain detected in Ocala.', `Heavy rain detected in ${neighborhood.name}.`);

    // Schema Markup
    pageContent = pageContent.replace('"addressLocality": "Ocala"', `"addressLocality": "${neighborhood.name}"`);
    pageContent = pageContent.replace('"name": "Ocala"', `"name": "${neighborhood.name}"`); // areaServed

    // Form Source
    // Logic to insert a hidden input if it doesn't exist, or replace if it does.
    // Index doesn't have the source_page input usually, or it might.
    if (pageContent.includes('name="source_page"')) {
        pageContent = pageContent.replace(/value="Location:.*?"/, `value="Location: ${neighborhood.name}"`);
    } else {
        // Inject it before the button
        pageContent = pageContent.replace(
            '<button type="submit" class="pf-submit">',
            `<input type="hidden" name="source_page" value="Location: ${neighborhood.name}">\n                        <button type="submit" class="pf-submit">`
        );
    }

    // Canonical URL
    pageContent = pageContent.replace(
        '<link rel="canonical" href="https://veteranguttersguards.com/" />',
        `<link rel="canonical" href="https://veteranguttersguards.com/locations/${neighborhood.slug}.html" />`
    );
    pageContent = pageContent.replace(
        '<meta property="og:url" content="https://veteranguttersguards.com/">',
        `<meta property="og:url" content="https://veterangutterguards.com/locations/${neighborhood.slug}.html">`
    );

    // --- B. Relative Path Fixes ---
    // The generated files are in /locations/, so we need to go up one level (../) for assets.

    // Fix CSS/JS
    pageContent = pageContent.replace(/href="styles.css"/g, 'href="../styles.css"');
    pageContent = pageContent.replace(/src="scripts.js"/g, 'src="../scripts.js"');
    pageContent = pageContent.replace(/src="ChatWidget.js"/g, 'src="../ChatWidget.js"');

    // Fix Images
    pageContent = pageContent.replace(/src="assets\//g, 'src="../assets/');

    // Fix Internal Links
    // 1. Links to main pages (index, about, gallery, etc) -> prepend ../
    //    We need to be careful not to double-dot links that we might accidentally fix twice.
    //    Best regex: match href="[word]" where word is NOT starting with http, #, or ..

    const mainPages = ['index.html', 'about.html', 'club.html', 'gallery.html', 'partners.html'];
    mainPages.forEach(page => {
        const regex = new RegExp(`href="${page}"`, 'g');
        pageContent = pageContent.replace(regex, `href="../${page}"`);
    });

    // 2. Links to sections (e.g. #services) -> need to go to ../index.html#services
    pageContent = pageContent.replace(/href="#services"/g, 'href="../index.html#services"');
    pageContent = pageContent.replace(/href="#reviews"/g, 'href="../index.html#reviews"');
    pageContent = pageContent.replace(/href="#contact"/g, 'href="../index.html#contact"');

    // Exception: The "Check My Roof" or sticky CTA might link to #contact or #hero-form ON THE SAME PAGE.
    // We want to KEEP in-page anchors for things like "Get Quote" button if the form is on the same page.
    // The original code had <a href="#hero-form">. We should revert that change for specifically #hero-form if we want it to scroll.
    // BUT, index.html links to #services in the NAV. That should go to index.html#services strictly? 
    // Actually, usually "Services" is on the page... wait. 
    // The generated page HAS a services section. So #services should probably stay local?
    // User said "link to explaining services and gutter needs".
    // Let's keep NAV links pointing to Home, but internal page links (like CTA) working?
    // The Nav in index.html: <a href="#services">Services</a>.
    // If I am on /locations/ocala.html, clicking "Services" should scroll down to the local services.
    // So preserving href="#services" is correct.

    // BUT, what about `href="admin/index.html"`? -> `href="../admin/index.html"`
    pageContent = pageContent.replace(/href="admin\//g, 'href="../admin/');

    // Link to main logo anchor
    pageContent = pageContent.replace('href="#" class="brand"', 'href="../index.html" class="brand"');

    // 3. Links to Service Detail Pages (services/seamless-gutters.html)
    // These are in /services/, so from /locations/ they are ../services/
    pageContent = pageContent.replace(/href="services\//g, 'href="../services/');

    // 4. Links to Locations (in the footer/area list)
    // In index.html, they are href="locations/ocala.html".
    // From /locations/ocala.html, linking to "locations/dunnellon.html" (relative) would be /locations/locations/dunnellon.html -> WRONG.
    // It should be just "dunnellon.html" OR "../locations/dunnellon.html".
    // Since they are siblings in the same folder, "dunnellon.html" is correct.
    // So we replace "locations/" with "" for these links?
    // OR we replace "locations/" with "./"
    pageContent = pageContent.replace(/href="locations\//g, 'href="');


    // --- C. Write File ---
    const fileName = `${neighborhood.slug}.html`;
    const filePath = path.join(locationsDir, fileName);
    fs.writeFileSync(filePath, pageContent);
    console.log(`Generated: ${fileName}`);
});

console.log('All location pages generated successfully.');
