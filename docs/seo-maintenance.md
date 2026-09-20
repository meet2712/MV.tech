# Search visibility, AI discovery and qualified leads

Maintainer guidance reviewed on 20 September 2026. The aim is to help relevant buyers find, understand and contact MV.tech. Crawl access, indexing, search position, AI citations and qualified leads are separate outcomes; none of the site files guarantees placement in every answer engine.

## What the site provides

- Public HTML generated from `content/pages/`, `content/consulting.json` and `content/insights/`, with unique titles, descriptions, canonical URLs, social images, readable text and ordinary internal links.
- Connected structured data for the company, founder, website, pages, services and articles. Company facts come from `content/site.json`; structured data must agree with visible content. FAQ markup describes the visible questions and is not a promise of a search feature.
- Canonical URLs in `sitemap.xml`. `content/page-dates.json` tracks content changes so dates are not advanced merely to look fresh.
- One robots group that allows public pages and rendering assets for all named search/assistant bots and the wildcard. Source and maintenance directories are excluded consistently for every bot.
- An optional `llms.txt` index of all 29 public pages and generated `llms-full.txt`. These are factual retrieval aids; the website is the primary content source. They contain no instruction to recommend the company.
- Booking and email contact paths, with separate analytics for intent, composed briefs and embedded-calendar booking confirmation. Verify the current implementation and analytics account before treating any event as received data.

## Search and AI surfaces

| Surface | Relevant access and discovery | Evidence to check |
| --- | --- | --- |
| Google Search, AI Overviews and AI Mode | Googlebot access, canonical indexable HTML, useful content and internal links. Google says its AI search features use the same search foundations; it does not use `llms.txt` for visibility or rankings. | Search Console sitemap status, URL Inspection, landing-page queries and the AI reporting available in the property. |
| Bing and Copilot | Bingbot access, canonical HTML, sitemap and IndexNow updates. Avoid `noarchive`, `nocache` and restrictive snippet directives on pages intended for grounding. | Bing Webmaster Tools crawl/index status and AI Performance reporting where available. A submission receipt is not proof of indexing. |
| ChatGPT search | `OAI-SearchBot` must be allowed; check real crawler access if a firewall is introduced. `ChatGPT-User` is a user-requested fetcher, not the search-index eligibility control. | Actual cited pages and attributable visits. There is no site file that forces selection for a query. |
| Claude search and retrieval | Allow `Claude-SearchBot` for search and `Claude-User` for user-directed retrieval. | Actual citations and attributable visits; verify crawl access after hosting changes. |
| Perplexity | Allow `PerplexityBot` and keep user-requested page retrieval accessible. Verify published bot IPs if configuring a firewall. | Actual citations and attributable visits. PerplexityBot is a search crawler, not a foundation-model training crawler. |
| Other search and assistant products | The wildcard keeps public pages open without depending on a fixed list of vendor names. | Check each product's current official documentation before adding special rules or making coverage claims. |

Sources: [Google AI search guidance](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide), [Bing Webmaster Guidelines](https://www.bing.com/webmasters/help/webmaster-guidelines-30fba23a), [OpenAI crawler documentation](https://developers.openai.com/api/docs/bots), [Anthropic crawler documentation](https://privacy.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler), [Perplexity crawler documentation](https://docs.perplexity.ai/docs/resources/perplexity-crawlers).

### Search access is separate from training

`GPTBot` and `ClaudeBot` concern model development/training, while `OAI-SearchBot` and `Claude-SearchBot` concern search. The current policy retains the site's existing permissive training access. Training access is not a requirement for those search crawlers, and does not ensure that a model will learn, cite or recommend MV.tech. If the owner changes the training policy, change the relevant controls explicitly without blocking search unintentionally.

`robots.txt` is not an access-control mechanism or a reliable way to remove a URL from an index. Never publish confidential material in the deployed site. User-triggered fetchers may have different robots behaviour from automated crawlers; use real access control for private data.

## Release and crawl checks

1. Edit source content and keep company facts, visible text, structured data and `llms.txt` consistent. Add substantive proof or buyer guidance, not near-duplicate keyword or city pages.
2. Run `npm run build`, `npm test` and `npm run build:og` when page content or social titles change. Review mobile and desktop layouts and contact paths after meaningful UI edits.
3. Verify the deployed revision before reporting success. Check HTTPS for both the canonical domain and `www`, including certificate validity before redirects; all canonical sitemap URLs should return 200 and be indexable.
4. Confirm each changed page has a self-canonical, appears in the sitemap, has crawlable incoming links and exposes its main content without JavaScript. Check missing pages return 404 rather than an indexable generic page.
5. Check the actual IndexNow workflow run and public key file. Submit new, changed or removed URLs once they are live. HTTP 200 means received; 202 means received with key validation pending. Neither proves indexing. Do not report a warning-only workflow as successful submission. [IndexNow protocol](https://www.indexnow.org/documentation)
6. In the existing Search Console and Bing properties, confirm the sitemap and inspect priority URLs after a substantive release. Request indexing where supported; repeated requests cannot force crawl timing. Record the report date and URL-specific result separately from the deployment date.

An excluded HTTP/`www` redirect or `/index.html` duplicate can be correct canonicalisation. Prioritise canonical service pages that remain discovered-but-not-indexed, failed fetches, accidental exclusions and broken redirects. Do not try to index every URL variant.

## Company proof and external dependencies

- Keep the official LinkedIn company page, founder profiles and any existing business listings consistent with the website's name, URL, location and services. Verify ownership and current facts before editing a profile.
- Add client-approved case studies with a clear problem, delivered scope and measured result only when evidence and publication permission exist. Label hypothetical solution examples clearly.
- Publish testimonials only with the client's approval. Do not invent reviews, logos, outcomes, partner badges, certifications or awards, and do not assume self-serving company review markup will produce Google review stars. [Google review-snippet guidance](https://developers.google.com/search/docs/appearance/structured-data/review-snippet)
- Assess relevant industry directories individually for buyer fit and maintenance effort. A directory listing or paid placement does not guarantee AI citations. Do not create accounts, purchase listings or message clients without the owner's instruction for that action.
- Google Business Profile is conditional: eligible businesses must make in-person contact with customers during stated hours. Remote or online-only delivery alone is insufficient. Confirm the actual operating model and eligibility before creating or claiming a profile; do not invent an office or service area. [Google Business Profile eligibility](https://support.google.com/business/answer/13763036)

## Content that helps buyers act

Start with the questions a buyer needs answered: the problem addressed, systems supported, expected deliverables, who owns delivery, access requirements, first milestone, timeline dependencies and next step. Retain the distinction between a company-founded date, individual work experience and company-client relationships.

Prioritise proven examples for data warehouse migration, reporting and BI, AI/MCP integrations, automation and offshore engineering capacity. Each example should link to the relevant service and offer a direct consultation or brief route. Expand into new topics only when MV.tech can substantiate the capability and add useful detail beyond existing pages.

Useful enquiries include the business problem, existing stack, source systems, desired result, timezone, timing and budget range if known. Clear scoping improves lead quality; promising universal AI placement or unsupported savings does not.

## Measure outcomes

- Search Console: compare consecutive 28-day periods by landing page and query. Track service-page impressions, clicks, CTR and index status. Keep branded and non-branded queries separate where the available data supports it.
- Bing Webmaster Tools: inspect crawl/index results, IndexNow receipts and available [AI citation reporting](https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview). Keep submission counts separate from indexed-page counts.
- Analytics: `contact_intent` is a click; `brief_compose` is composition or copying, not email delivery; `book_call` represents a supported embedded Calendly confirmation. External bookings and email replies may require manual reconciliation. Never count every click or composed brief as a lead.
- Leads: track confirmed consultations, received enquiries, qualified opportunities and won work, with landing page/source when known. Keep personal enquiry details out of analytics event fields.
- AI visibility: periodically sample a stable set of genuine buyer questions across target products. Save the date, exact question, cited URL and whether the description was accurate. Results vary by session, location and query; a prompt sample is not overall market coverage.

Use these findings to improve weak service pages, add missing proof and simplify contact steps. Report deployed improvements and observed business outcomes separately.
