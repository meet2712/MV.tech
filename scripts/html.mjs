import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { parse, parseFragment } from 'parse5';

export function walk(node) {
  return [node, ...(node.childNodes || []).flatMap(walk)];
}

export function attr(node, name) {
  return node.attrs?.find((item) => item.name === name)?.value;
}

export function textContent(node) {
  return node.nodeName === '#text' ? node.value : (node.childNodes || []).map(textContent).join('');
}

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

export function stripTags(html) {
  return textContent(parseFragment(String(html))).replace(/\s+/g, ' ').trim();
}

/** Every published HTML page (directories containing index.html), excluding sources and tooling. */
export async function publicPages(directory = '.') {
  const excluded = new Set(['node_modules', 'partials', 'scripts', 'tests', 'content', 'docs', 'fonts', 'images', 'css', 'js']);
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || excluded.has(entry.name)) continue;
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await publicPages(file));
    else if (entry.name === 'index.html') files.push(file);
  }
  return files.sort();
}

export function routeFor(file) {
  return '/' + file.replace(/\\/g, '/').replace(/index\.html$/, '');
}

export function fileFor(route) {
  return (route === '/' ? '' : route.slice(1)) + 'index.html';
}

/** Slug used for per-page assets such as social images. */
export function slugFor(route) {
  return route === '/' ? 'home' : route.replace(/^\/|\/$/g, '').replace(/\//g, '-');
}

const BLOCK = new Set(['p', 'div', 'section', 'article', 'header', 'footer', 'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'details', 'summary', 'figure', 'figcaption', 'blockquote', 'nav', 'aside', 'dl', 'dt', 'dd', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'main', 'form', 'fieldset']);
const SKIP = new Set(['script', 'style', 'svg', 'template', 'noscript', 'button', 'i']);
// Navigation chrome and call-to-action buttons add noise for machine readers; the same links exist as text elsewhere.
const SKIP_CLASSES = ['action-row', 'card-more', 'text-link', 'cta-actions', 'breadcrumbs', 'skip-link', 'overlap-card', 'hero-visual'];
const hasSkipClass = (node) => (attr(node, 'class') || '').split(/\s+/).some((c) => SKIP_CLASSES.includes(c));

/**
 * Convert page HTML into readable Markdown-flavoured text for llms-full.txt.
 * Headings become ##/###, list items "- ", table rows "| a | b |", FAQ questions bold.
 */
export function htmlToText(html) {
  const root = parseFragment(String(html));
  const out = [];
  const inline = (node) => textContent(node).replace(/\s+/g, ' ').trim();
  const hasBlock = (node) => (node.childNodes || []).some((c) => c.tagName && (BLOCK.has(c.tagName) || hasBlock(c)));
  const visit = (node) => {
    if (node.nodeName === '#text') { const t = node.value.replace(/\s+/g, ' ').trim(); if (t) out.push(t); return; }
    const tag = node.tagName;
    if (!tag || SKIP.has(tag)) return;
    if (attr(node, 'aria-hidden') === 'true' || attr(node, 'data-llms') === 'skip' || hasSkipClass(node)) return;
    if (/^h[1-6]$/.test(tag)) { out.push('\n' + '#'.repeat(Math.min(Number(tag[1]) + 1, 6)) + ' ' + inline(node) + '\n'); return; }
    if (tag === 'tr') {
      const cells = (node.childNodes || []).filter((c) => c.tagName === 'th' || c.tagName === 'td').map(inline);
      if (cells.length) out.push('| ' + cells.join(' | ') + ' |');
      return;
    }
    if (tag === 'li' || tag === 'dt' || tag === 'dd') {
      const nested = (node.childNodes || []).filter((c) => c.tagName === 'ul' || c.tagName === 'ol');
      const own = (node.childNodes || []).filter((c) => !nested.includes(c) && !(c.tagName && (SKIP.has(c.tagName) || hasSkipClass(c))));
      // Block children (a heading plus a paragraph inside a card-style list item) are joined with a separator.
      const parts = own.map((c) => textContent(c).replace(/\s+/g, ' ').trim()).filter(Boolean);
      const blocky = own.some((c) => c.tagName && BLOCK.has(c.tagName));
      const text = blocky ? parts.join(' — ') : parts.join('').replace(/\s+/g, ' ').trim();
      if (text) out.push((tag === 'dd' ? '  ' : '- ') + text);
      nested.forEach(visit);
      return;
    }
    if (tag === 'summary') { out.push('\n**' + inline(node) + '**'); return; }
    if (tag === 'p' || tag === 'blockquote' || tag === 'figcaption' || tag === 'pre') {
      const text = inline(node);
      if (text) out.push((tag === 'blockquote' ? '> ' : '') + text + '\n');
      return;
    }
    if (hasBlock(node)) { (node.childNodes || []).forEach(visit); return; }
    const text = inline(node);
    if (text) out.push(text);
  };
  root.childNodes.forEach(visit);
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

export { parse, parseFragment };
