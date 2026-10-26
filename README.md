# Killer Gfx Thumbnail Portfolio

A static recreation of [killergfx.framer.website](https://killergfx.framer.website/) with SF Pro typography.

## Pages

- `index.html` — home page with portfolio tickers, results, reviews and FAQ
- `contact.html` — contact page with the enquiry form

## Local preview

Serve the project root over HTTP rather than opening the HTML files directly:

```powershell
python -m http.server 4173
```

Then open <http://127.0.0.1:4173/>.

## Deployment

The site is plain HTML, CSS and JavaScript and needs no build step.

- **Vercel:** import the repository and deploy the project root. `vercel.json` enables clean URLs and long-lived caching for assets.
- **GitHub Pages:** publish from the repository root.

All images, videos and SF Pro font files are self-hosted under `assets/`.
