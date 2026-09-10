// Renders a 1200x630 social-share image for every page listed in content/og-manifest.json (written by build.mjs).
// Uses playwright-core with a locally installed browser, so `npm run build` stays browser-free for CI.
//   npm run build:og                      -> uses Google Chrome / Chromium found on this machine
//   PW_EXECUTABLE=/path/to/chrome npm run build:og
// Set OG_FORCE=1 to regenerate images that already exist.
import { readFile, mkdir, access, copyFile } from 'node:fs/promises';
import { chromium } from 'playwright-core';

const site = JSON.parse(await readFile('content/site.json', 'utf8'));
const manifest = JSON.parse(await readFile('content/og-manifest.json', 'utf8'));
const logo = await readFile('images/logo.svg', 'utf8');
await mkdir('images/og', { recursive: true });

const escape = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const font = (await readFile('fonts/inter-latin-var.woff2')).toString('base64');

const template = ({ title, kicker }) => `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Inter;src:url(data:font/woff2;base64,${font}) format('woff2');font-weight:100 900}
*{box-sizing:border-box;margin:0}
html,body{width:1200px;height:630px;overflow:hidden}
body{font-family:Inter,system-ui,sans-serif;background:#07080b;color:#eef0f4;position:relative;font-optical-sizing:auto}
.glow{position:absolute;right:-180px;top:-260px;width:820px;height:820px;border-radius:50%;background:radial-gradient(closest-side,rgba(0,36,255,.55),transparent 72%)}
.grid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.045) 1px,transparent 1px);background-size:60px 60px;mask-image:radial-gradient(ellipse at 20% 20%,#000 30%,transparent 80%);-webkit-mask-image:radial-gradient(ellipse at 20% 20%,#000 30%,transparent 80%)}
.frame{position:absolute;inset:0;padding:64px 72px;display:flex;flex-direction:column;justify-content:space-between}
.logo svg{height:74px;width:auto}
.kicker{font-size:22px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#aab6ff;margin-bottom:22px}
h1{font-size:${title.length > 60 ? 52 : title.length > 40 ? 60 : 68}px;line-height:1.08;letter-spacing:-.028em;font-weight:700;max-width:1000px;color:#fff;text-wrap:balance}
.foot{display:flex;justify-content:space-between;align-items:flex-end;font-size:22px;color:#c2c6d2}
.foot strong{color:#fff;font-weight:650}
.bar{position:absolute;left:0;right:0;bottom:0;height:8px;background:linear-gradient(90deg,#d5dbff,#8092ff,#2a48ff,#0024ff)}
</style></head><body><div class="glow"></div><div class="grid"></div><div class="frame">
<div class="logo">${logo.replace('<svg ', '<svg aria-hidden="true" ')}</div>
<div><div class="kicker">${escape(kicker)}</div><h1>${escape(title)}</h1></div>
<div class="foot"><span><strong>mvtech.solutions</strong> · Remote-first data, software &amp; AI engineering</span><span>Ahmedabad, India · Clients worldwide</span></div>
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
await browser.close();
// Keep the historical default share image in sync with the homepage image.
await copyFile('images/og/home.jpg', 'images/og-image.jpg').catch(() => {});
console.log(`Social images: ${written} generated, ${manifest.length - written} already current.`);
