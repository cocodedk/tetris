import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFx, fxEvents, stepFx, gameOverDone, greyed, LIFE } from '../../src/fx/effects.js';
import { PER_CELL } from '../../src/fx/bursts.js';
import { hueFor } from '../../src/fx/background.js';

const row = (type = 'I') => Array(10).fill(type);
const clear = ({ rows = [21], combo = 0, backToBack = false } = {}) => ({
  type: 'clear', rows, count: rows.length, tetris: rows.length === 4, backToBack, combo,
  points: 100, blocks: rows.map(() => row()),
});
const tetris = (extra = {}) => clear({ rows: [18, 19, 20, 21], ...extra });
const lock = { type: 'lock', piece: 'T', cells: [[4, 20], [5, 20], [6, 20], [5, 21]] };
const hardDrop = (from, to) => ({ type: 'hardDrop', from, to, cells: lock.cells });
const texts = (fx) => fx.texts.map((t) => t.text);

test('a lock starts the lock glow on its cells', () => {
  const fx = createFx();
  fxEvents(fx, [lock]);
  assert.equal(fx.glows.length, 1);
  assert.deepEqual(fx.glows[0].cells, lock.cells);
  assert.equal(fx.glows[0].color, 'T');
});

test('a hard drop starts a trail, sparks and a shake', () => {
  const fx = createFx();
  fxEvents(fx, [hardDrop(2, 20), lock]);
  assert.equal(fx.trails.length, 1);
  assert.equal(fx.trails[0].color, 'T');
  assert.deepEqual(fx.trails[0].cols[0], [4, 2, 20]);
  assert.ok(fx.particles.live.length > 0);
  assert.ok(fx.shake.amp > 0);
});

test('the hard-drop shake is stronger for a longer fall', () => {
  const short = createFx();
  const long = createFx();
  fxEvents(short, [hardDrop(18, 20), lock]);
  fxEvents(long, [hardDrop(4, 20), lock]);
  assert.ok(long.shake.amp > short.shake.amp);
});

test('a line clear flashes each row and bursts at least 8 particles per cell', () => {
  const fx = createFx();
  fxEvents(fx, [clear({ rows: [20, 21] })]);
  assert.deepEqual(fx.flashes.map((f) => f.y), [20, 21]);
  assert.equal(fx.particles.live.length, PER_CELL * 20);
  assert.ok(PER_CELL >= 8);
  assert.ok(fx.particles.live.every((p) => p.color === 'I'));
  assert.deepEqual(texts(fx), []);
  assert.equal(fx.shake.amp, 0);
});

test('a Tetris keeps at least 8 particles per cleared cell, plus a flash, a shake and "TETRIS"', () => {
  const fx = createFx();
  fxEvents(fx, [tetris()]);
  stepFx(fx, 16);
  const white = fx.particles.live.filter((p) => p.color === 'white').length;
  assert.ok(fx.particles.live.length - white >= 8 * 40);
  assert.ok(white > 0);
  assert.ok(fx.flashes.some((f) => f.board));
  assert.ok(fx.shake.amp > 0.3);
  assert.deepEqual(texts(fx), ['TETRIS']);
});

test('a back-to-back Tetris adds "BACK-TO-BACK"', () => {
  const fx = createFx();
  fxEvents(fx, [tetris({ backToBack: true })]);
  assert.deepEqual(texts(fx), ['TETRIS', 'BACK-TO-BACK']);
});

test('the combo text shows only from combo 2', () => {
  for (const combo of [0, 1]) {
    const fx = createFx();
    fxEvents(fx, [clear({ combo })]);
    assert.deepEqual(texts(fx), [], `combo ${combo}`);
  }
  const fx = createFx();
  fxEvents(fx, [clear({ combo: 3, rows: [20] })]);
  assert.deepEqual(texts(fx), ['COMBO ×3']);
  assert.ok(Math.abs(fx.texts[0].y - 20) <= 1);
});

test('a level-up starts the wave and changes the background hue', () => {
  const fx = createFx();
  const hue = fx.bg.hue;
  const speed = fx.bg.speed;
  fxEvents(fx, [{ type: 'levelUp', level: 2 }]);
  assert.equal(fx.waves.length, 1);
  assert.notEqual(fx.bg.hue, hue);
  assert.equal(fx.bg.hue, hueFor(2));
  assert.ok(fx.bg.speed > speed);
});

test('game over greys the stack out, then is done within a second', () => {
  const fx = createFx();
  fxEvents(fx, [{ type: 'gameOver', reason: 'lockOut' }]);
  assert.equal(greyed(fx), 0);
  stepFx(fx, LIFE.gameOver / 2);
  assert.equal(greyed(fx), 0.5);
  assert.equal(gameOverDone(fx), false);
  stepFx(fx, LIFE.gameOver);
  assert.equal(gameOverDone(fx), true);
});

test('every effect is finished within one second', () => {
  const fx = createFx();
  fxEvents(fx, [hardDrop(0, 20), lock, tetris({ backToBack: true, combo: 4 }), { type: 'levelUp', level: 2 }]);
  for (let t = 0; t < 1000; t += 20) stepFx(fx, 20);
  for (const list of [fx.flashes, fx.texts, fx.trails, fx.glows, fx.waves, fx.particles.live]) {
    assert.equal(list.length, 0);
  }
  assert.equal(fx.shake.amp, 0);
});

test('the background moves in full mode and stays still in reduced mode', () => {
  const full = createFx({ seed: 3 });
  const still = createFx({ seed: 3, reduced: true });
  const y0 = full.bg.stars.map((s) => s.y);
  stepFx(full, 500);
  stepFx(still, 500);
  assert.notDeepEqual(full.bg.stars.map((s) => s.y), y0);
  assert.deepEqual(still.bg.stars.map((s) => s.y), y0);
});

test('reduced mode starts no particles and no shake, but keeps shortened flashes and text', () => {
  const fx = createFx({ reduced: true });
  fxEvents(fx, [hardDrop(0, 20), lock, tetris({ backToBack: true, combo: 2 })]);
  assert.equal(fx.particles.live.length, 0);
  assert.equal(fx.shake.amp, 0);
  assert.deepEqual(texts(fx), ['TETRIS', 'BACK-TO-BACK', 'COMBO ×2']);
  assert.ok(fx.flashes.length > 0);
  assert.ok(fx.texts.every((t) => t.life < LIFE.text));
  assert.ok(fx.flashes.every((f) => f.life < (f.board ? LIFE.boardFlash : LIFE.rowFlash)));
});

test('the same events, dt and seed give the same effects', () => {
  const run = () => {
    const fx = createFx({ seed: 42 });
    fxEvents(fx, [hardDrop(0, 20), lock, tetris()]);
    stepFx(fx, 120);
    return fx.particles.live.map((p) => [p.x, p.y, p.color]);
  };
  assert.deepEqual(run(), run());
});
