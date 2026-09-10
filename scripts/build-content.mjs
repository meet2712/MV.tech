import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'parse5';
import { attr, escapeHtml as h, publicPages, routeFor, walk } from './html.mjs';

const origin = 'https://mvtech.solutions';
const pages = JSON.parse(await readFile('content/consulting.json', 'utf8'));
const footer = await readFile('partials/footer.html', 'utf8');
const home = await readFile('index.html', 'utf8');
const homeNodes = walk(parse(home, { sourceCodeLocationInfo: true }));
const slice = (node) => home.slice(node.sourceCodeLocation.startOffset, node.sourceCodeLocation.endOffset);
const header = await readFile('partials/header.html', 'utf8');
const analytics = homeNodes.filter((node) => node.tagName === 'script' && (
  attr(node, 'src')?.includes('googletagmanager.com') || node.childNodes?.some((child) => child.value?.includes("gtag('config'"))
)).map(slice).join('\n');
const contact = (page) => 'mailto:contact@mvtech.solutions?subject=' + encodeURIComponent(page.name + ' enquiry') + '&body=' + encodeURIComponent((page.enquiryFields ?? ['Project goal', 'Current systems', 'Target date', 'Timezone and preferred overlap', 'Budget range (optional)']).map((field) => field + ':').join('\n\n') + '\n');
const calendar = 'https://calendly.com/contact-mvtech/30min';
const jsonLd = (value) => JSON.stringify(value, null, 2).replace(/</g, '\\u003c');

for (const page of pages) {
  const url = origin + page.path;
  const servicePage = page.path.startsWith('/services/');
  const crumbs = [{ name: 'Home', url: origin + '/' }, ...(servicePage ? [{ name: 'Services', url: origin + '/services/' }] : []), { name: page.name, url }];
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebPage', '@id': url + '#webpage', url, name: page.title, description: page.description,
        isPartOf: { '@id': origin + '/#website' }, mainEntity: { '@id': url + '#service' },
        breadcrumb: { '@id': url + '#breadcrumb' }, inLanguage: 'en', dateModified: '2026-09-10' },
      { '@type': 'Service', '@id': url + '#service', name: page.name, serviceType: page.name,
        description: page.intro, url, provider: { '@id': origin + '/#organization' }, areaServed: 'Worldwide' },
      { '@type': 'BreadcrumbList', '@id': url + '#breadcrumb', itemListElement: crumbs.map((item, i) => (
        { '@type': 'ListItem', position: i + 1, name: item.name, item: item.url }
      )) },
    ],
  };
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${h(page.title)}</title>
  <meta name="description" content="${h(page.description)}">
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
  <link rel="canonical" href="${url}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="MV.tech">
  <meta property="og:title" content="${h(page.title)}">
  <meta property="og:description" content="${h(page.description)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${origin}/images/og-image.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="MV.tech Data-Powered Solutions">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${h(page.title)}">
  <meta name="twitter:description" content="${h(page.description)}">
  <meta name="twitter:image" content="${origin}/images/og-image.png">
  <meta name="theme-color" content="#000000">
  <link rel="icon" type="image/png" href="/images/favicon.png">
  <link rel="stylesheet" href="/css/site.css">
  <script src="/js/icons.js" defer></script>
  <script type="application/ld+json">${jsonLd(schema)}</script>
  ${analytics}
</head>
<body class="min-h-screen text-slate-300 font-sans" data-service="${page.key}">
${header}
<main id="main-content">
  <section class="consulting-intro">
    <div class="site-container">
      <nav aria-label="Breadcrumb" class="breadcrumbs">${crumbs.map((crumb, i) => i === crumbs.length - 1 ? `<span aria-current="page">${h(crumb.name)}</span>` : `<a href="${crumb.url}">${h(crumb.name)}</a><span aria-hidden="true">/</span>`).join('')}</nav>
      <p class="eyebrow">MV.tech / Senior remote specialists</p>
      <h1>${h(page.name)}</h1>
      <p class="intro-copy">${h(page.intro)}</p>
      <div class="action-row">
        <a class="button-primary" href="${calendar}" target="_blank" rel="noopener">${h(page.callLabel ?? 'Discuss your project')} <i data-lucide="arrow-right" aria-hidden="true"></i></a>
        <a class="button-secondary" href="${h(contact(page))}">Email your brief <i data-lucide="mail" aria-hidden="true"></i></a>
      </div>
      <p class="delivery-note">Remote from India. Worldwide delivery. Agreed overlap with your timezone.</p>
    </div>
  </section>
  <section class="content-band">
    <div class="site-container section-columns">
      <div><p class="eyebrow">The starting point</p><h2>${h(page.fitHeading)}</h2></div>
      <ul class="fit-list">${page.fit.map((item) => `<li><i data-lucide="check" aria-hidden="true"></i><span>${h(item)}</span></li>`).join('')}</ul>
    </div>
  </section>
  <section class="content-band content-band-light">
    <div class="site-container">
      <p class="eyebrow">What we can deliver</p><h2>${h(page.deliverablesHeading)}</h2>
      <div class="delivery-grid">${page.deliverables.map((item, i) => `<article><span class="item-number">0${i + 1}</span><h3>${h(item.title)}</h3><p>${h(item.text)}</p></article>`).join('')}</div>
      <ul class="tool-list" aria-label="Relevant capabilities">${page.tools.map((tool) => `<li>${h(tool)}</li>`).join('')}</ul>
    </div>
  </section>
  <section class="content-band">
    <div class="site-container section-columns">
      <div><p class="eyebrow">Scope with a clear outcome</p><h2>${h(page.scopeHeading)}</h2></div>
      <div><p class="body-copy">${h(page.scope)}</p><a class="text-link" href="/process/">See our delivery process <i data-lucide="arrow-right" aria-hidden="true"></i></a></div>
    </div>
  </section>
  <section class="content-band">
    <div class="site-container">
      <p class="eyebrow">Working together</p><h2>${h(page.approachHeading ?? 'A practical path from scope to delivery.')}</h2>
      <ol class="steps-grid">${page.approach.map((step, i) => `<li><span class="item-number">0${i + 1}</span><h3>${h(step.title)}</h3><p>${h(step.text)}</p></li>`).join('')}</ol>
      <div class="proof-links"><a href="/expertise/">Explore our technical expertise</a><a href="https://www.toptal.com/developers/resume/meet-vaghasia" target="_blank" rel="noopener">Meet Vaghasia on Toptal</a>${servicePage ? '<a href="/remote-consulting/">Timezones, team and engagement costs</a>' : ''}</div>
    </div>
  </section>
  <section class="content-band content-band-light">
    <div class="site-container section-columns">
      <div><p class="eyebrow">Before we begin</p><h2>Questions about ${h(page.name.toLowerCase())}.</h2></div>
      <div class="faq-list">${page.questions.map((item) => `<details><summary>${h(item.question)}<i data-lucide="chevron-down" aria-hidden="true"></i></summary><p>${h(item.answer)}</p></details>`).join('')}</div>
    </div>
  </section>
  <section class="content-band contact-band">
    <div class="site-container section-columns">
      <div><p class="eyebrow">Your next step</p><h2>${h(page.closingHeading ?? 'Tell us what needs to work better.')}</h2><p>${h(page.closingCopy ?? 'Bring your goal, current tools and preferred working hours. We can use the first conversation to clarify fit and an initial scope.')}</p></div>
      <div class="action-row"><a class="button-primary" href="${calendar}" target="_blank" rel="noopener">Book a 30-minute call <i data-lucide="calendar" aria-hidden="true"></i></a><a class="text-link" href="${h(contact(page))}">Email your brief</a></div>
    </div>
  </section>
</main>
<div id="site-footer">${footer}</div>
<script src="/js/site.js" defer></script>
</body>
</html>
`;
  const file = page.path.slice(1) + 'index.html';
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, html);
}

const files = await publicPages();
for (const file of files) {
  const html = await readFile(file, 'utf8');
  const nodes = walk(parse(html, { sourceCodeLocationInfo: true }));
  const replacements = [
    [nodes.find((item) => attr(item, 'id') === 'site-footer'), '<div id="site-footer">' + footer.trim() + '</div>'],
    [nodes.find((item) => item.tagName === 'header'), header.slice(header.indexOf('<header')).trim()],
  ];
  const mainSources = { 'index.html': 'content/home.html', 'contact/index.html': 'content/contact.html' };
  if (mainSources[file]) replacements.push([nodes.find((item) => item.tagName === 'main'), (await readFile(mainSources[file], 'utf8')).trim()]);
  let output = html;
  for (const [node, replacement] of replacements.sort((a, b) => b[0].sourceCodeLocation.startOffset - a[0].sourceCodeLocation.startOffset)) {
    if (!node) throw new Error(`Missing shared page element: ${file}`);
    const { startOffset, endOffset } = node.sourceCodeLocation;
    output = output.slice(0, startOffset) + replacement + output.slice(endOffset);
  }
  await writeFile(file, output);
}

const locations = files.map(routeFor).sort((a, b) => a === '/' ? -1 : b === '/' ? 1 : a.localeCompare(b));
await writeFile('sitemap.xml', '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + locations.map((route) => `  <url><loc>${origin}${route}</loc><lastmod>2026-09-10</lastmod></url>`).join('\n') + '\n</urlset>\n');
console.log(`Built ${pages.length} consulting pages, static footers and a ${locations.length}-page sitemap.`);
