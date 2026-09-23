import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyBoard } from '../../src/core/board.js';
import { pieceCells, spawnPiece } from '../../src/core/pieces.js';
import { newGame, ghostY } from '../../src/core/game.js';
import {
  moveLeft, moveRight, softDrop, hardDrop, rotateCW, hold,
} from '../../src/core/actions.js';
import { step } from '../../src/core/step.js';
import { types } from './helpers.js';

const withT = (state, x = 3, y = 0) => ({ ...state, current: { type: 'T', rotation: 0, x, y } });

test('a new game starts at level 1 with nothing scored or held', () => {
  const s = newGame(1);
  assert.equal(s.level, 1);
  assert.equal(s.score, 0);
  assert.equal(s.lines, 0);
  assert.equal(s.hold, null);
  assert.equal(s.canHold, true);
  assert.equal(s.over, false);
  assert.deepEqual(s.events, []);
});

test('left and right move one column and stop at the walls', () => {
  let s = withT(newGame(1));
  s = moveLeft(s);
  assert.equal(s.current.x, 2);
  assert.deepEqual(s.events, []);
  s = moveRight(moveRight(s));
  assert.equal(s.current.x, 4);
  const atWall = withT(s, 0);
  assert.equal(moveLeft(atWall).current.x, 0);
  assert.equal(moveRight(withT(s, 7)).current.x, 7);
});

test('soft drop moves down one row for 1 point', () => {
  const s = softDrop(withT(newGame(1)));
  assert.equal(s.current.y, 1);
  assert.equal(s.score, 1);
  assert.deepEqual(s.events, []);
  const grounded = withT(newGame(1), 3, 20);
  assert.equal(softDrop(grounded).score, 0);
});

test('the ghost row is where the piece would land', () => {
  const s = withT(newGame(1));
  assert.equal(ghostY(s), 20);
  const board = emptyBoard();
  board[10][4] = '#';
  assert.equal(ghostY({ ...s, board }), 8);
});

test('hard drop scores 2 per cell and reports hardDrop then lock', () => {
  const s = hardDrop(withT(newGame(1)));
  assert.equal(s.score, 40);
  assert.deepEqual(types(s), ['hardDrop', 'lock']);
  const [drop, lock] = s.events;
  assert.equal(drop.from, 0);
  assert.equal(drop.to, 20);
  const landed = pieceCells({ type: 'T', rotation: 0, x: 3, y: 20 });
  assert.deepEqual(drop.cells, landed);
  assert.deepEqual(lock, { type: 'lock', piece: 'T', cells: landed });
  assert.equal(s.board[21][4], 'T');
  assert.equal(s.board[20][4], 'T');
});

test('after a lock the next piece from the queue spawns', () => {
  const s0 = newGame(2);
  const s1 = hardDrop(s0);
  assert.deepEqual(s1.current, spawnPiece(s0.queue[0]));
  assert.deepEqual(s1.queue.slice(0, 4), s0.queue.slice(1, 5));
});

test('hold takes the next piece, then is refused until the piece locks', () => {
  const s0 = newGame(7);
  const first = s0.current.type;
  const s1 = hold(s0);
  assert.equal(s1.hold, first);
  assert.equal(s1.current.type, s0.queue[0]);
  assert.equal(s1.canHold, false);
  assert.deepEqual(s1.events, [{ type: 'hold', piece: first }]);

  const s2 = hold(moveLeft(s1));
  assert.deepEqual(s2.current, moveLeft(s1).current);
  assert.equal(s2.hold, first);
  assert.deepEqual(s2.events, []);

  const s3 = hardDrop(s2);
  assert.equal(s3.canHold, true);
  const s4 = hold(s3);
  assert.deepEqual(s4.current, spawnPiece(first));
  assert.equal(s4.hold, s3.current.type);
  assert.deepEqual(types(s4), ['hold']);
});

test('block out: the next piece cannot spawn, so the game is over', () => {
  const board = emptyBoard();
  for (let x = 3; x <= 6; x++) board[1][x] = '#';
  const s0 = { ...newGame(1), board, current: { type: 'O', rotation: 0, x: -1, y: 18 } };
  const s1 = hardDrop(s0);
  assert.equal(s1.over, true);
  assert.deepEqual(types(s1), ['hardDrop', 'lock', 'gameOver']);
  assert.deepEqual(s1.events[2], { type: 'gameOver', reason: 'blockOut' });
});

test('lock out: a piece locking entirely in the hidden rows ends the game', () => {
  const board = emptyBoard();
  for (let x = 0; x < 9; x++) board[2][x] = '#';
  const s1 = hardDrop({ ...newGame(4), board });
  assert.equal(s1.over, true);
  assert.deepEqual(types(s1), ['hardDrop', 'lock', 'gameOver']);
  assert.deepEqual(s1.events[2], { type: 'gameOver', reason: 'lockOut' });
});

test('lock out also happens when the lock delay runs out', () => {
  const board = emptyBoard();
  for (let x = 0; x < 9; x++) board[2][x] = '#';
  let s = { ...newGame(4), board };
  for (let i = 0; i < 10; i++) s = step(s, 50);
  assert.equal(s.over, true);
  assert.deepEqual(types(s), ['lock', 'gameOver']);
});

test('after game over every action is ignored and reports nothing', () => {
  const board = emptyBoard();
  for (let x = 0; x < 9; x++) board[2][x] = '#';
  const over = hardDrop({ ...newGame(4), board });
  for (const action of [moveLeft, moveRight, softDrop, hardDrop, rotateCW, hold]) {
    const after = action(over);
    assert.deepEqual(after, { ...over, events: [] });
  }
  assert.deepEqual(step(over, 50), { ...over, events: [] });
});
