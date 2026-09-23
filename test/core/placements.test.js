import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newGame } from '../../src/core/game.js';
import { step } from '../../src/core/step.js';
import { hardDrop, rotateCW, rotateCCW, moveLeft } from '../../src/core/actions.js';
import { listPlacements, playActions, boardStats } from '../../src/core/placements.js';
import { makeBoard, GAP_ROW } from './helpers.js';

const withPiece = (type, board = makeBoard(), extra = {}) =>
  ({ ...newGame(1), board, current: { type, rotation: 0, x: 3, y: 0 }, ...extra });
const own = (list) => list.filter((p) => !p.useHold);
const byId = (list, id) => list.find((p) => p.id === id);

test('the I piece has 17 placements on an empty board: 7 flat, 10 upright', () => {
  const list = own(listPlacements(withPiece('I')));
  assert.equal(list.length, 17);
  assert.equal(list.filter((p) => p.rotation === 0).length, 7);
  assert.equal(list.filter((p) => p.rotation === 1).length, 10);
  assert.deepEqual(list.filter((p) => p.rotation === 0).map((p) => p.column).sort(), [0, 1, 2, 3, 4, 5, 6]);
  assert.ok(byId(list, '-r1c0') && byId(list, '-r1c9') && byId(list, '-r0c6'));
  assert.equal(new Set(list.map((p) => p.id)).size, 17);
});

test('a piece the player already turned and moved keeps every placement', () => {
  for (const type of ['I', 'T', 'L']) {
    const fresh = own(listPlacements(withPiece(type))).map((p) => p.id).sort();
    for (const turns of [[rotateCW], [rotateCW, rotateCW], [rotateCCW], [rotateCW, moveLeft]]) {
      const moved = turns.reduce((s, act) => act(s), withPiece(type, makeBoard(), { canHold: false }));
      const list = listPlacements(moved);
      assert.deepEqual(list.map((p) => p.id).sort(), fresh, `${type} ${turns.map((t) => t.name)}`);
      for (const p of list) {
        const lock = playActions(moved, p.actions).events.find((e) => e.type === 'lock');
        assert.equal(Math.min(...lock.cells.map(([x]) => x)), p.column, p.id);
      }
    }
  }
});

test('other pieces: O has 9, T has 34 on an empty board', () => {
  assert.equal(own(listPlacements(withPiece('O'))).length, 9);
  assert.equal(own(listPlacements(withPiece('T'))).length, 34);
});

test('a placement reports the lines it clears and the holes it leaves', () => {
  const state = withPiece('I', makeBoard([GAP_ROW]));
  const list = listPlacements(state);
  const upright = byId(list, '-r1c9');
  assert.equal(upright.linesCleared, 1);
  assert.equal(upright.holes, 0);
  assert.equal(upright.height, 3);
  const flat = byId(list, '-r0c6');
  assert.equal(flat.linesCleared, 0);
  assert.equal(flat.holes, 1);
  assert.equal(flat.height, 2);
});

test('boardStats counts holes, height and bumpiness', () => {
  const stats = boardStats(makeBoard(['#.........', '..#.......', '#.#.......']));
  assert.deepEqual(stats, { holes: 1, height: 3, bumpiness: 3 + 2 + 2 });
});

test('hold placements appear only when hold is allowed', () => {
  const state = withPiece('I');
  const allowed = listPlacements(state);
  const held = allowed.filter((p) => p.useHold);
  assert.ok(held.length > 0);
  for (const p of held) {
    assert.equal(p.piece, state.queue[0]);
    assert.match(p.id, /^Hr\dc\d$/);
    assert.equal(p.actions[0], 'hold');
  }
  const refused = listPlacements({ ...state, canHold: false });
  assert.equal(refused.filter((p) => p.useHold).length, 0);
  assert.equal(refused.length, allowed.length - held.length);
});

test('playing a placement lands the piece where it said, with a hard drop\'s events', () => {
  const state = withPiece('T', makeBoard([GAP_ROW]));
  for (const p of listPlacements(state)) {
    const { state: after, events } = playActions(state, p.actions);
    const lock = events.find((e) => e.type === 'lock');
    assert.equal(lock.piece, p.piece, p.id);
    assert.equal(Math.min(...lock.cells.map(([x]) => x)), p.column, p.id);
    assert.equal(after.lines - state.lines, p.linesCleared, p.id);
    const { holes, height, bumpiness } = boardStats(after.board);
    assert.deepEqual({ holes, height, bumpiness }, { holes: p.holes, height: p.height, bumpiness: p.bumpiness });
    const before = playActions(state, p.actions.slice(0, -1));
    const dropEvents = hardDrop(before.state).events;
    assert.deepEqual(events, [...before.events, ...dropEvents], p.id);
    if (!p.useHold) assert.deepEqual(events, dropEvents, p.id);
  }
});

test('a game over leaves no placements', () => {
  assert.deepEqual(listPlacements({ ...withPiece('I'), over: true }), []);
});

test('turnBased keeps the piece still across step calls', () => {
  let state = newGame(3, { turnBased: true });
  const start = state.current;
  for (let i = 0; i < 400; i++) {
    state = step(state, 50);
    assert.deepEqual(state.events, []);
  }
  assert.deepEqual(state.current, start);
  let live = newGame(3);
  for (let i = 0; i < 40; i++) live = step(live, 50);
  assert.equal(live.current.y, start.y + 2, 'without turnBased the piece falls');
});
