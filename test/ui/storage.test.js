import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readBest, saveBest } from '../../src/ui/storage.js';

function fakeStorage() {
  const data = new Map();
  return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, String(v)) };
}
const broken = {
  getItem() { throw new Error('blocked'); },
  setItem() { throw new Error('blocked'); },
};

test('the best score is kept in localStorage and only rises', (t) => {
  globalThis.localStorage = fakeStorage();
  t.after(() => { delete globalThis.localStorage; });
  assert.equal(readBest(), 0);
  assert.equal(saveBest(500), 500);
  assert.equal(globalThis.localStorage.getItem('tetris.best'), '500');
  assert.equal(saveBest(200), 500);
  assert.equal(readBest(), 500);
});

test('blocked storage does not throw; the best lasts for the session', (t) => {
  globalThis.localStorage = broken;
  t.after(() => { delete globalThis.localStorage; });
  assert.doesNotThrow(() => readBest());
  assert.equal(saveBest(900), 900);
  assert.equal(readBest(), 900);
});
