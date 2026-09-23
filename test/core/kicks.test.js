import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ROWS, COLS } from '../../src/core/board.js';
import { pieceCells } from '../../src/core/pieces.js';
import { newGame } from '../../src/core/game.js';
import { rotateCW, rotateCCW } from '../../src/core/actions.js';

// The guideline SRS tables, [x, y] with y up.
const JLSTZ = {
  '0R': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  'R0': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  'R2': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '2R': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '2L': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  'L2': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  'L0': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '0L': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
};
const I = {
  '0R': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  'R0': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  'R2': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
  '2R': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  '2L': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  'L2': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  'L0': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  '0L': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
};
const NAMES = ['0', 'R', '2', 'L'];
const START = { x: 3, y: 8 };

const fullBoard = () => Array.from({ length: ROWS }, () => Array(COLS).fill('#'));

// Everything is filled except the cells of the target placement, so every
// earlier kick test is blocked and test `k` is the first that fits.
function rotateInto(type, from, dir, target) {
  const board = fullBoard();
  for (const [x, y] of pieceCells(target)) board[y][x] = null;
  const state = { ...newGame(1), board, current: { type, rotation: from, ...START } };
  return (dir === 1 ? rotateCW : rotateCCW)(state);
}

function checkTable(type, table) {
  for (let from = 0; from < 4; from++) {
    for (const dir of [1, -1]) {
      const to = (from + dir + 4) % 4;
      const key = NAMES[from] + NAMES[to];
      table[key].forEach(([dx, dy], k) => {
        const target = { type, rotation: to, x: START.x + dx, y: START.y - dy };
        const after = rotateInto(type, from, dir, target);
        assert.deepEqual(after.current, target, `${type} ${key} test ${k + 1}`);
      });
    }
  }
}

test('I piece: every wall-kick case of all eight rotations', () => checkTable('I', I));

for (const type of ['T', 'J', 'L', 'S', 'Z']) {
  test(`${type} piece: every case of the JLSTZ kick table`, () => checkTable(type, JLSTZ));
}

test('kick y is up: T 0->R test 3 (-1, +1) moves left and up the board', () => {
  const target = { type: 'T', rotation: 1, x: 2, y: 7 };
  assert.deepEqual(rotateInto('T', 0, 1, target).current, target);
});

test('kick y is up: I 0->R test 5 (+1, +2) moves right and two rows up', () => {
  const target = { type: 'I', rotation: 1, x: 4, y: 6 };
  assert.deepEqual(rotateInto('I', 0, 1, target).current, target);
});

test('a rotation with no fitting kick leaves the piece as it was', () => {
  const current = { type: 'T', rotation: 0, ...START };
  const board = fullBoard();
  for (const [x, y] of pieceCells(current)) board[y][x] = null;
  const state = { ...newGame(1), board, current };
  assert.deepEqual(rotateCW(state).current, current);
  assert.deepEqual(rotateCCW(state).current, current);
});

test('O piece never kicks: it rotates in place, even boxed in', () => {
  let current = { type: 'O', rotation: 0, ...START };
  const board = fullBoard();
  for (const [x, y] of pieceCells(current)) board[y][x] = null;
  let state = { ...newGame(1), board, current };
  for (let i = 1; i <= 4; i++) {
    state = rotateCW(state);
    assert.deepEqual(state.current, { ...current, rotation: i % 4 });
  }
  state = rotateCCW(state);
  assert.deepEqual(state.current, { ...current, rotation: 3 });
});

test('rotation on an open board uses no kick and restarts the lock timer', () => {
  const state = { ...newGame(1), current: { type: 'T', rotation: 0, ...START }, lockMs: 300 };
  const after = rotateCW(state);
  assert.deepEqual(after.current, { type: 'T', rotation: 1, ...START });
  assert.equal(after.lockMs, 0);
  assert.deepEqual(after.events, []);
});
