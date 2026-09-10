import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { parse } from 'parse5';
import { attr, publicPages, routeFor, textContent, walk } from './html.mjs';

const origin = 'https://mvtech.solutions';
const files = await publicPages();
const titles = new Set();
const descriptions = new Set();
const routes = new Set(files.map(routeFor));
let linkCount = 0;
let schemaCount = 0;

for (const file of files) {
  const html = await readFile(file, 'utf8');
  const nodes = walk(parse(html));
  const one = (tag, key, value) => nodes.find((node) => node.tagName === tag && (!key || attr(node, key) === value));
  const route = routeFor(file);
  const title = textContent(one('title'));
  const description = attr(one('meta', 'name', 'description'), 'content');
  assert(title && !titles.has(title), `${file}: missing or duplicate title`);
  assert(description && !descriptions.has(description), `${file}: missing or duplicate description`);
  titles.add(title);
  descriptions.add(description);
  assert.equal(nodes.filter((node) => node.tagName === 'h1').length, 1, `${file}: expected one H1`);
  assert.equal(attr(one('link', 'rel', 'canonical'), 'href'), origin + route, `${file}: wrong canonical`);
  assert.equal(attr(one('meta', 'property', 'og:url'), 'content'), origin + route, `${file}: wrong social URL`);
  assert(!attr(one('meta', 'name', 'robots'), 'content')?.includes('noindex'), `${file}: blocked from indexing`);
  assert(one('main', 'id', 'main-content'), `${file}: skip-link target missing`);
  assert(one('footer'), `${file}: no static footer`);
  assert(one('script', 'src', '/js/site.js'), `${file}: shared navigation missing`);
  assert(!html.includes('/js/footer.js'), `${file}: legacy footer injection remains`);
  assert(!html.includes('function setActiveNav'), `${file}: legacy menu script remains`);
  assert(!html.includes('cdn.tailwindcss.com'), `${file}: runtime CSS compiler remains`);
  for (const node of nodes.filter((item) => item.tagName === 'script' && attr(item, 'type') === 'application/ld+json')) {
    JSON.parse(textContent(node));
    schemaCount++;
  }
  const ids = nodes.map((node) => attr(node, 'id')).filter(Boolean);
  assert.equal(ids.length, new Set(ids).size, `${file}: duplicate element IDs`);
  for (const node of nodes.filter((item) => ['a', 'script', 'link', 'img'].includes(item.tagName))) {
    const href = attr(node, 'href') || attr(node, 'src');
    if (!href) continue;
    const url = new URL(href, origin + route);
    if (url.origin !== origin) continue;
    const target = url.pathname === '/' ? 'index.html' : url.pathname.slice(1) + (url.pathname.endsWith('/') ? 'index.html' : '');
    await access(target).catch(() => { throw new Error(`${file}: broken internal reference ${href}`); });
    if (url.hash && url.pathname === route) assert(ids.includes(decodeURIComponent(url.hash.slice(1))), `${file}: missing anchor ${href}`);
    if (node.tagName === 'a') assert(!url.pathname.endsWith('.html'), `${file}: legacy URL in navigation`);
    linkCount++;
  }
}

const sitemap = await readFile('sitemap.xml', 'utf8');
const sitemapRoutes = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1]).pathname);
assert.deepEqual(new Set(sitemapRoutes), routes, 'Sitemap does not match public HTML pages');
assert.equal(sitemapRoutes.length, routes.size, 'Duplicate sitemap URL');
const consulting = JSON.parse(await readFile('content/consulting.json', 'utf8'));
for (const page of consulting) {
  assert(routes.has(page.path), `Missing service page ${page.path}`);
  assert(page.questions.length >= 3, `Missing buyer questions on ${page.path}`);
}
console.log(`PASS: ${files.length} pages, ${schemaCount} JSON-LD blocks and ${linkCount} internal references. Unique metadata, clean URLs, static service links and sitemap verified.`);
