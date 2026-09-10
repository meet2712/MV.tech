import { readdir } from 'node:fs/promises';
import path from 'node:path';

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

export async function publicPages(directory = '.') {
  const excluded = new Set(['node_modules', 'partials', 'scripts', 'tests', 'content', 'docs']);
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
  return '/' + file.replace(/index\.html$/, '');
}
