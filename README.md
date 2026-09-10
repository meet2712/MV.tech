# MV.tech website

Static site for [mvtech.solutions](https://mvtech.solutions/), published from `main` by GitHub Pages. Every page is generated from `content/` by a small Node build so that metadata, structured data, breadcrumbs, dates and the AI-readable text files never drift apart.

## Edit content

| What | Where |
| --- | --- |
| Company facts, navigation, footer, timezone windows, "worked with" names | `content/site.json` |
| Home, About, Services overview, Solutions, Expertise, Process, FAQ, Privacy, Contact | `content/pages/*.html` — a `<!--meta {…}-->` JSON header (route, title, description, social-image text) followed by `<main>…</main>` |
| Service and engagement pages (`/services/*`, `/remote-consulting/`) | `content/consulting.json` |
| Insights articles | `content/insights/<slug>.html` — meta header (title, description, published date, keywords) followed by the article body. The filename becomes the URL. |
| Styles | `css/input.css` (design tokens at the top; `.band-light` switches a section to the light palette) |
| Behaviour (menu, sticky CTA, Calendly embed, email brief, analytics events) | `js/site.js` |
| Icons | `js/icons-entry.js` — import a Lucide icon before using a new `data-lucide` name |
| Short AI summary and answer guidance | `llms.txt` (hand-maintained; `llms-full.txt` is generated) |

FAQ blocks are plain `<details><summary>` markup; the build turns them into `FAQPage` structured data automatically and the tests fail if the two ever disagree.

## Build, test, publish

```sh
npm ci
npm run build      # pages, sitemap.xml, llms-full.txt, 404.html, css/site.css, js/icons.js
npm run build:og   # social-share images for new or changed pages (needs Chrome/Chromium installed)
npm test           # metadata, structured data, links, sitemap, registry, robots, manifest
git add -A && git commit -m "…" && git push
```

Commit the generated output together with the source change; GitHub Pages serves the committed files and the `Validate website` workflow rebuilds and fails if anything was forgotten. The `Notify search engines` workflow then submits every changed URL to IndexNow (Bing, Copilot, ChatGPT search, DuckDuckGo) about two minutes after the push.

`content/page-dates.json` records a content hash and the published/modified dates for every page. The build updates a page's `modified` date only when its content actually changes, so `<lastmod>` in the sitemap and `dateModified` in structured data stay truthful. Do not edit it by hand.

`npm run build:og` renders `images/og/<slug>.jpg` for each page listed in `content/og-manifest.json`. It uses an installed Google Chrome, Edge or Chromium; set `PW_EXECUTABLE=/path/to/chrome` if none is found, and `OG_FORCE=1` to regenerate everything after a design change.

## Adding a page or article

1. Create `content/pages/<name>.html` (with a `route`) or `content/insights/<slug>.html`.
2. `npm run build && npm run build:og && npm test`.
3. Link to it from a related page and, for a top-level page, from `nav`/`footer` in `content/site.json` and from `llms.txt`.

## Measurement

GA4 (`G-YRM2SJ2EMP`) records `contact_intent` for email and Calendly link clicks (`method`, `service`, `page_path`), `book_call` when the embedded Calendly widget confirms a booking on `/contact/`, and `brief_compose` when a visitor builds an email brief. Only `book_call` is a confirmed conversion; the others are intent.

See `docs/seo-maintenance.md` for the search and AI-visibility checklist.
