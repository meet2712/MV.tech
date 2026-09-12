// Validates the built site: metadata, structured data, links, sitemap, registry and AI-readability files.
// Run with `npm test`. Fails loudly so a broken page never reaches GitHub Pages.
import assert from 'node:assert/strict';
import { access, readdir, readFile } from 'node:fs/promises';
import { attr, parse, publicPages, routeFor, slugFor, textContent, walk } from './html.mjs';

const site = JSON.parse(await readFile('content/site.json', 'utf8'));
const origin = site.origin;
const files = await publicPages();


// A root-level <name>.html shadows the clean route /<name>/ on GitHub Pages, which resolves
// extensionless requests to <name>.html first. That served visitors a noindex redirect stub on
// /services, /about and six others while /insights and /brand — which had no colliding file —
// resolved correctly. Fail the build rather than let it come back.
{
  const entries = await readdir('.', { withFileTypes: true });
  const dirs = new Set(entries.filter((e) => e.isDirectory()).map((e) => e.name));
  const rootHtml = entries.filter((e) => e.isFile()).map((e) => e.name).filter((f) => f.endsWith('.html') && f !== '404.html' && f !== 'index.html');
  const shadowed = [];
  for (const file of rootHtml) {
    const route = file.replace(/\.html$/, '');
    if (dirs.has(route)) shadowed.push(`${file} shadows /${route}/`);
  }
  assert(shadowed.length === 0, `root .html files shadow clean routes: ${shadowed.join(', ')}`);
}

const routes = new Set(files.map(routeFor));
const registry = JSON.parse(await readFile('content/page-dates.json', 'utf8'));
const llmsFull = await readFile('llms-full.txt', 'utf8');
const llms = await readFile('llms.txt', 'utf8');
const titles = new Set();
const descriptions = new Set();
const warnings = [];
let linkCount = 0;
let schemaCount = 0;
let faqCount = 0;

const exists = (file) => access(file).then(() => true, () => false);

for (const file of files) {
  const html = await readFile(file, 'utf8');
  const nodes = walk(parse(html));
  const one = (tag, key, value) => nodes.find((node) => node.tagName === tag && (!key || attr(node, key) === value));
  const all = (tag, key, value) => nodes.filter((node) => node.tagName === tag && (!key || attr(node, key) === value));
  const route = routeFor(file);
  const url = origin + route;

  // Document basics
  assert.equal(attr(one('html'), 'lang'), 'en', `${file}: html lang must be "en"`);
  const title = textContent(one('title')).trim();
  const description = attr(one('meta', 'name', 'description'), 'content');
  assert(title && !titles.has(title), `${file}: missing or duplicate <title>`);
  assert(description && !descriptions.has(description), `${file}: missing or duplicate meta description`);
  if (title.length > 70) warnings.push(`${route}: title is ${title.length} characters (aim for <= 70)`);
  if (description.length < 70 || description.length > 175) warnings.push(`${route}: description is ${description.length} characters (aim for 70-160)`);
  titles.add(title);
  descriptions.add(description);
  assert.equal(all('h1').length, 1, `${file}: expected exactly one <h1>`);
  assert.equal(attr(one('link', 'rel', 'canonical'), 'href'), url, `${file}: wrong canonical`);
  assert.equal(attr(one('meta', 'property', 'og:url'), 'content'), url, `${file}: wrong og:url`);
  assert(!attr(one('meta', 'name', 'robots'), 'content')?.includes('noindex'), `${file}: page is blocked from indexing`);
  assert(one('main', 'id', 'main-content'), `${file}: <main id="main-content"> missing`);
  assert(one('a', 'class', 'skip-link'), `${file}: skip link missing`);
  assert(one('header') && one('footer'), `${file}: shared header/footer missing`);
  assert(one('script', 'src', '/js/site.js'), `${file}: site.js missing`);
  assert(one('link', 'rel', 'manifest'), `${file}: web manifest link missing`);
  assert(one('link', 'rel', 'icon'), `${file}: favicon missing`);
  if (route !== '/') assert(one('nav', 'aria-label', 'Breadcrumb'), `${file}: breadcrumb navigation missing`);

  // Social image exists on disk and matches the page slug
  const ogImage = attr(one('meta', 'property', 'og:image'), 'content');
  assert.equal(ogImage, `${origin}/images/og/${slugFor(route)}.jpg`, `${file}: og:image should be the per-page image`);
  assert(await exists(`images/og/${slugFor(route)}.jpg`), `${file}: social image images/og/${slugFor(route)}.jpg has not been generated (run npm run build:og)`);

  // Structured data
  const blocks = all('script', 'type', 'application/ld+json');
  assert(blocks.length >= 1, `${file}: JSON-LD missing`);
  for (const block of blocks) {
    const data = JSON.parse(textContent(block));
    schemaCount++;
    const graph = data['@graph'] ?? [data];
    const types = graph.map((n) => n['@type']).flat();
    assert(types.includes('Organization'), `${file}: Organization node missing from JSON-LD`);
    assert(types.includes('Person'), `${file}: founder Person node missing from JSON-LD`);
    const webpage = graph.find((n) => n['@id'] === `${url}#webpage`);
    assert(webpage, `${file}: WebPage node with @id ${url}#webpage missing`);
    assert(/^\d{4}-\d{2}-\d{2}$/.test(webpage.dateModified) && /^\d{4}-\d{2}-\d{2}$/.test(webpage.datePublished), `${file}: WebPage dates missing`);
    assert(webpage.datePublished <= webpage.dateModified, `${file}: datePublished after dateModified`);
    if (route !== '/') assert(types.includes('BreadcrumbList'), `${file}: BreadcrumbList missing`);
    if (route.startsWith('/services/') && route !== '/services/') assert(types.includes('Service'), `${file}: Service node missing`);
    if (route.startsWith('/insights/') && route !== '/insights/') {
      const article = graph.find((n) => n['@type'] === 'Article');
      assert(article && article.author && article.datePublished && article.headline, `${file}: Article schema incomplete`);
    }
    // FAQ schema must mirror the visible <details> questions exactly
    const details = all('details').filter((d) => d.childNodes.some((c) => c.tagName === 'summary'));
    const faqNode = graph.find((n) => n['@type'] === 'FAQPage') ?? (Array.isArray(webpage.mainEntity) ? { mainEntity: webpage.mainEntity } : null);
    if (details.length) {
      assert(faqNode, `${file}: page has ${details.length} FAQ items but no FAQPage schema`);
      assert.equal(faqNode.mainEntity.length, details.length, `${file}: FAQ schema count differs from visible questions`);
      const visible = details.map((d) => textContent(d.childNodes.find((c) => c.tagName === 'summary')).replace(/\s+/g, ' ').trim());
      assert.deepEqual(faqNode.mainEntity.map((q) => q.name), visible, `${file}: FAQ schema questions differ from visible questions`);
      faqCount += details.length;
    }
  }

  // Registry and AI text mirror the page
  assert(registry[route], `${file}: missing from content/page-dates.json`);
  assert(llmsFull.includes(`URL: ${url}\n`), `${file}: missing from llms-full.txt`);

  // Accessibility and hygiene
  const ids = nodes.map((node) => attr(node, 'id')).filter(Boolean);
  assert.equal(ids.length, new Set(ids).size, `${file}: duplicate element IDs (${ids.filter((id, i) => ids.indexOf(id) !== i).join(', ')})`);
  for (const img of all('img')) assert(attr(img, 'alt') !== undefined, `${file}: <img> without alt (${attr(img, 'src')})`);
  for (const link of all('a')) if (attr(link, 'target') === '_blank') assert(/noopener/.test(attr(link, 'rel') ?? ''), `${file}: target=_blank without rel=noopener (${attr(link, 'href')})`);
  assert(!html.includes('cdn.tailwindcss.com'), `${file}: runtime CSS compiler remains`);
  assert(!/\bclass="[^"]*\b(bg-slate|text-cyan|rounded-3xl|edge-card|glass)\b/.test(html), `${file}: legacy design-system classes remain`);

  // Internal references resolve
  for (const node of nodes.filter((item) => ['a', 'script', 'link', 'img', 'source'].includes(item.tagName))) {
    const href = attr(node, 'href') || attr(node, 'src');
    if (!href || href.startsWith('#')) continue;
    const target = new URL(href, url);
    if (target.origin !== origin) continue;
    const pathname = decodeURIComponent(target.pathname);
    const local = pathname === '/' ? 'index.html' : pathname.slice(1) + (pathname.endsWith('/') ? 'index.html' : '');
    assert(await exists(local), `${file}: broken internal reference ${href}`);
    if (target.hash && pathname === route) assert(ids.includes(decodeURIComponent(target.hash.slice(1))), `${file}: missing anchor ${href}`);
    if (node.tagName === 'a') assert(!pathname.endsWith('.html'), `${file}: legacy .html URL in a link (${href})`);
    linkCount++;
  }
}

// Sitemap, registry, robots, llms
const sitemap = await readFile('sitemap.xml', 'utf8');
const sitemapEntries = [...sitemap.matchAll(/<url><loc>([^<]+)<\/loc><lastmod>([^<]+)<\/lastmod><\/url>/g)];
assert.deepEqual(new Set(sitemapEntries.map((m) => new URL(m[1]).pathname)), routes, 'Sitemap does not match public HTML pages');
assert.equal(sitemapEntries.length, routes.size, 'Duplicate sitemap URL');
for (const [, loc, lastmod] of sitemapEntries) assert.equal(lastmod, registry[new URL(loc).pathname].modified, `Sitemap lastmod differs from registry for ${loc}`);
assert.deepEqual(new Set(Object.keys(registry)), routes, 'content/page-dates.json has routes that do not exist');
const robots = await readFile('robots.txt', 'utf8');
assert(robots.includes(`Sitemap: ${origin}/sitemap.xml`), 'robots.txt must reference the sitemap');
for (const bot of ['GPTBot', 'OAI-SearchBot', 'ClaudeBot', 'Claude-SearchBot', 'PerplexityBot', 'Googlebot', 'bingbot']) assert(robots.includes(bot), `robots.txt should explicitly welcome ${bot}`);
for (const route of routes) if (!route.startsWith('/insights/') || route === '/insights/') assert(llms.includes(origin + route), `llms.txt should link to ${route}`);
const manifest = JSON.parse(await readFile('site.webmanifest', 'utf8'));
for (const icon of manifest.icons) assert(await exists(icon.src.slice(1)), `manifest icon missing: ${icon.src}`);
assert(await exists('404.html'), '404.html must exist');
const notFound = await readFile('404.html', 'utf8');
assert(notFound.includes('noindex'), '404.html must be noindex');
// 404.html is not covered by publicPages(), so check its own image references here (og:image, icons).
for (const ref of new Set(notFound.match(/\/images\/[A-Za-z0-9._/-]+/g) ?? [])) {
  assert(await exists(ref.slice(1)), `404.html references a missing image: ${ref}`);
}
const consulting = JSON.parse(await readFile('content/consulting.json', 'utf8'));
for (const page of consulting) {
  assert(routes.has(page.path), `Missing service page ${page.path}`);
  assert(page.questions.length >= 3, `Fewer than three buyer questions on ${page.path}`);
}
const indexNow = (await readFile('.github/workflows/indexnow.yml', 'utf8')).match(/INDEXNOW_KEY:\s*([a-f0-9]{32})/);
assert(indexNow && await exists(`${indexNow[1]}.txt`), 'IndexNow key file must exist at the site root and match the workflow');

for (const warning of warnings) console.warn('WARN', warning);
console.log(`PASS: ${files.length} pages, ${schemaCount} JSON-LD graphs, ${faqCount} FAQ items with matching schema, ${linkCount} internal references. Metadata, structured data, sitemap dates, registry, robots, llms.txt and manifest verified.`);
