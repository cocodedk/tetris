import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  COLS, ROWS, VISIBLE_ROWS, HIDDEN_ROWS, emptyBoard, fits, fullRows, clearRows,
} from '../../src/core/board.js';
import * as core from '../../src/core/index.js';
import { makeBoard } from './helpers.js';

test('the core index exports the game API', () => {
  for (const name of ['newGame', 'step', 'hardDrop', 'hold', 'rotateCW', 'ghostY', 'nextPieces']) {
    assert.equal(typeof core[name], 'function', name);
  }
});

test('board is 10 columns by 20 visible rows plus 2 hidden rows', () => {
  assert.equal(COLS, 10);
  assert.equal(VISIBLE_ROWS, 20);
  assert.equal(HIDDEN_ROWS, 2);
  const board = emptyBoard();
  assert.equal(board.length, ROWS);
  assert.equal(ROWS, 22);
  assert.ok(board.every((row) => row.length === 10 && row.every((c) => c === null)));
});

test('fits rejects walls, floor, ceiling and filled cells', () => {
  const board = makeBoard(['#.........']);
  assert.ok(fits(board, [[0, 0], [9, 20]]));
  assert.ok(!fits(board, [[-1, 5]]));
  assert.ok(!fits(board, [[10, 5]]));
  assert.ok(!fits(board, [[0, 22]]));
  assert.ok(!fits(board, [[0, -1]]));
  assert.ok(!fits(board, [[0, 21]]));
});

test('full rows clear and the rows above fall', () => {
  const board = makeBoard([
    'T.........',
    '##########',
    'S........S',
    '##########',
  ]);
  const rows = fullRows(board);
  assert.deepEqual(rows, [19, 21]);
  const after = clearRows(board, rows);
  assert.equal(after.length, ROWS);
  assert.deepEqual(after[21], ['S', null, null, null, null, null, null, null, null, 'S']);
  assert.equal(after[20][0], 'T');
  assert.ok(after[0].every((c) => c === null) && after[1].every((c) => c === null));
});
