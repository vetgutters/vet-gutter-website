const fs = require('fs');
const path = require('path');

// --- 1. Target Neighborhoods (The "Sprawl") ---
const neighborhoods = [
    // The Villages
    { name: "Village of Fenney", slug: "village-of-fenney", area: "The Villages" },
    { name: "Village of Marsh Bend", slug: "village-of-marsh-bend", area: "The Villages" },
    { name: "Village of Monarch Grove", slug: "village-of-monarch-grove", area: "The Villages" },
    { name: "Village of DeLuna", slug: "village-of-deluna", area: "The Villages" },
    { name: "Village of Citrus Grove", slug: "village-of-citrus-grove", area: "The Villages" },
    // Ocala HOAs
    { name: "On Top of the World", slug: "on-top-of-the-world", area: "Ocala" },
    { name: "Stone Creek", slug: "stone-creek", area: "Ocala" },
    { name: "Oak Run", slug: "oak-run", area: "Ocala" },
    { name: "Pine Run", slug: "pine-run", area: "Ocala" },
    { name: "Marion Landing", slug: "marion-landing", area: "Ocala" }
];

// --- 2. Template (Using Ocala content as base) ---
const template = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gutter Guards & Installation in {{NAME}} | Veteran Gutters</title>
    <meta name="description" content="Veteran-owned seamless gutter installation and leaf guards for homes in {{NAME}}. Protect your property with Ocala's most trusted veteran team.">
    <link rel="canonical" href="https://veterangutterguards.com/locations/{{SLUG}}.html" />
    
    <!-- Open Graph -->
    <meta property="og:title" content="Gutter Guards in {{NAME}} - Veteran Owned">
    <meta property="og:description" content="Serving {{NAME}} with military precision. Seamless gutters and micro-mesh guards. Free estimates.">
    <meta property="og:url" content="https://veterangutterguards.com/locations/{{SLUG}}.html">
    <meta property="og:type" content="website">

    <!-- Fonts/CSS -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:wght@500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../styles.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body>

    <!-- Nav -->
    <header class="sticky-nav">
        <div class="container nav-container">
            <a href="../index.html" class="brand">
                <img src="../assets/logo-shield.png" alt="Veteran Gutters Shield" class="brand-logo">
                <span class="brand-text">Veteran Gutters</span>
            </a>
            <nav class="desktop-nav">
                <a href="../index.html">Home</a>
                <a href="../index.html#services">Services</a>
                <a href="../index.html#contact" class="btn btn-primary">Get Quote ></a>
            </nav>
        </div>
    </header>

    <!-- Hero -->
    <section class="hero-section" style="min-height: 60vh;">
        <div class="container hero-container">
            <div class="hero-content">
                <div class="veteran-badge"><i class="fa-solid fa-medal"></i> Serving {{NAME}}</div>
                <h1>Expert Gutter Solutions for <span style="color: var(--gold);">{{NAME}}</span> Homes</h1>
                <p class="hero-subtext">We specialize in seamless gutters and leaf protection systems designed specifically for properties in {{NAME}} and {{AREA}}.</p>
                
                <a href="../index.html#hero-form" class="btn btn-primary btn-large">Get A Free Estimate ></a>
                
                <div class="mini-trust-icons" style="margin-top: 20px;">
                    <span><i class="fa-solid fa-check-circle" style="color: var(--gold);"></i> HOA Compliant</span>
                    <span><i class="fa-solid fa-check-circle" style="color: var(--gold);"></i> Licensed</span>
                </div>
            </div>
        </div>
    </section>

    <!-- Content -->
    <section class="section">
        <div class="container">
            <h2>Why {{NAME}} Homeowners Choose Us</h2>
            <p>Living in <strong>{{NAME}}</strong> means enjoying a beautiful community, but it also means dealing with Florida's heavy storms. Improper drainage can damage your foundation and landscaping.</p>
            <p>Veteran Gutters provides:</p>
            <ul class="check-list" style="margin: 20px 0;">
                <li><strong>HOA-Approved Colors:</strong> We match your home's palette perfectly.</li>
                <li><strong>Seamless Aluminum:</strong> No leaks, custom-measured for your exact roofline.</li>
                <li><strong>Micro-Mesh Guards:</strong> Never climb a ladder to clean leaves again.</li>
            </ul>
        </div>
    </section>

    <!-- Footer -->
    <footer>
        <div class="container footer-content">
            <p>&copy; 2024 Veteran Gutters & Guards • Serving {{NAME}} and all of {{AREA}}.</p>
        </div>
    </footer>

    <script src="../ChatWidget.js"></script>
    <script src="../scripts.js"></script>
</body>
</html>`;

// --- 3. Generation Loop ---
const outputDir = path.join(__dirname, 'locations');

console.log(`🚀 Starting Operation Sprawl... Generating ${neighborhoods.length} pages.`);

neighborhoods.forEach(hood => {
    let content = template
        .replace(/{{NAME}}/g, hood.name)
        .replace(/{{SLUG}}/g, hood.slug)
        .replace(/{{AREA}}/g, hood.area);

    const filePath = path.join(outputDir, `${hood.slug}.html`);
    fs.writeFileSync(filePath, content);
    console.log(`✅ Created: ${hood.slug}.html`);
});

console.log("Mission Complete. 🦅");
