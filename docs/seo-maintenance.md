# Search and AI visibility: what is built in, and what still needs a human

## Built into the site

- One generated layout for every page: unique title and description, canonical URL, per-page social image, breadcrumbs, `lang="en"`, skip link, `<main id="main-content">`.
- Structured data on every page: `Organization` + `ProfessionalService` (with founder, credentials, offers and `knowsAbout`), `Person` (founder), `WebSite`, `WebPage`/`AboutPage`/`ContactPage`/`CollectionPage` with `datePublished`/`dateModified`, `BreadcrumbList`, `Service` on service pages, `Article` on insights, `FAQPage` wherever a `<details>` FAQ appears, `ItemList` on collection pages.
- Accurate dates: `content/page-dates.json` changes a page's modified date only when its content changes; the sitemap `<lastmod>` and JSON-LD use the same value.
- AI readability: `robots.txt` explicitly welcomes OpenAI, Anthropic, Perplexity, Google, Bing, Apple and other assistant crawlers; `llms.txt` (summary and answer guidance) and `llms-full.txt` (full page text, generated from the same HTML) are linked from every page's `<head>`.
- Performance: one self-hosted variable font, one 26 KB stylesheet, no runtime CSS framework, icons bundled at build time, no hero image, Calendly loaded only on the contact page when scrolled into view.
- Accessibility: WCAG 2.1 AA checks (axe-core) pass on the templates; keyboard-accessible menu, tables and FAQ toggles.
- Recrawl signals: `.github/workflows/indexnow.yml` submits changed URLs to IndexNow after every push to `main`.

## One-time setup still to do (needs your accounts)

1. **Google Search Console**: the site verification tag is already on the homepage. Add the property, submit `https://mvtech.solutions/sitemap.xml`, and use *URL Inspection → Request indexing* on the homepage, the six service pages and `/remote-consulting/` once after this release.
2. **Bing Webmaster Tools**: import the site from Search Console (one click) so Bing, Copilot and ChatGPT search index it quickly; IndexNow submissions will then show up under *IndexNow*.
3. **Google Business Profile** for "MV.tech" in Ahmedabad (service-area business, no public address needed). Google's AI answers for "consultancy in Ahmedabad" style questions lean heavily on Business Profiles.
4. **LinkedIn company page**: make sure the tagline, description and website match the wording on `/about/` (same entity description everywhere helps AI systems reconcile the company).
5. **Founder links**: add Meet's personal LinkedIn and any GitHub or conference profiles to `founder.sameAs` in `content/site.json`; entity resolution for the author improves E-E-A-T signals.

## Where AI assistants actually get "best consultancy" answers from

ChatGPT, Claude, Perplexity and Google AI Overviews rarely invent vendor lists; they lift them from directories and comparison articles. Being present and consistent in these places is the highest-leverage off-site work:

- **Clutch** and **GoodFirms** profiles (free), with services, location, minimum project size and at least two verified client reviews.
- **DesignRush**, **TechBehemoths**, **Crunchbase** and **G2 Services** listings with the same description as `/about/`.
- **Toptal** and **Turing** profiles kept current, since both are frequently cited for "vetted remote engineers".
- Guest posts or podcast appearances on data-engineering and AI-tooling sites that link to `/insights/`.
- Ask each happy client for a LinkedIn recommendation and, where permitted, a Clutch review. Once two or three exist, add a client-approved testimonials section to the homepage and `Review` structured data.

## Content plan (highest intent first)

1. One anonymised case study per service, in the format problem → constraints → what was built → verified before/after. Publish under `/insights/` with `Article` schema; link from the matching service page. Do not present the "useful first project" examples on service pages as claimed client results.
2. Regional landing pages only if there is real evidence of demand (Search Console queries such as "data engineering consultant for UK companies"). One page per region at most; never city-by-city duplicates.
3. Quarterly refresh of the Insights articles: update the date only when the content changes (the build handles this) and add new questions to the FAQ blocks as prospects ask them.
4. Candidate articles: "How to brief a remote data engineering team", "BigQuery vs Redshift for a small analytics team", "What an MCP server costs to run", "Evaluating a RAG assistant: a scorecard".

## Measure

- Search Console: impressions, clicks and average position per landing page; check that the six service pages and `/remote-consulting/` are indexed and gaining query variety.
- Bing Webmaster Tools: IndexNow submissions and crawl stats.
- GA4: `contact_intent` (clicks), `brief_compose` (email briefs built), `book_call` (confirmed Calendly bookings on `/contact/`). Report leads from `book_call` plus replies to email briefs, not from clicks.
- Every quarter, ask ChatGPT, Claude and Perplexity the questions your buyers ask ("remote data engineering consultancy that overlaps US hours", "who can build an MCP server for our business") and note whether MV.tech appears and whether the description is accurate. If a description is wrong, fix the page it came from and, if needed, the wording in `llms.txt`.

## Keep it honest

Claims on the site are deliberately specific and verifiable: named credentials link to their sources, "worked with" names are labelled as experience rather than endorsements, and no pricing or headcount is stated. Keep that standard when adding content; it is what makes the site quotable by AI systems and trustworthy to buyers.
