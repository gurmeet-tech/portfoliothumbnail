# Killer Gfx Thumbnail Portfolio

A static recreation of [killergfx.framer.website](https://killergfx.framer.website/) with Inter typography loaded from Google Fonts and Lenis smooth scrolling.

**Live site:** <https://portfoliothumbnail.vercel.app/>

## Pages

- `index.html` — home page with portfolio tickers, results, reviews and FAQ
- `contact.html` — contact page with the enquiry form

## Responsive behaviour

- The original fixed-width composition is preserved at 1200px and above.
- Below 1200px the site switches to a touch-first layout: a dedicated slide-down menu, a full-screen stacked hero, edge-to-edge thumbnail rows, single-column content cards, and swipeable testimonials.
- Safe-area insets are respected on notched phones, and reduced-motion preferences disable the marquee and ticker animations.

## Local preview

Serve the project root over HTTP rather than opening the HTML files directly:

```powershell
python -m http.server 4173
```

Then open <http://127.0.0.1:4173/>.

## Deployment

The site is plain HTML, CSS and JavaScript and needs no build step.

- **Vercel:** deployed from the `main` branch at <https://portfoliothumbnail.vercel.app/>. `vercel.json` enables clean URLs and long-lived caching for assets.
- **GitHub Pages:** publish from the repository root.

All images and video are self-hosted under `assets/`. Inter is loaded from Google Fonts. Lenis 1.3.27 (MIT) is vendored under `assets/vendor/`.
