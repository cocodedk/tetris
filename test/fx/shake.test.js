import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createShake, addShake, stepShake, shakeOffset, dropShake } from '../../src/fx/shake.js';

test('a still shake has no offset', () => {
  assert.deepEqual(shakeOffset(createShake()), [0, 0]);
});

test("the shake's offset decays to zero", () => {
  const shake = createShake();
  addShake(shake, 0.5);
  let prev = shake.amp;
  for (let i = 0; i < 10; i++) {
    stepShake(shake, 16);
    assert.ok(shake.amp < prev);
    for (const d of shakeOffset(shake)) assert.ok(Math.abs(d) <= shake.amp);
    prev = shake.amp;
  }
  for (let i = 0; i < 50; i++) stepShake(shake, 16); // 960 ms in all
  assert.equal(shake.amp, 0);
  assert.deepEqual(shakeOffset(shake), [0, 0]);
});

test('the hard-drop shake grows with the distance fallen', () => {
  for (let rows = 1; rows < 15; rows++) assert.ok(dropShake(rows + 1) > dropShake(rows), rows);
  assert.ok(dropShake(18) >= dropShake(15));
});

test('a new shake never weakens a stronger one already running', () => {
  const shake = createShake();
  addShake(shake, 0.5);
  addShake(shake, 0.1);
  assert.equal(shake.amp, 0.5);
});
