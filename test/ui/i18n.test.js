import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STRINGS, toPersianDigits, formatNumber, strings } from '../../src/ui/i18n.js';

test('every i18n key exists in both languages, none empty', () => {
  const en = Object.keys(STRINGS.en).sort();
  const fa = Object.keys(STRINGS.fa).sort();
  assert.deepEqual(fa, en);
  for (const lang of ['en', 'fa']) {
    for (const [key, value] of Object.entries(STRINGS[lang])) {
      assert.ok(typeof value === 'string' && value.trim(), `${lang}.${key}`);
    }
  }
});

test('Persian digits are the Extended Arabic-Indic ۰–۹ (U+06F0–U+06F9)', () => {
  assert.equal(toPersianDigits('0123456789'), '۰۱۲۳۴۵۶۷۸۹');
  assert.equal(toPersianDigits(1250), '۱۲۵۰');
});

test('numbers show Persian digits on the Persian page and Latin digits on the English one', () => {
  assert.equal(formatNumber(0, 'fa'), '۰');
  assert.equal(formatNumber(987654, 'fa'), '۹۸۷۶۵۴');
  assert.equal(formatNumber(987654, 'en'), '987654');
});

test('an unknown language falls back to English', () => {
  assert.equal(strings('de'), STRINGS.en);
  assert.equal(strings('fa'), STRINGS.fa);
});
