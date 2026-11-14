# MV.tech Solutions website

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
| Factual public-site index for retrieval tools | `llms.txt` (hand-maintained; `llms-full.txt` is generated) |

FAQ blocks are plain `<details><summary>` markup; the build turns them into `FAQPage` structured data automatically and the tests fail if the two ever disagree.

## Company name and legal entity

Three names, each with one job, all set in `content/site.json`:

| Field | Value | Used for |
| --- | --- | --- |
| `name` | MV.tech Solutions | The company name, written in full everywhere the company is named: copy, page titles, footer, copyright, `og:site_name`, structured-data `name` |
| `shortName` | MV.tech | Only what the logo artwork reads. It is an alternate name in structured data and the home-screen label in the web manifest, never a name for running text |
| `legalEntity.name` | BB & KV Inc. | The New York corporation behind the name, shown only where a legal party is needed: structured-data `legalName`, the About company information, the USA vendor details and contract FAQ, the privacy notice and `llms.txt` |

MV.tech Solutions is a registered assumed name (DBA), not a separate corporation, so it never carries Inc. or LLC. `npm test` fails if a page says otherwise, if a page uses the short form as the company name (only `/brand/` and `/faq/` may print it, to explain the logo), or if the legal entity appears outside the pages listed above. The legal entity is spelled in `content/site.json` only. Page sources use tokens instead of retyping it: `{{legal.name}}`, `{{legal.form}}`, `{{legal.line}}` (the full sentence), `{{legal.party}}` (the contracting-party form), `{{company.name}}` and `{{company.short}}`. The build fills them and fails on an unknown token. `llms.txt` is hand-maintained, so `npm test` checks that it states the same legal line.

The company has two offices, always listed New York first: New York, USA, and Ahmedabad, India (`offices` in `content/site.json`, which feeds the footer, the social images and the structured-data addresses). The `<!--us-company-note-->` marker renders the shared "Our offices" block from `usCompany`. Both offices are published at city level only. No New York street address or US phone number has been supplied, so none is published, in visible text or structured data; add them to `offices`, `/contact/`, `/about/`, `/us-clients/` and `llms.txt` together when they are. The engineering team works from the Ahmedabad office. The India GSTIN belongs to the India operation and is published as a labelled identifier, never as the US entity's tax ID.

The name, the legal entity and the offices went live together on 14 November 2026. When any of them changes again, update `content/site.json`, the pages listed above and `llms.txt` in one release, then work through the listings checklist in `docs/seo-maintenance.md` so the same facts appear everywhere search and AI engines read them.

## Build, test, publish

```sh
npm ci
npm run build      # pages, sitemap.xml, llms-full.txt, 404.html, css/site.css, js/icons.js
npm run build:og   # social-share images for new or changed pages (needs Chrome/Chromium installed)
npm test           # metadata, structured data, links, sitemap, registry, robots, manifest
git add -A && git commit -m "…" && git push
```

Commit the generated output together with the source change; GitHub Pages serves the committed files and the `Validate website` workflow rebuilds and fails if anything was forgotten. The `Notify search engines` workflow waits for this commit's Pages deployment, then submits changed URLs to IndexNow. Submission helps participating engines discover updates; it does not guarantee indexing or AI citations. Failed submissions fail the workflow so they remain visible.

`content/page-dates.json` records a content hash and the published/modified dates for every page. The build updates a page's `modified` date only when its content actually changes, so `<lastmod>` in the sitemap and `dateModified` in structured data stay truthful. Do not edit it by hand.

`npm run build:og` renders `images/og/<slug>.jpg` for each page listed in `content/og-manifest.json`. It uses an installed Google Chrome, Edge or Chromium; set `PW_EXECUTABLE=/path/to/chrome` if none is found, and `OG_FORCE=1` to regenerate everything after a design change.

## Adding a page or article

1. Create `content/pages/<name>.html` (with a `route`) or `content/insights/<slug>.html`.
2. `npm run build && npm run build:og && npm test`.
3. Link to it from a related page and, for a top-level page, from `nav`/`footer` in `content/site.json` and from `llms.txt`.

## Measurement

GA4 (`G-YRM2SJ2EMP`) runs only on the public website hosts, keeping local previews out of production traffic. It records `contact_intent` for email, phone and booking link clicks (`method`, `service`, `page_path`), `book_call` when the actual embedded Calendly iframe confirms a booking, and `brief_compose` when a visitor builds an email brief. Booking buttons lead to `/contact/#book-call`; an external Calendly fallback remains on the contact page. Only `book_call` confirms a booking; register it as a key event in GA4. External bookings and received emails require separate reconciliation.

Service pages declare three relevant `relatedServiceKeys` in `content/consulting.json`; articles declare `relatedArticleRoutes` in their meta header. These links are validated during the build so discovery follows the topic rather than file order. `npm test` also checks production-only analytics, contact intent, booking message validation and calendar load failures.

See `docs/seo-maintenance.md` for the search and AI-visibility checklist.
