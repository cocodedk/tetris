import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { STRINGS } from '../../src/ui/i18n.js';

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
const en = read('index.html');
const fa = read('fa/index.html');
const urls = (html) => [...html.matchAll(/(?:src|href)="([^"]*)"/g)].map((m) => m[1]);

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

test('only the Persian page loads from the network, and only the Vazirmatn font', () => {
  assert.deepEqual(urls(en).filter((u) => /^(https?:)?\/\//.test(u)), []);
  const remote = urls(fa).filter((u) => /^(https?:)?\/\//.test(u));
  assert.ok(remote.some((u) => u.startsWith('https://fonts.googleapis.com/css2?family=Vazirmatn')));
  for (const u of remote) assert.match(u, /^https:\/\/fonts\.(googleapis|gstatic)\.com(\/|$)/);
});

test('every data-i18n key on both pages is in the table', () => {
  for (const html of [en, fa]) {
    const keys = [...html.matchAll(/data-i18n="([^"]+)"/g)].map((m) => m[1]);
    assert.ok(keys.length > 10);
    for (const key of keys) assert.ok(key in STRINGS.en, key);
  }
});

test('both pages have the same structure apart from their head and links', () => {
  const body = (html) => html.slice(html.indexOf('<body>')).replace(/href="[^"]*" hreflang="\w+" lang="\w+"/, '');
  assert.equal(body(fa), body(en));
});
