// Renders a 1200x630 social-share image for every page listed in content/og-manifest.json (written by build.mjs).
// Uses playwright-core with a locally installed browser, so `npm run build` stays browser-free for CI.
//   npm run build:og                      -> uses Google Chrome / Chromium found on this machine
//   PW_EXECUTABLE=/path/to/chrome npm run build:og
// Set OG_FORCE=1 to regenerate images that already exist.
import { readFile, mkdir, access, copyFile } from 'node:fs/promises';
import { chromium } from 'playwright-core';

const site = JSON.parse(await readFile('content/site.json', 'utf8'));
const manifest = JSON.parse(await readFile('content/og-manifest.json', 'utf8'));
const logo = await readFile('images/logo-light.svg', 'utf8');
await mkdir('images/og', { recursive: true });

const escape = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const font = (await readFile('fonts/inter-latin-var.woff2')).toString('base64');

const template = ({ title, kicker }) => `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Inter;src:url(data:font/woff2;base64,${font}) format('woff2');font-weight:100 900}
*{box-sizing:border-box;margin:0}
html,body{width:1200px;height:630px;overflow:hidden}
body{font-family:Inter,system-ui,sans-serif;background:#F5F7F8;color:#172E3C;position:relative;font-optical-sizing:auto}
.frame{position:absolute;inset:0;padding:64px 72px;display:flex;flex-direction:column;justify-content:space-between}
/* Width must track images/logo-light.svg's own viewBox ratio (3121.09 / 1000) so the lockup is never stretched. */
.logo svg{display:block;height:74px;width:231.0px}
.kicker{font-size:22px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#007E7B;margin-bottom:22px}
h1{font-size:${title.length > 60 ? 52 : title.length > 40 ? 60 : 68}px;line-height:1.08;letter-spacing:-.028em;font-weight:700;max-width:1000px;color:#172E3C;text-wrap:balance}
.foot{display:flex;justify-content:space-between;align-items:flex-end;font-size:22px;color:#627582}
.foot strong{color:#172E3C;font-weight:650}
.bar{position:absolute;left:0;right:0;bottom:0;height:8px;background:#007E7B}
</style></head><body><div class="frame">
<div class="logo">${logo.replace('<svg ', '<svg aria-hidden="true" ')}</div>
<div><div class="kicker">${escape(kicker)}</div><h1>${escape(title)}</h1></div>
<div class="foot"><span><strong>${escape(site.name)}</strong> · mvtech.solutions</span><span>${escape(site.offices.map((office) => office.label).join(' · '))}</span></div>
</div><div class="bar"></div></body></html>`;

const launch = async () => {
  if (process.env.PW_EXECUTABLE) return chromium.launch({ executablePath: process.env.PW_EXECUTABLE });
  for (const channel of ['chrome', 'msedge', 'chromium']) {
    try { return await chromium.launch({ channel }); } catch { /* try the next one */ }
  }
  return chromium.launch();
};

const browser = await launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
let written = 0;
for (const entry of manifest) {
  const file = `images/og/${entry.slug}.jpg`;
  const exists = await access(file).then(() => true, () => false);
  if (exists && !process.env.OG_FORCE) continue;
  await page.setContent(template(entry), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: file, type: 'jpeg', quality: 86 });
  written++;
}
// Keep the historical default share images in sync with the homepage image.
const home = manifest.find((entry) => entry.slug === 'home');
if (home) {
  await page.setContent(template(home), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: 'images/og-image.png', type: 'png' });
}
await browser.close();
await copyFile('images/og/home.jpg', 'images/og-image.jpg').catch(() => {});
console.log(`Social images: ${written} generated, ${manifest.length - written} already current.`);
