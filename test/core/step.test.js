import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newGame, ghostY } from '../../src/core/game.js';
import { moveLeft, rotateCW } from '../../src/core/actions.js';
import { step } from '../../src/core/step.js';
import { gravityInterval } from '../../src/core/scoring.js';
import { types } from './helpers.js';

const T = { type: 'T', rotation: 0, x: 3, y: 0 };
const run = (state, frames, dt = 50) => {
  let s = state;
  for (let i = 0; i < frames; i++) s = step(s, dt);
  return s;
};
const grounded = () => {
  const s = { ...newGame(1), current: T };
  return { ...s, current: { ...T, y: ghostY(s) } };
};

test('gravity follows the guideline curve', () => {
  assert.equal(gravityInterval(1), 1000);
  assert.ok(Math.abs(gravityInterval(2) - 793) < 1e-9);
  assert.ok(Math.abs(gravityInterval(10) - Math.pow(0.737, 9) * 1000) < 1e-9);
  assert.ok(gravityInterval(15) < gravityInterval(14));
});

test('at level 1 the piece falls one row per second of 50 ms frames', () => {
  const s0 = { ...newGame(1), current: T };
  const s19 = run(s0, 19);
  assert.equal(s19.current.y, 0);
  assert.deepEqual(s19.events, []);
  const s20 = step(s19, 50);
  assert.equal(s20.current.y, 1);
  assert.deepEqual(s20.events, [], 'gravity needs no event');
  assert.equal(run(s0, 40).current.y, 2);
});

test('at higher levels the piece falls faster, several rows a frame if needed', () => {
  const s = { ...newGame(1), current: T, level: 2 };
  assert.equal(run(s, 15).current.y, 0);
  assert.equal(run(s, 16).current.y, 1);
  const fast = step({ ...newGame(1), current: T, level: 20 }, 50);
  assert.ok(fast.current.y > 1);
});

test('gravity stops at the floor without locking', () => {
  const s = run({ ...newGame(1), current: T, level: 20 }, 3);
  assert.equal(s.current.y, 20);
  assert.equal(s.board[21][4], null);
});

test('a grounded piece locks after 500 ms without a move', () => {
  const s9 = run(grounded(), 9);
  assert.equal(s9.lockMs, 450);
  assert.equal(s9.board[21][4], null);
  assert.deepEqual(s9.events, []);
  const s10 = step(s9, 50);
  assert.deepEqual(types(s10), ['lock']);
  assert.equal(s10.board[21][4], 'T');
  assert.equal(s10.current.y, 0, 'the next piece spawned');
});

test('time left in the landing frame counts toward the lock delay', () => {
  // One row above the floor, 1 ms before gravity moves it: it lands 1 ms into the frame.
  const s0 = { ...newGame(1), current: { ...T, y: 19 }, gravityMs: 999 };
  const landed = step(s0, 50);
  assert.equal(landed.current.y, 20);
  assert.equal(landed.lockMs, 49);
  const s9 = run(landed, 9);
  assert.equal(s9.lockMs, 499);
  assert.deepEqual(s9.events, []);
  const s10 = step(s9, 1);
  assert.deepEqual(types(s10), ['lock'], 'locks after 500 ms on the ground');
});

test('a move restarts the lock timer', () => {
  const moved = moveLeft(run(grounded(), 9));
  assert.equal(moved.lockMs, 0);
  const s9 = run(moved, 9);
  assert.equal(s9.board[21][3], null, 'not yet locked');
  const s10 = step(s9, 50);
  assert.deepEqual(types(s10), ['lock']);
  assert.equal(s10.board[21][3], 'T');
});

test('a rotation restarts the lock timer', () => {
  const rotated = rotateCW(run(grounded(), 9));
  assert.equal(rotated.lockMs, 0);
  assert.deepEqual(types(run(rotated, 9)), []);
});

test('the lock timer does not run while the piece is falling', () => {
  const s = run({ ...newGame(1), current: T }, 15);
  assert.equal(s.lockMs, 0);
});
