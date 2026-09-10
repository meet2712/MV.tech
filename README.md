# MV.tech website

Static HTML published from `main` on GitHub Pages at https://mvtech.solutions/.

## Build and validate

```sh
npm ci
npm run build
npm test
```

Commit the generated HTML, `css/site.css`, `js/icons.js` and `sitemap.xml` together with their source changes. GitHub Pages serves the committed output.

- Edit the homepage in `content/home.html` and contact page in `content/contact.html`.
- Edit detailed consulting, staffing and recruitment pages in `content/consulting.json`.
- Edit shared navigation and footer in `partials/`.
- Other existing page content is maintained directly in its `index.html`.
- Shared interactions live in `js/site.js`; styles live in `css/input.css`.
- Add any new Lucide icon imports to `js/icons-entry.js` before rebuilding.
- Root `.html` files are compatibility redirects. Keep their clean canonical targets.

The build updates shared header/footer markup, generates consulting pages and includes every public HTML page in the sitemap. Keep the sitemap modification date accurate when publishing substantive updates.

## Measurement

GA4 `contact_intent` records email and Calendly link clicks, with `method`, `service` and `page_path`. A click is not a confirmed enquiry or booked meeting. Confirmed lead measurement requires the email/CRM or Calendly completion integration.

See `docs/seo-maintenance.md` for content priorities and search measurement.
