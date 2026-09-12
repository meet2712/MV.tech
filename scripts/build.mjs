// Builds every public page of mvtech.solutions from content/ sources.
//
//   content/site.json          global facts, navigation, timezone windows
//   content/pages/*.html       hand-written pages: a <!--meta {json}--> header followed by <main>…</main>
//   content/consulting.json    service and engagement pages (rendered by templates.servicePage)
//   content/insights/*.html    articles: <!--meta {json}--> header followed by the article body
//   content/page-dates.json    registry of content hashes -> published / modified dates (kept accurate automatically)
//
// Outputs: <route>/index.html for every page, sitemap.xml, llms-full.txt, 404.html and the OG-image manifest.
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { attr, escapeHtml as h, fileFor, htmlToText, parseFragment, slugFor, stripTags, textContent, walk } from './html.mjs';
import { articlePage, callButton, icon, insightsIndex, servicePage } from './templates.mjs';

const site = JSON.parse(await readFile('content/site.json', 'utf8'));
const origin = site.origin;
const today = process.env.SITE_BUILD_DATE || new Date().toISOString().slice(0, 10);
const registryFile = 'content/page-dates.json';
const registry = JSON.parse(await readFile(registryFile, 'utf8').catch(() => '{}'));
const hash = (value) => createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex').slice(0, 16);
const jsonLd = (value) => JSON.stringify(value).replace(/</g, '\\u003c');

// ---------------------------------------------------------------------------------------------
// Collect pages
// ---------------------------------------------------------------------------------------------
function parseMetaFile(source, file) {
  const match = source.match(/^\s*<!--meta\s*([\s\S]*?)-->\s*([\s\S]*)$/);
  if (!match) throw new Error(`${file}: missing <!--meta {…}--> header`);
  let meta;
  try { meta = JSON.parse(match[1]); } catch (error) { throw new Error(`${file}: invalid meta JSON (${error.message})`); }
  return { meta, body: match[2].trim() };
}

const pages = [];

for (const name of (await readdir('content/pages')).filter((f) => f.endsWith('.html')).sort()) {
  const file = `content/pages/${name}`;
  const { meta, body } = parseMetaFile(await readFile(file, 'utf8'), file);
  pages.push({ ...meta, body, kind: meta.kind ?? 'page', source: file, hashSource: hash(JSON.stringify(meta) + body) });
}

const consulting = JSON.parse(await readFile('content/consulting.json', 'utf8'));
for (const page of consulting) {
  pages.push({
    route: page.path, title: page.title, description: page.description, name: page.name, kind: 'service', key: page.key,
    ogTitle: page.ogTitle ?? page.name, ogKicker: page.ogKicker ?? (page.path.startsWith('/services/') ? 'Service · Remote-first senior specialists' : 'How we work'),
    body: servicePage(page, site, consulting), service: page, source: 'content/consulting.json', hashSource: hash(page),
  });
}

const articles = [];
for (const name of (await readdir('content/insights').catch(() => [])).filter((f) => f.endsWith('.html')).sort()) {
  const file = `content/insights/${name}`;
  const { meta, body } = parseMetaFile(await readFile(file, 'utf8'), file);
  const words = stripTags(body).split(/\s+/).filter(Boolean).length;
  articles.push({ ...meta, route: meta.route ?? `/insights/${name.replace(/\.html$/, '')}/`, bodyHtml: body, words, readingTime: Math.max(3, Math.round(words / 220)), source: file, hashSource: hash(JSON.stringify(meta) + body) });
}

// Dates come from the registry; assign before rendering because templates print them.
function dates(page) {
  const entry = registry[page.route];
  if (!entry || entry.hash !== page.hashSource) {
    registry[page.route] = { hash: page.hashSource, published: entry?.published ?? page.published ?? today, modified: today };
  }
  return registry[page.route];
}
for (const page of pages) Object.assign(page, dates(page));
for (const article of articles) {
  Object.assign(article, dates(article));
  article.body = article.bodyHtml;
  pages.push({ ...article, kind: 'article', body: articlePage(article, site), article });
}
articles.sort((a, b) => b.published.localeCompare(a.published) || a.title.localeCompare(b.title));
{
  const indexPage = {
    route: '/insights/', name: 'Insights', kind: 'collection',
    title: 'Insights on Remote Engineering, Data & AI | MV.tech',
    description: 'Practical guides from MV.tech on working with remote engineering teams across timezones, hiring data consultants, RAG, MCP servers and engagement models.',
    ogTitle: 'Insights', ogKicker: 'Guides from the MV.tech engineering team',
    body: insightsIndex(articles, site), source: 'content/insights', hashSource: hash(articles.map((a) => a.route + a.title + a.description)),
    itemList: articles.map((a) => ({ name: a.title, url: origin + a.route })),
  };
  Object.assign(indexPage, dates(indexPage));
  pages.push(indexPage);
}
for (const page of pages.filter((p) => p.route === '/services/')) {
  page.itemList = consulting.filter((p) => p.path.startsWith('/services/')).map((p) => ({ name: p.name, url: origin + p.path }));
}

// Drop registry entries for pages that no longer exist so the file stays truthful.
for (const route of Object.keys(registry)) if (!pages.some((p) => p.route === route)) delete registry[route];
// Every printed date derives from page content, so rebuilding unchanged content is byte-for-byte reproducible.
const latest = pages.map((p) => p.modified).sort().at(-1);
const routes = new Set(pages.map((p) => p.route));
if (routes.size !== pages.length) throw new Error('Duplicate routes: ' + pages.map((p) => p.route).filter((r, i, a) => a.indexOf(r) !== i).join(', '));

// ---------------------------------------------------------------------------------------------
// Shared chrome
// ---------------------------------------------------------------------------------------------
const header = `<header id="main-header" class="site-header">
  <div class="container header-inner">
    <a href="/" class="brand-link" aria-label="MV.tech home"><img src="/images/logo.svg" alt="MV.tech" width="520" height="167"></a>
    <nav class="desktop-nav" aria-label="Main navigation">${site.nav.map((item) => `<a href="${item.href}" class="site-nav-link">${h(item.label)}</a>`).join('')}</nav>
    <div class="header-actions">${callButton(site, 'Book a call', 'button-primary header-cta')}<button id="mobile-menu-btn" class="mobile-toggle" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-menu">${icon('menu')}</button></div>
  </div>
  <nav id="mobile-menu" class="mobile-nav" hidden aria-label="Mobile navigation"><div class="container">${site.nav.map((item) => `<a href="${item.href}" class="site-nav-link">${h(item.label)}</a>`).join('')}<a href="/faq/" class="site-nav-link">FAQ</a>${callButton(site, 'Book a 30-minute call')}</div></nav>
</header>`;

const footerLinks = (items) => items.map((item) => `<a href="${item.href}"${item.external ? ' target="_blank" rel="noopener"' : ''}>${h(item.label)}</a>`).join('');
const footer = `<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand">
        <a href="/" aria-label="MV.tech home"><img src="/images/logo.svg" alt="MV.tech – Data, AI and digital solutions" width="520" height="167" loading="lazy"></a>
        <p>${h(site.summary)}</p>
        <p class="footer-worked">Our engineers have worked with ${site.workedWith.join(', ')}.</p>
      </div>
      <nav aria-label="Services"><h2>Services</h2>${footerLinks(site.footer.services)}</nav>
      <nav aria-label="Company"><h2>Company</h2>${footerLinks(site.footer.company)}</nav>
      <nav aria-label="Contact"><h2>Contact</h2>${footerLinks(site.footer.connect)}</nav>
    </div>
    <div class="footer-bottom"><p>&copy; ${latest.slice(0, 4)} ${h(site.name)}. All rights reserved.</p><p>${h(site.address.locality)}, ${h(site.address.region)}, ${h(site.address.countryName)} · GSTIN ${h(site.gstin)}</p><p><a href="/llms.txt">llms.txt</a> · <a href="/sitemap.xml">Sitemap</a></p></div>
  </div>
</footer>
<div class="sticky-cta" id="sticky-cta" hidden><a class="button-primary" href="${site.calendly}" target="_blank" rel="noopener">Book a call</a><a class="button-secondary" href="mailto:${site.email}">Email us</a></div>`;

const analytics = `<script async src="https://www.googletagmanager.com/gtag/js?id=${site.analyticsId}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${site.analyticsId}');</script>`;

// ---------------------------------------------------------------------------------------------
// Structured data
// ---------------------------------------------------------------------------------------------
function extractFaq(body) {
  const nodes = walk(parseFragment(body));
  return nodes.filter((n) => n.tagName === 'details').map((details) => {
    const summary = details.childNodes.find((c) => c.tagName === 'summary');
    const answer = details.childNodes.filter((c) => c !== summary && c.nodeName !== '#text').map((c) => textContent(c)).join(' ');
    return { question: textContent(summary).replace(/\s+/g, ' ').trim(), answer: answer.replace(/\s+/g, ' ').trim() };
  }).filter((item) => item.question && item.answer);
}

function schemaGraph(page) {
  const url = origin + page.route;
  const ogImage = `${origin}/images/og/${page.ogSlug ?? slugFor(page.route)}.jpg`;
  const organization = {
    '@type': ['Organization', 'ProfessionalService'], '@id': `${origin}/#organization`, name: site.name, legalName: site.legalName, alternateName: site.alternateNames,
    url: `${origin}/`, logo: { '@type': 'ImageObject', url: `${origin}/images/logo.png`, width: 1200, height: 384 }, image: `${origin}/images/og/home.jpg`,
    description: site.summary, slogan: 'Senior engineering in your timezone, without large-consultancy overhead', email: site.email,
    address: { '@type': 'PostalAddress', addressLocality: site.address.locality, addressRegion: site.address.region, addressCountry: site.address.country },
    areaServed: 'Worldwide', founder: { '@id': `${origin}/#founder` }, sameAs: [site.linkedin], knowsAbout: site.knowsAbout,
    contactPoint: { '@type': 'ContactPoint', contactType: 'sales', email: site.email, url: `${origin}/contact/`, areaServed: 'Worldwide', availableLanguage: ['English', 'Hindi', 'Gujarati'] },
    makesOffer: consulting.filter((p) => p.path.startsWith('/services/')).map((p) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: p.name, url: origin + p.path } })),
  };
  const founder = { '@type': 'Person', '@id': `${origin}/#founder`, name: site.founder.name, jobTitle: site.founder.jobTitle, description: site.founder.description, url: `${origin}/about/`, worksFor: { '@id': `${origin}/#organization` }, sameAs: site.founder.sameAs, knowsAbout: site.knowsAbout, hasCredential: site.credentials.map((c) => ({ '@type': 'EducationalOccupationalCredential', name: c.name, credentialCategory: c.category, recognizedBy: { '@type': 'Organization', name: c.issuer } })) };
  const website = { '@type': 'WebSite', '@id': `${origin}/#website`, name: site.name, alternateName: site.alternateNames.slice(0, 3), url: `${origin}/`, description: site.shortSummary, publisher: { '@id': `${origin}/#organization` }, inLanguage: 'en' };
  const crumbs = page.route === '/' ? null : [{ name: 'Home', url: origin + '/' }, ...(page.route.startsWith('/services/') && page.route !== '/services/' ? [{ name: 'Services', url: origin + '/services/' }] : []), ...(page.kind === 'article' ? [{ name: 'Insights', url: origin + '/insights/' }] : []), { name: page.name, url }];
  const types = { '/': 'WebPage', '/about/': 'AboutPage', '/contact/': 'ContactPage', '/services/': 'CollectionPage', '/insights/': 'CollectionPage', '/faq/': 'FAQPage' };
  const faq = extractFaq(page.body);
  const webpage = {
    '@type': types[page.route] ?? 'WebPage', '@id': `${url}#webpage`, url, name: page.pageTitle ?? page.title, description: page.description, isPartOf: { '@id': `${origin}/#website` }, about: { '@id': `${origin}/#organization` },
    primaryImageOfPage: { '@type': 'ImageObject', url: ogImage, width: 1200, height: 630 }, inLanguage: 'en', datePublished: page.published, dateModified: page.modified,
    ...(crumbs ? { breadcrumb: { '@id': `${url}#breadcrumb` } } : {}),
  };
  const graph = [organization, founder, website, webpage];
  if (crumbs) graph.push({ '@type': 'BreadcrumbList', '@id': `${url}#breadcrumb`, itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: c.url })) });
  if (page.kind === 'service') {
    webpage.mainEntity = { '@id': `${url}#service` };
    graph.push({ '@type': 'Service', '@id': `${url}#service`, name: page.service.name, serviceType: page.service.serviceType ?? page.service.name, description: page.service.intro, url, provider: { '@id': `${origin}/#organization` }, areaServed: 'Worldwide', availableChannel: { '@type': 'ServiceChannel', serviceUrl: `${origin}/contact/`, availableLanguage: 'English' } });
  }
  if (page.kind === 'article') {
    webpage.mainEntity = { '@id': `${url}#article` };
    graph.push({ '@type': 'Article', '@id': `${url}#article`, headline: page.title, description: page.description, image: ogImage, datePublished: page.published, dateModified: page.modified, author: { '@id': `${origin}/#founder` }, publisher: { '@id': `${origin}/#organization` }, mainEntityOfPage: { '@id': `${url}#webpage` }, wordCount: page.words, keywords: page.keywords ?? [], inLanguage: 'en', isAccessibleForFree: true });
  }
  if (page.itemList) graph.push({ '@type': 'ItemList', '@id': `${url}#list`, itemListElement: page.itemList.map((item, i) => ({ '@type': 'ListItem', position: i + 1, name: item.name, url: item.url })) });
  if (faq.length) {
    const questions = faq.map((item) => ({ '@type': 'Question', name: item.question, acceptedAnswer: { '@type': 'Answer', text: item.answer } }));
    if (page.route === '/faq/') webpage.mainEntity = questions;
    else { webpage.hasPart = { '@id': `${url}#faq` }; graph.push({ '@type': 'FAQPage', '@id': `${url}#faq`, mainEntity: questions }); }
  }
  return { '@context': 'https://schema.org', '@graph': graph };
}

// ---------------------------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------------------------
function layout(page, { noindex = false } = {}) {
  const url = origin + page.route;
  const ogImage = `${origin}/images/og/${page.ogSlug ?? slugFor(page.route)}.jpg`;
  const bodyClass = ['site-body', page.kind === 'article' ? 'is-article' : '', page.route === '/' ? 'is-home' : ''].filter(Boolean).join(' ');
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${h(page.pageTitle ?? page.title)}</title>
<meta name="description" content="${h(page.description)}">
${noindex ? '<meta name="robots" content="noindex, follow">' : '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">'}
<link rel="canonical" href="${url}">
${page.route === '/' ? `<meta name="google-site-verification" content="${site.googleSiteVerification}">${site.bingSiteVerification ? `\n<meta name="msvalidate.01" content="${h(site.bingSiteVerification)}">` : ''}` : ''}
<meta name="author" content="${h(page.kind === 'article' ? site.founder.name : site.name)}">
<meta name="theme-color" content="#05060B">
<link rel="icon" href="/images/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/images/favicon.ico" sizes="any">
<link rel="icon" href="/images/favicon-96.png" sizes="96x96" type="image/png">
<link rel="icon" href="/images/favicon-48.png" sizes="48x48" type="image/png">
<link rel="icon" href="/images/favicon-32.png" sizes="32x32" type="image/png">
<link rel="icon" href="/images/favicon-16.png" sizes="16x16" type="image/png">
<link rel="apple-touch-icon" href="/images/apple-touch-icon.png">
<link rel="mask-icon" href="/images/safari-pinned-tab.svg" color="#007E7B">
<link rel="manifest" href="/site.webmanifest">
<link rel="alternate" type="text/plain" title="AI-readable site summary" href="${origin}/llms.txt">
<link rel="alternate" type="text/plain" title="AI-readable full site context" href="${origin}/llms-full.txt">
<link rel="sitemap" type="application/xml" title="XML sitemap" href="${origin}/sitemap.xml">
<meta property="og:type" content="${page.kind === 'article' ? 'article' : 'website'}">
<meta property="og:site_name" content="${h(site.name)}">
<meta property="og:locale" content="en_US">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${h(page.pageTitle ?? page.title)}">
<meta property="og:description" content="${h(page.description)}">
<meta property="og:image" content="${ogImage}">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${h(page.ogTitle ?? page.name)} – MV.tech">
${page.kind === 'article' ? `<meta property="article:published_time" content="${page.published}">\n<meta property="article:modified_time" content="${page.modified}">\n<meta property="article:author" content="${h(site.founder.name)}">` : ''}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${h(page.pageTitle ?? page.title)}">
<meta name="twitter:description" content="${h(page.description)}">
<meta name="twitter:image" content="${ogImage}">
<meta name="twitter:image:alt" content="${h(page.ogTitle ?? page.name)} – MV.tech">
<link rel="preload" href="/fonts/inter-latin-var.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/css/site.css">
<script src="/js/icons.js" defer></script>
<script src="/js/site.js" defer></script>
<script type="application/ld+json">${jsonLd(schemaGraph(page))}</script>
${analytics}
</head>
<body class="${bodyClass}"${page.kind === 'service' ? ` data-service="${page.key}"` : ''}>
<a class="skip-link" href="#main-content">Skip to content</a>
${header}
${page.body}
${footer}
</body>
</html>
`;
}

// ---------------------------------------------------------------------------------------------
// Write outputs
// ---------------------------------------------------------------------------------------------
for (const page of pages) {
  const file = fileFor(page.route);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, layout(page));
}

// 404 page (GitHub Pages serves /404.html for unknown routes).
await writeFile('404.html', layout({
  route: '/404.html', kind: 'page', name: 'Page not found', title: 'Page not found | MV.tech', description: 'The page you requested does not exist. Find MV.tech services, insights and contact details.',
  published: latest, modified: latest, ogTitle: 'Page not found', ogSlug: 'home',
  body: `<main id="main-content"><section class="page-hero"><div class="container"><p class="eyebrow">404</p><h1>That page is not here.</h1><p class="lead">The address may have changed. These links cover most of what people look for.</p><div class="action-row"><a class="button-primary" href="/">Go to the homepage ${icon('arrow-right')}</a><a class="button-secondary" href="/services/">Browse services</a></div><div class="proof-links"><a href="/remote-consulting/">How we work across timezones</a><a href="/insights/">Insights</a><a href="/about/">About MV.tech</a><a href="/contact/">Contact</a></div></div></section></main>`,
}, { noindex: true }).replace(`<link rel="canonical" href="${origin}/404.html">\n`, ''));

// Sitemap with accurate modification dates.
const ordered = [...pages].sort((a, b) => (a.route === '/' ? -1 : b.route === '/' ? 1 : a.route.localeCompare(b.route)));
await writeFile('sitemap.xml', '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + ordered.map((p) => `  <url><loc>${origin}${p.route}</loc><lastmod>${p.modified}</lastmod></url>`).join('\n') + '\n</urlset>\n');

// Machine-readable full-site text for AI crawlers, generated from the same HTML people see.
const llmsHeader = `# MV.tech — full site context for AI assistants and crawlers

> ${site.summary}

Official website: ${origin}/
Brand name: ${site.name} (also searched as ${site.alternateNames.join(', ')})
Contact: ${site.email} · Book a call: ${site.calendly}
Founder: ${site.founder.name}, ${site.founder.jobTitle} (${site.founder.sameAs[0]})
LinkedIn: ${site.linkedin}
Location: ${site.address.locality}, ${site.address.region}, ${site.address.countryName} · Serves clients worldwide with agreed timezone overlap
Teams our engineers have worked with: ${site.workedWith.join(', ')}. ${site.workedWithNote}
Last generated: ${latest}. Short summary and answer guidance: ${origin}/llms.txt

This file is generated from the public pages listed below, so it always matches what visitors see. Each section is one page: title, canonical URL, meta description, then the page text.
`;
const llmsBody = ordered.map((p) => `\n---\n\n# ${p.pageTitle ?? p.title}\n\nURL: ${origin}${p.route}\nDescription: ${p.description}\nLast modified: ${p.modified}\n\n${htmlToText(p.body)}\n`).join('');
await writeFile('llms-full.txt', llmsHeader + llmsBody);

// OG manifest for scripts/build-og.mjs and the registry for the next build.
await writeFile('content/og-manifest.json', JSON.stringify(ordered.map((p) => ({ route: p.route, slug: slugFor(p.route), title: p.ogTitle ?? p.name, kicker: p.ogKicker ?? (p.kind === 'article' ? 'Insight' : site.shortSummary) })), null, 2) + '\n');
await writeFile(registryFile, JSON.stringify(Object.fromEntries(Object.entries(registry).sort(([a], [b]) => a.localeCompare(b))), null, 2) + '\n');

console.log(`Built ${pages.length} pages (${articles.length} articles), 404.html, sitemap.xml and llms-full.txt. Latest content change: ${latest}.`);
