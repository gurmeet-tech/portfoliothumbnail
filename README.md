# Killer Gfx Thumbnail Portfolio

A static recreation of [killergfx.framer.website](https://killergfx.framer.website/) with self-hosted Creato Display typography and Lenis smooth scrolling.

**Live site:** <https://portfoliothumbnail.vercel.app/>

## Pages

- `index.html` — home page with portfolio tickers, results, reviews and FAQ
- `contact.html` — contact page with the enquiry form

## Desktop navigation

- At 1200px and above the centre navigation is a Dynamic Island-style capsule. It rests open at the top of the page, collapses after scrolling, and expands on hover or tap.
- The capsule has a JS spring animation for its width and height, so closing settles with a small Apple-style overshoot instead of a linear transition.
- The compact state names the section currently in view, while the circular arc shows document completion. The same arc wraps the mobile menu button, so progress is visible at every breakpoint.
- The active section is mirrored in the expanded links with `aria-current="location"`. It is a keyboard disclosure: Enter or Space opens it, and Escape closes it and returns focus to the compact trigger.

## Buttons

- CTAs use the OurFlex button system: a beveled primary blue gradient, white secondary gradient, 10px radius, 500 weight, and a dot-grid click ripple.
- The supplied 32px/14px tokens are available on the base `.btn-saas` class. Each portfolio CTA keeps its original width, height, and type size so the fixed desktop composition stays in place.
- The ripple and spring are disabled when `prefers-reduced-motion: reduce` is set.

## Responsive behaviour

- The original fixed-width composition is preserved at 1200px and above.
- Below 1200px the site switches to a touch-first layout: a dedicated slide-down menu, a full-screen stacked hero, edge-to-edge thumbnail rows, single-column content cards, and swipeable testimonials.
- Safe-area insets are respected on notched phones, and reduced-motion preferences disable the marquee, ticker, ripple, and spring animations.

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

All images and video are self-hosted under `assets/`. Creato Display is self-hosted under `assets/fonts/creato-display/` under the SIL Open Font License. Lenis 1.3.27 (MIT) is vendored under `assets/vendor/`.
