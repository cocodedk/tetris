import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { STRINGS } from '../../src/ui/i18n.js';

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
const en = read('index.html');
const fa = read('fa/index.html');
const urls = (html) => [...html.matchAll(/(?:src|href)="([^"]*)"/g)].map((m) => m[1]);
// Only tags that make the browser fetch something; canonical, alternate and <a> links do not.
const loads = (html) => [...html.matchAll(/<(?:script|img)\b[^>]*\bsrc="([^"]*)"|<link rel="(?:stylesheet|preconnect|icon)" href="([^"]*)"/g)]
  .map((m) => m[1] ?? m[2]);

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

test('each page links to the other', () => {
  assert.ok(urls(en).includes('fa/'));
  assert.ok(urls(fa).includes('../'));
});

test('both pages load only the cocode.dk family frame, and the Persian page also Vazirmatn', () => {
  const remoteEn = loads(en).filter((u) => /^(https?:)?\/\//.test(u));
  assert.ok(remoteEn.includes('https://brand.cocode.dk/v1.css'));
  assert.ok(remoteEn.includes('https://brand.cocode.dk/v1.js'));
  for (const u of remoteEn) assert.match(u, /^https:\/\/brand\.cocode\.dk\//);

  const remoteFa = loads(fa).filter((u) => /^(https?:)?\/\//.test(u));
  assert.ok(remoteFa.some((u) => u.startsWith('https://fonts.googleapis.com/css2?family=Vazirmatn')));
  for (const u of remoteFa) assert.match(u, /^https:\/\/(brand\.cocode\.dk\/|fonts\.(googleapis|gstatic)\.com(\/|$))/);
});

test('every data-i18n key on both pages is in the table', () => {
  for (const html of [en, fa]) {
    const keys = [...html.matchAll(/data-i18n="([^"]+)"/g)].map((m) => m[1]);
    assert.ok(keys.length > 10);
    for (const key of keys) assert.ok(key in STRINGS.en, key);
  }
});

test('both pages have the same structure apart from their head, links and frame', () => {
  const body = (html) => html.slice(html.indexOf('<body>'))
    .replace(/href="[^"]*" hreflang="\w+" lang="\w+"/, '')
    .replace(/<cocode-head[\s\S]*?<\/cocode-head>/, '')
    .replace(/<cocode-foot[\s\S]*?<\/cocode-foot>/, '');
  assert.equal(body(fa), body(en));
});
