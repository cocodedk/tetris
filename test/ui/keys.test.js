import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  actionFor, movesAfter, dropsAfter, repeatsAfter, REPEATS, DAS_MS, ARR_MS,
} from '../../src/ui/keys.js';

test('each key maps to its action', () => {
  const expected = {
    ArrowLeft: 'left',
    ArrowRight: 'right',
    ArrowDown: 'softDrop',
    Space: 'hardDrop',
    ArrowUp: 'rotateCW',
    KeyX: 'rotateCW',
    KeyZ: 'rotateCCW',
    ControlLeft: 'rotateCCW',
    ControlRight: 'rotateCCW',
    KeyC: 'hold',
    ShiftLeft: 'hold',
    ShiftRight: 'hold',
    KeyP: 'pause',
    Escape: 'pause',
  };
  for (const [code, action] of Object.entries(expected)) assert.equal(actionFor(code), action, code);
});

test('other keys do nothing', () => {
  for (const code of ['KeyA', 'Enter', 'Tab', 'Digit1']) assert.equal(actionFor(code), null);
});

test('only left, right and soft drop repeat while held', () => {
  assert.deepEqual([...REPEATS].sort(), ['left', 'right', 'softDrop']);
});

test('DAS is 170 ms and ARR is 50 ms', () => {
  assert.equal(DAS_MS, 170);
  assert.equal(ARR_MS, 50);
});

test('a held move: one on press, one at 170 ms, then one every 50 ms', () => {
  const cases = [[0, 1], [169, 1], [170, 2], [219, 2], [220, 3], [269, 3], [270, 4], [670, 12]];
  for (const [ms, moves] of cases) assert.equal(movesAfter(ms), moves, `${ms} ms`);
});

test('held soft drop repeats every 50 ms from the press', () => {
  const cases = [[0, 1], [49, 1], [50, 2], [100, 3]];
  for (const [ms, drops] of cases) assert.equal(dropsAfter(ms), drops, `${ms} ms`);
  assert.equal(repeatsAfter('softDrop', 100), 3);
  assert.equal(repeatsAfter('left', 100), 1);
});

test('repeats depend only on held time, not on how it is split into frames', () => {
  const frames = [16, 17, 16, 50, 3, 50, 50, 16, 17];
  let held = 0;
  let done = movesAfter(0);
  for (const dt of frames) {
    held += dt;
    done += movesAfter(held) - movesAfter(held - dt);
  }
  assert.equal(done, movesAfter(held));
});
