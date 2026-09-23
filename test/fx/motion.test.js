import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reducedMotion } from '../../src/fx/motion.js';
import { readEffects, saveEffects } from '../../src/ui/storage.js';

function fakeStorage() {
  const data = new Map();
  return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, String(v)) };
}

test('with no choice made, the system setting decides', () => {
  assert.equal(reducedMotion(true, null), true);
  assert.equal(reducedMotion(false, null), false);
  assert.equal(reducedMotion(undefined, null), false);
});

test('the toggle overrides the system setting', () => {
  assert.equal(reducedMotion(true, 'full'), false);
  assert.equal(reducedMotion(false, 'reduced'), true);
});

test('the effects choice is remembered in localStorage', (t) => {
  globalThis.localStorage = fakeStorage();
  t.after(() => { delete globalThis.localStorage; });
  assert.equal(readEffects(), null);
  saveEffects('reduced');
  assert.equal(globalThis.localStorage.getItem('tetris.effects'), 'reduced');
  assert.equal(readEffects(), 'reduced');
  saveEffects('full');
  assert.equal(readEffects(), 'full');
});

test('blocked storage does not throw; the choice lasts for the session', (t) => {
  globalThis.localStorage = {
    getItem() { throw new Error('blocked'); },
    setItem() { throw new Error('blocked'); },
  };
  t.after(() => { delete globalThis.localStorage; });
  assert.doesNotThrow(() => saveEffects('reduced'));
  assert.equal(readEffects(), 'reduced');
});
