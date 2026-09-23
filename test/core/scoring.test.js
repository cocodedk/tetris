import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newGame } from '../../src/core/game.js';
import { hardDrop } from '../../src/core/actions.js';
import { clearPoints, levelFor } from '../../src/core/scoring.js';
import { makeBoard, types, GAP_ROW, UPRIGHT_I } from './helpers.js';

// Drops an upright I into column 9 of a board with `rows` gap rows at the
// bottom; returns the new state and the points the clear alone scored.
function clearWithI(state, rows) {
  const before = { ...state, board: makeBoard(Array(rows).fill(GAP_ROW)), current: UPRIGHT_I };
  const after = hardDrop(before);
  const drop = after.events[0];
  return { after, points: after.score - before.score - 2 * (drop.to - drop.from) };
}

const clearEvent = (state) => state.events.find((e) => e.type === 'clear');

test('single, double, triple and Tetris score 100, 300, 500, 800', () => {
  [100, 300, 500, 800].forEach((expected, i) => {
    const { after, points } = clearWithI(newGame(1), i + 1);
    assert.equal(points, expected, `${i + 1} lines`);
    assert.equal(after.lines, i + 1);
    const event = clearEvent(after);
    assert.equal(event.count, i + 1);
    assert.equal(event.points, expected);
    assert.equal(event.tetris, i === 3);
  });
});

test('clear scores are multiplied by the level', () => {
  const { points } = clearWithI({ ...newGame(1), level: 3 }, 2);
  assert.equal(points, 900);
  assert.equal(clearPoints({ count: 4, level: 2, backToBack: false, combo: 0 }), 1600);
});

test('a line clear removes the full rows and the rows above fall', () => {
  const { after } = clearWithI(newGame(1), 2);
  assert.deepEqual(clearEvent(after).rows, [20, 21]);
  // The I's two leftover cells fell to the bottom of column 9.
  assert.equal(after.board[21][9], 'I');
  assert.equal(after.board[20][9], 'I');
  assert.equal(after.board[19][9], null);
  assert.equal(after.board[21][0], null);
});

test('the clear event reports rows, count, tetris, back-to-back, combo', () => {
  const { after } = clearWithI(newGame(1), 4);
  assert.deepEqual(types(after), ['hardDrop', 'lock', 'clear']);
  const event = clearEvent(after);
  assert.deepEqual(event.rows, [18, 19, 20, 21]);
  assert.equal(event.count, 4);
  assert.equal(event.tetris, true);
  assert.equal(event.backToBack, false);
  assert.equal(event.combo, 0);
  assert.equal(event.blocks.length, 4);
  assert.deepEqual(event.blocks[3], [...'#########', 'I']);
});

test('a back-to-back Tetris scores 1.5 times', () => {
  const { after: first } = clearWithI(newGame(1), 4);
  assert.equal(first.backToBack, true);
  const { after, points } = clearWithI({ ...first, combo: -1 }, 4);
  assert.equal(points, 1200);
  assert.equal(clearEvent(after).backToBack, true);
  assert.equal(clearPoints({ count: 4, level: 2, backToBack: true, combo: 0 }), 2400);
});

test('a smaller clear breaks back-to-back', () => {
  const { after: first } = clearWithI(newGame(1), 4);
  const { after: second } = clearWithI(first, 1);
  assert.equal(second.backToBack, false);
  const { points } = clearWithI({ ...second, combo: -1 }, 4);
  assert.equal(points, 800);
});

test('consecutive clears add a combo of 50 x combo x level', () => {
  const { after: first, points: p1 } = clearWithI(newGame(1), 1);
  assert.equal(p1, 100);
  assert.equal(first.combo, 0);
  const { after: second, points: p2 } = clearWithI(first, 1);
  assert.equal(p2, 150);
  assert.equal(clearEvent(second).combo, 1);
  const { after: third, points: p3 } = clearWithI({ ...second, level: 2 }, 2);
  assert.equal(p3, 600 + 200);
  assert.equal(third.combo, 2);
});

test('a lock without a clear resets the combo', () => {
  const { after: first } = clearWithI(newGame(1), 1);
  const after = hardDrop({ ...first, board: makeBoard([]), current: UPRIGHT_I });
  assert.equal(after.combo, -1);
  assert.deepEqual(types(after), ['hardDrop', 'lock']);
});

test('the level rises by one every 10 lines and reports levelUp', () => {
  assert.equal(levelFor(0), 1);
  assert.equal(levelFor(9), 1);
  assert.equal(levelFor(10), 2);
  assert.equal(levelFor(25), 3);
  const { after, points } = clearWithI({ ...newGame(1), lines: 9 }, 1);
  assert.equal(points, 100, 'the clear scores at the level it was made on');
  assert.equal(after.lines, 10);
  assert.equal(after.level, 2);
  assert.deepEqual(types(after), ['hardDrop', 'lock', 'clear', 'levelUp']);
  assert.deepEqual(after.events[3], { type: 'levelUp', level: 2 });
  const { after: same } = clearWithI({ ...newGame(1), lines: 7 }, 2);
  assert.equal(same.level, 1);
  assert.ok(!types(same).includes('levelUp'));
});
