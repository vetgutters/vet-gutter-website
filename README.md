# Veteran Gutters & Guards - Site Manual 📘

## 1. Quick Updates

### Changing the Phone Number
The phone number `(321) 278-7996` is hardcoded in most HTML files for performance.
1.  Open VS Code.
2.  Press `Ctrl + Shift + F` (Find in Files).
3.  Search: `(321) 278-7996`
4.  Replace with new number.

### Updating Gutter Club Price
1.  Open `club.html`.
2.  Find `$299`.
3.  Update the price in the Text and in the JavaScript logic at the bottom (Function `handleLeadSubmit` or similar).

### Adding a New Location
1.  Copy `locations/ocala.html`.
2.  Rename it (e.g., `locations/daytona.html`).
3.  Update:
    *   Title Tag
    *   Canonical Link
    *   City Name in H1 and Content
    *   Geo Coordinates in Schema (Line 60)
4.  Add the link to `sitemap.xml`, `sitemap.html`, and the footer of `index.html`.

## 2. Advanced Features

### Storm Protocol (`functions/api/weather.js`)
*   **What it does:** Checks OpenWeather API for Ocala.
*   **Logic:** If `isStorming = true`, a banner appears on the homepage offering "Priority Leak Inspections".
*   **Editing:** You can force it to true in `weather.js` for demos.

### Lead Defense (Honeypot)
*   **What it does:** A hidden field named `website_honey` traps bots.
*   **Logic:** If filled, the form submission is silently rejected. Humans won't see it.

## 3. Deployment
To deploy changes:
1.  Save all files.
2.  Open Terminal.
3.  Run:
    ```bash
    git add .
    git commit -m "Description of changes"
    git push origin main
    ```

## 4. Key Files
*   `index.html` - Homepage
*   `styles.css` - Main styling (Colors, Fonts)
*   `scripts.js` - Global logic (Mobile Menu, Scroll Animations)
*   `ChatWidget.js` - The AI scheduling bot

---
*Maintained by Veteran Gutters & Guards Tech Team*
