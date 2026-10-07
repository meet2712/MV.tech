import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const html = await readFile('index.html', 'utf8');
const analytics = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]).find((script) => script.includes('analyticsScript'));
const behaviour = await readFile('js/site.js', 'utf8');

test('production analytics runs only on the public website hosts', () => {
  assert(analytics, 'built page has no analytics loader');
  for (const hostname of ['mvtech.solutions', 'www.mvtech.solutions', 'localhost', '127.0.0.1', 'meet2712.github.io', 'preview.example.com']) {
    const scripts = [];
    const context = { location: { hostname }, document: { createElement: () => ({}), head: { appendChild: (script) => scripts.push(script) } } };
    context.window = context;
    vm.runInNewContext(analytics, context);
    const production = ['mvtech.solutions', 'www.mvtech.solutions'].includes(hostname);
    assert.equal(scripts.length, production ? 1 : 0, hostname);
    assert.equal(typeof context.gtag, production ? 'function' : 'undefined', hostname);
    if (production) {
      assert.equal(context.dataLayer[1][0], 'config');
      assert.equal(context.dataLayer[1][1], 'G-YRM2SJ2EMP');
    }
  }
});

function runPage({ calendar = false } = {}) {
  const events = [], documentEvents = {}, windowEvents = {}, scripts = [];
  const frame = { contentWindow: {} };
  let fallbackRemoved = false;
  const embed = {
    dataset: { url: 'https://calendly.com/contact-mvtech/new-meeting' },
    querySelector: (selector) => selector === 'iframe' ? frame : selector === '.calendly-fallback' ? { remove: () => { fallbackRemoved = true; } } : null,
    appendChild: () => {},
  };
  const window = {
    location: { origin: 'https://mvtech.solutions', pathname: '/contact/' },
    gtag: (...args) => events.push(args),
    addEventListener: (name, callback) => { windowEvents[name] = callback; },
  };
  const document = {
    body: { dataset: { service: 'contact' } },
    querySelectorAll: () => [],
    getElementById: (id) => calendar && id === 'calendly-embed' ? embed : null,
    addEventListener: (name, callback) => { documentEvents[name] = callback; },
    createElement: () => ({ dataset: {}, style: {}, remove() { this.removed = true; } }),
    head: { appendChild: (script) => scripts.push(script) },
  };
  vm.runInNewContext(behaviour, { window, document, URL });
  return { events, documentEvents, windowEvents, scripts, frame, window, fallbackRemoved: () => fallbackRemoved };
}

test('contact routes are intent events without enquiry content', () => {
  const page = runPage();
  for (const [href, method] of [
    ['/contact/#book-call', 'calendar'],
    ['https://calendly.com/contact-mvtech/new-meeting', 'calendar'],
    ['mailto:contact@mvtech.solutions?body=private-example', 'email'],
    ['tel:+919409299016', 'phone'],
  ]) {
    page.documentEvents.click({ target: { closest: () => ({ getAttribute: () => href }) } });
    const [kind, name, params] = page.events.at(-1);
    assert.equal(kind, 'event');
    assert.equal(name, 'contact_intent');
    assert.equal(params.method, method);
    assert(!JSON.stringify(params).includes('private-example'));
  }
  assert(!page.events.some((event) => event[1] === 'book_call'));
});

test('booking confirmation requires the embedded calendar and its origin', () => {
  const page = runPage({ calendar: true });
  const scheduled = { event: 'calendly.event_scheduled' };
  page.windowEvents.message({ origin: 'https://calendly.com', source: {}, data: scheduled });
  page.windowEvents.message({ origin: 'https://example.com', source: page.frame.contentWindow, data: scheduled });
  page.windowEvents.message({ origin: 'https://calendly.com', source: page.frame.contentWindow, data: { event: 'calendly.event_type_viewed' } });
  assert.equal(page.events.length, 0);
  page.windowEvents.message({ origin: 'https://calendly.com', source: page.frame.contentWindow, data: scheduled });
  assert.equal(page.events.length, 1);
  assert.equal(page.events[0][1], 'book_call');
});

test('calendar load failures preserve the booking fallback', () => {
  const failed = runPage({ calendar: true });
  failed.scripts[0].onerror();
  assert.equal(failed.fallbackRemoved(), false);
  assert.equal(failed.scripts[0].removed, true);
  const unavailable = runPage({ calendar: true });
  unavailable.scripts[0].onload();
  assert.equal(unavailable.fallbackRemoved(), false);
  assert.equal(unavailable.scripts[0].removed, true);
});
