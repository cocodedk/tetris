import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { STRINGS } from '../../src/ui/i18n.js';

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
const en = read('index.html');
const fa = read('fa/index.html');
const es = read('es/index.html');
const urls = (html) => [...html.matchAll(/(?:src|href)="([^"]*)"/g)].map((m) => m[1]);
// Only tags that make the browser fetch something; canonical, alternate and <a> links do not.
const loads = (html) => [...html.matchAll(/<(?:script|img)\b[^>]*\bsrc="([^"]*)"|<link rel="(?:stylesheet|preconnect|icon)" href="([^"]*)"/g)]
  .map((m) => m[1] ?? m[2]);
const remote = (html) => loads(html).filter((u) => /^(https?:)?\/\//.test(u));

test('the English page is lang="en", loads src/main.js and the stylesheet', () => {
  assert.match(en, /<html lang="en">/);
  assert.match(en, /<script type="module" src="src\/main\.js"><\/script>/);
  assert.match(en, /<link rel="stylesheet" href="style\.css">/);
});

test('the Persian page is lang="fa" dir="rtl", loads ../src/main.js and the same stylesheet', () => {
  assert.match(fa, /<html lang="fa" dir="rtl">/);
  assert.match(fa, /<script type="module" src="\.\.\/src\/main\.js"><\/script>/);
  assert.match(fa, /<link rel="stylesheet" href="\.\.\/style\.css">/);
});

test('the Spanish page is lang="es", loads ../src/main.js and the same stylesheet', () => {
  assert.match(es, /<html lang="es">/);
  assert.match(es, /<script type="module" src="\.\.\/src\/main\.js"><\/script>/);
  assert.match(es, /<link rel="stylesheet" href="\.\.\/style\.css">/);
});

test('each page links to the other two', () => {
  for (const [html, links] of [[en, ['fa/', 'es/']], [fa, ['../', '../es/']], [es, ['../', '../fa/']]]) {
    const found = urls(html);
    for (const u of links) assert.ok(found.includes(u), u);
  }
});

test('the pages load only the cocode.dk family frame, and the Persian page also Vazirmatn', () => {
  for (const html of [en, es]) {
    const got = remote(html);
    assert.ok(got.includes('https://brand.cocode.dk/v1.css'));
    assert.ok(got.includes('https://brand.cocode.dk/v1.js'));
    for (const u of got) assert.match(u, /^https:\/\/brand\.cocode\.dk\//);
  }

  const remoteFa = remote(fa);
  assert.ok(remoteFa.some((u) => u.startsWith('https://fonts.googleapis.com/css2?family=Vazirmatn')));
  for (const u of remoteFa) assert.match(u, /^https:\/\/(brand\.cocode\.dk\/|fonts\.(googleapis|gstatic)\.com(\/|$))/);
});

test('every data-i18n and data-i18n-label key on every page is in the table', () => {
  for (const html of [en, fa, es]) {
    const keys = [...html.matchAll(/data-i18n(?:-label)?="([^"]+)"/g)].map((m) => m[1]);
    assert.ok(keys.length > 10);
    for (const key of keys) assert.ok(key in STRINGS.en, key);
  }
});

test('every canvas is an image with a translated aria-label', () => {
  for (const html of [en, fa, es]) {
    const canvases = html.match(/<canvas\b[^>]*>/g);
    assert.equal(canvases.length, 3);
    for (const c of canvases) assert.match(c, /role="img" data-i18n-label="\w+"/, c);
  }
});

test('the pages have the same structure apart from their head, links and frame', () => {
  const body = (html) => html.slice(html.indexOf('<body>'))
    .replace(/<a class="lang"[^>]*>[^<]*<\/a>/g, '')
    .replace(/<cocode-head[\s\S]*?<\/cocode-head>/, '')
    .replace(/<cocode-foot[\s\S]*?<\/cocode-foot>/, '');
  for (const html of [fa, es]) assert.equal(body(html), body(en));
});
