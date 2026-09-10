// Shared HTML fragments and page templates. Everything here is plain string templating;
// escape user-facing text with h() when it comes from JSON.
import { escapeHtml as h } from './html.mjs';

export const icon = (name) => `<i data-lucide="${name}" aria-hidden="true"></i>`;

export function breadcrumbs(crumbs) {
  return `<nav aria-label="Breadcrumb" class="breadcrumbs"><ol>${crumbs.map((crumb, i) => i === crumbs.length - 1
    ? `<li><span aria-current="page">${h(crumb.name)}</span></li>`
    : `<li><a href="${crumb.url}">${h(crumb.name)}</a></li>`).join('')}</ol></nav>`;
}

export function callButton(site, label = 'Book a 30-minute call', cls = 'button-primary') {
  return `<a class="${cls}" href="${site.calendly}" target="_blank" rel="noopener">${h(label)} ${icon('arrow-right')}</a>`;
}

export function emailLink(site, subject, fields, label = 'Email your brief', cls = 'button-secondary') {
  const body = fields.map((field) => field + ':').join('\n\n') + '\n';
  const href = `mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return `<a class="${cls}" href="${h(href)}">${h(label)} ${icon('mail')}</a>`;
}

export function workedWith(site, heading = 'Teams our engineers have worked with') {
  return `<div class="logo-strip" aria-label="${h(heading)}"><p class="logo-strip-label">${h(heading)}</p><ul class="logo-strip-list">${site.workedWith.map((name) => `<li>${h(name)}</li>`).join('')}</ul></div>`;
}

export function overlapTable(site, { caption = 'Typical collaboration windows by client timezone', compact = false } = {}) {
  const rows = site.overlap.zones.filter((z) => !compact || ['New York', 'London', 'Berlin', 'Sydney'].includes(z.city));
  return `<div class="table-wrap" tabindex="0"><table class="data-table" id="timezone-overlap"><caption>${h(caption)}</caption><thead><tr><th scope="col">Your team</th><th scope="col">Overlap in your local time</th><th scope="col">Our hours (IST, UTC+5:30)</th></tr></thead><tbody>${rows.map((z) => `<tr><th scope="row">${h(z.city)} <span class="muted">${h(z.zone)}</span></th><td>${h(z.window)}</td><td>${h(z.ist)}</td></tr>`).join('')}</tbody></table></div><p class="table-note">${h(site.overlap.note)}</p>`;
}

/** Decorative visualisation of overlap windows (the real data lives in overlapTable). */
export function overlapGraphic(site) {
  const zones = site.overlap.zones.filter((z) => ['New York', 'London', 'Berlin', 'Sydney'].includes(z.city));
  const pct = (hour) => (hour / 24 * 100).toFixed(2);
  return `<figure class="overlap-card" aria-hidden="true">
  <div class="overlap-card-head"><span>Overlap planner</span><span>Your local time</span></div>
  ${zones.map((z) => `<div class="overlap-row"><div class="overlap-label"><strong>${h(z.city)}</strong><span>${h(z.zone)}</span></div><div class="overlap-track"><span class="overlap-day" style="left:${pct(9)}%;width:${pct(9)}%"></span><span class="overlap-band" style="left:${pct(z.start)}%;width:${pct(z.end - z.start)}%"><em>${h(z.window)}</em></span></div></div>`).join('')}
  <div class="overlap-scale"><span>0:00</span><span>6:00</span><span>12:00</span><span>18:00</span><span>24:00</span></div>
  <div class="overlap-legend"><span><i class="swatch swatch-day"></i>Your working day</span><span><i class="swatch swatch-band"></i>Hours we overlap</span></div>
</figure>`;
}

export function comparisonTable() {
  const rows = [
    ['Who does the work', 'Senior specialists you speak with directly', 'Layered account, delivery and offshore teams', 'One individual; depth varies'],
    ['Timezone overlap', 'Planned around your hours, any timezone', 'Usually local hours only', 'Depends on the individual'],
    ['Overhead you pay for', 'Lean remote model, no office or account layers', 'Offices, account management, bench costs', 'Low, but no team behind the work'],
    ['Continuity and cover', 'Team-backed, documented handover', 'Yes, at consultancy rates', 'Single point of failure'],
    ['Ownership model', 'Scoped project, embedded consultant or recruitment', 'Project or programme', 'Task by task'],
    ['Pricing', 'Agreed per engagement against a written scope', 'Premium day rates and minimum commitments', 'Hourly, with scope drift risk'],
  ];
  return `<div class="table-wrap" tabindex="0"><table class="data-table compare-table"><caption>How MV.tech compares with the usual alternatives</caption><thead><tr><th scope="col"><span class="sr-only">Consideration</span></th><th scope="col" class="highlight">MV.tech remote team</th><th scope="col">Large consultancy</th><th scope="col">Freelance marketplace</th></tr></thead><tbody>${rows.map(([label, a, b, c]) => `<tr><th scope="row">${h(label)}</th><td class="highlight">${h(a)}</td><td>${h(b)}</td><td>${h(c)}</td></tr>`).join('')}</tbody></table></div>`;
}

export function faqList(items) {
  return `<div class="faq-list">${items.map((item) => `<details><summary><span>${h(item.question)}</span>${icon('chevron-down')}</summary><div class="faq-answer"><p>${h(item.answer)}</p></div></details>`).join('')}</div>`;
}

export function ctaBand(site, { heading = 'Tell us what needs to work better.', copy = 'Bring the goal, the systems involved and your preferred working hours. The first call is a 30-minute scoping conversation, and you leave with a written next step.', subject = 'Project enquiry for MV.tech', fields = ['Project goal', 'Current systems', 'Target date', 'Timezone and preferred overlap', 'Budget range (optional)'], callLabel = 'Book a 30-minute call' } = {}) {
  return `<section class="band cta-band"><div class="container cta-grid"><div><p class="eyebrow">Your next step</p><h2>${h(heading)}</h2><p class="lead">${h(copy)}</p></div><div class="cta-actions">${callButton(site, callLabel)}${emailLink(site, subject, fields, 'Email your brief', 'button-secondary')}<a class="cta-email" href="mailto:${site.email}">${h(site.email)}</a><p class="cta-note">Remote from Ahmedabad, India · Overlap with any timezone · No obligation</p></div></div></section>`;
}

export function relatedServices(pages, currentKey, site) {
  const related = pages.filter((p) => p.key !== currentKey && p.path.startsWith('/services/')).slice(0, 3);
  return `<section class="band"><div class="container"><div class="section-heading"><div><p class="eyebrow">Related services</p><h2>Other ways we can help.</h2></div><a class="text-link" href="/services/">All services ${icon('arrow-right')}</a></div><div class="card-grid card-grid-3">${related.map((p) => `<a class="card card-link" href="${p.path}"><h3>${h(p.name)}</h3><p>${h(p.summary ?? p.intro)}</p><span class="card-more">Explore ${icon('arrow-right')}</span></a>`).join('')}</div></div></section>`;
}

/** Service and engagement pages generated from content/consulting.json. */
export function servicePage(page, site, allPages) {
  const servicePage = page.path.startsWith('/services/');
  const crumbs = [{ name: 'Home', url: '/' }, ...(servicePage ? [{ name: 'Services', url: '/services/' }] : []), { name: page.name, url: page.path }];
  const fields = page.enquiryFields ?? ['Project goal', 'Current systems', 'Target date', 'Timezone and preferred overlap', 'Budget range (optional)'];
  const subject = `${page.name} enquiry`;
  const remote = page.key === 'remote-consulting';
  return `<main id="main-content">
  <section class="page-hero">
    <div class="container">
      ${breadcrumbs(crumbs)}
      <p class="eyebrow">${h(page.eyebrow ?? 'Service · Remote-first senior specialists')}</p>
      <h1>${h(page.h1 ?? page.name)}</h1>
      <p class="lead">${h(page.intro)}</p>
      <div class="action-row">${callButton(site, page.callLabel ?? 'Discuss your project')}${emailLink(site, subject, fields)}</div>
      <ul class="fact-row" aria-label="Engagement facts"><li>${icon('map-pin')}Remote from Ahmedabad, India</li><li>${icon('clock-3')}Overlap with your timezone</li><li>${icon('users-round')}Senior specialists, direct access</li><li>${icon('file-check-2')}Scope agreed in writing</li></ul>
    </div>
  </section>
  <section class="band band-light">
    <div class="container split">
      <div><p class="eyebrow">The starting point</p><h2>${h(page.fitHeading)}</h2></div>
      <ul class="check-list">${page.fit.map((item) => `<li>${icon('check')}<span>${h(item)}</span></li>`).join('')}</ul>
    </div>
  </section>
  <section class="band">
    <div class="container">
      <div class="section-heading"><div><p class="eyebrow">What we deliver</p><h2>${h(page.deliverablesHeading)}</h2></div></div>
      <div class="card-grid card-grid-2">${page.deliverables.map((item, i) => `<article class="card"><span class="item-number">0${i + 1}</span><h3>${h(item.title)}</h3><p>${h(item.text)}</p></article>`).join('')}</div>
      <ul class="chip-list" aria-label="Relevant capabilities">${page.tools.map((tool) => `<li>${h(tool)}</li>`).join('')}</ul>
    </div>
  </section>
  ${remote ? `<section class="band band-light" id="timezones">
    <div class="container">
      <div class="section-heading"><div><p class="eyebrow">Timezone overlap</p><h2>Working hours planned around yours.</h2></div></div>
      <p class="lead measure">India Standard Time (UTC+5:30) sits between Asia-Pacific mornings and American mornings, so a remote team in Ahmedabad can share a substantial working window with almost any client. We agree the collaboration window before the engagement starts and keep written updates flowing outside it.</p>
      ${overlapTable(site)}
    </div>
  </section>
  <section class="band">
    <div class="container">
      <div class="section-heading"><div><p class="eyebrow">Compare the model</p><h2>Where the cost difference actually comes from.</h2></div></div>
      <p class="lead measure">A lean remote consultancy is not cheaper because the work is worse. It is cheaper because you are not paying for offices, account layers and idle bench capacity. Compare proposals on scope, seniority, validation, documentation and support, and the difference becomes visible.</p>
      ${comparisonTable()}
    </div>
  </section>` : ''}
  <section class="band ${remote ? 'band-light' : 'band-light'}">
    <div class="container split">
      <div><p class="eyebrow">A useful first project</p><h2>${h(page.scopeHeading)}</h2></div>
      <div><p class="body-copy">${h(page.scope)}</p><a class="text-link" href="/process/">See our delivery process ${icon('arrow-right')}</a></div>
    </div>
  </section>
  <section class="band">
    <div class="container">
      <div class="section-heading"><div><p class="eyebrow">Working together</p><h2>${h(page.approachHeading ?? 'A practical path from scope to delivery.')}</h2></div></div>
      <ol class="steps">${page.approach.map((step, i) => `<li><span class="item-number">0${i + 1}</span><h3>${h(step.title)}</h3><p>${h(step.text)}</p></li>`).join('')}</ol>
      <div class="proof-row">${workedWith(site)}<div class="proof-links"><a href="/expertise/">Explore our expertise</a><a href="${site.toptal}" target="_blank" rel="noopener">Meet Vaghasia on Toptal</a>${servicePage ? '<a href="/remote-consulting/">Timezones, team and engagement costs</a>' : '<a href="/services/">All services</a>'}</div></div>
    </div>
  </section>
  <section class="band band-light">
    <div class="container split">
      <div><p class="eyebrow">Before we begin</p><h2>Questions about ${h(page.name.toLowerCase())}.</h2><p class="body-copy">Not answered here? <a href="/contact/">Ask us directly</a> or read the <a href="/faq/">full FAQ</a>.</p></div>
      ${faqList(page.questions)}
    </div>
  </section>
  ${relatedServices(allPages, page.key, site)}
  ${ctaBand(site, { heading: page.closingHeading ?? 'Tell us what needs to work better.', copy: page.closingCopy ?? 'Bring your goal, current tools and preferred working hours. We use the first 30-minute conversation to clarify fit and an initial scope, and you leave with a written next step.', subject, fields, callLabel: 'Book a 30-minute call' })}
</main>`;
}

export function articlePage(article, site) {
  const crumbs = [{ name: 'Home', url: '/' }, { name: 'Insights', url: '/insights/' }, { name: article.name, url: article.route }];
  const fmt = (iso) => new Date(iso + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  return `<main id="main-content">
  <article class="article">
    <header class="page-hero article-hero">
      <div class="container narrow">
        ${breadcrumbs(crumbs)}
        <p class="eyebrow">${h(article.kicker ?? 'Insight')}</p>
        <h1>${h(article.title)}</h1>
        <p class="lead">${h(article.description)}</p>
        <p class="article-meta">By <a href="/about/">${h(site.founder.name)}</a>, ${h(site.founder.jobTitle)} · Published <time datetime="${article.published}">${fmt(article.published)}</time>${article.modified !== article.published ? ` · Updated <time datetime="${article.modified}">${fmt(article.modified)}</time>` : ''} · ${article.readingTime} min read</p>
      </div>
    </header>
    <div class="band band-light article-body">
      <div class="container narrow">
        ${article.body}
      </div>
    </div>
    <div class="band">
      <div class="container narrow author-box">
        <div class="author-mark" aria-hidden="true">MV</div>
        <div><p class="eyebrow">About the author</p><h2>${h(site.founder.name)}</h2><p>${h(site.founder.description)}</p><div class="proof-links"><a href="/about/">About MV.tech</a><a href="${site.toptal}" target="_blank" rel="noopener">Toptal profile</a><a href="/services/">Services</a></div></div>
      </div>
    </div>
  </article>
  ${ctaBand(site, { heading: 'Want help applying this?', copy: 'Book a 30-minute call with the engineers who would do the work. We can talk through your situation and suggest a practical next step, whether or not that involves MV.tech.' })}
</main>`;
}

export function insightsIndex(articles, site) {
  const fmt = (iso) => new Date(iso + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  return `<main id="main-content">
  <section class="page-hero">
    <div class="container">
      ${breadcrumbs([{ name: 'Home', url: '/' }, { name: 'Insights', url: '/insights/' }])}
      <p class="eyebrow">Insights</p>
      <h1>Practical guides on remote engineering, data and AI.</h1>
      <p class="lead">Written by the people who do the work. Plain answers to the questions teams ask before they hire a remote data, software or AI team.</p>
    </div>
  </section>
  <section class="band band-light">
    <div class="container">
      <div class="card-grid card-grid-2 article-grid">${articles.map((a) => `<a class="card card-link article-card" href="${a.route}"><p class="eyebrow">${h(a.kicker ?? 'Insight')}</p><h2>${h(a.title)}</h2><p>${h(a.description)}</p><span class="article-card-meta"><time datetime="${a.published}">${fmt(a.published)}</time> · ${a.readingTime} min read</span></a>`).join('')}</div>
    </div>
  </section>
  ${ctaBand(site, { heading: 'Have a question these guides do not answer?', copy: 'Tell us about your situation. A 30-minute call with the engineering team is usually enough to point you in a useful direction.' })}
</main>`;
}
