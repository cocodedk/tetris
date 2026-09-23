import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  newGame, moveLeft, moveRight, hardDrop, rotateCW, rotateCCW, hold, listPlacements, playActions,
} from '../../src/core/index.js';
import { createTools, initWebMcp } from '../../src/ui/webmcp.js';
import { makeBoard, GAP_ROW } from '../core/helpers.js';

const ACTIONS = { left: moveLeft, right: moveRight, hardDrop, rotateCW, rotateCCW, hold };
const NAMES = ['get_game', 'list_placements', 'place', 'new_game'];

// Stands in for main.js's adapter: the same perform rules, no DOM.
function fakeGame(state = newGame(1), mode = 'playing') {
  const game = {
    get state() { return state; },
    set state(s) { state = s; },
    mode,
    read: () => ({ state, mode: game.mode }),
    perform(action) {
      if (game.mode !== 'playing') return;
      state = ACTIONS[action](state);
      if (state.over) game.mode = 'over';
    },
    start({ seed, turnBased }) { state = newGame(seed, { turnBased }); game.mode = 'playing'; },
    resume() { if (game.mode === 'paused') game.mode = 'playing'; },
  };
  return game;
}

const toolsOf = (game) => Object.fromEntries(createTools(game).map((t) => [t.name, t]));
const call = (game, name, input = {}) => toolsOf(game)[name].execute(input, {});
const prepared = () => ({ ...newGame(1), board: makeBoard([GAP_ROW]),
  current: { type: 'I', rotation: 0, x: 3, y: 0 } });

test('four tools; only get_game and list_placements are read-only', () => {
  const tools = createTools(fakeGame());
  assert.deepEqual(tools.map((t) => t.name), NAMES);
  for (const t of tools) {
    assert.ok(t.title && t.description.length > 40 && t.inputSchema.type === 'object', t.name);
    assert.equal(t.annotations.readOnlyHint, t.name === 'get_game' || t.name === 'list_placements');
  }
});

test('get_game gives status, 20 rows of 10, the piece, hold, next five and the numbers', async () => {
  const game = fakeGame(prepared());
  for (const input of [{}, 'x', [1], { junk: true }, undefined]) {
    const view = await call(game, 'get_game', input);
    assert.equal(view.ok, true);
    assert.equal(view.status, 'playing');
    assert.equal(view.board.length, 20);
    assert.ok(view.board.every((row) => /^[.IOTSZJL#]{10}$/.test(row)));
    assert.equal(view.board[19], GAP_ROW);
    assert.deepEqual(view.current, { piece: 'I', rotation: 0, cells: [[3, -1], [4, -1], [5, -1], [6, -1]] });
    assert.equal(view.next.length, 5);
    assert.deepEqual([view.hold, view.score, view.level, view.lines], [null, 0, 1, 0]);
  }
});

test('list_placements ignores its input and hides the replay plan', async () => {
  const game = fakeGame(prepared());
  const ids = listPlacements(game.state).map((p) => p.id);
  for (const input of [{}, 'x', [1], { id: 3 }]) {
    const out = await call(game, 'list_placements', input);
    assert.equal(out.ok, true);
    assert.deepEqual(out.placements.map((p) => p.id), ids);
    assert.ok(out.placements.every((p) => !('actions' in p)));
  }
  game.mode = 'over';
  assert.deepEqual((await call(game, 'list_placements')).placements, []);
});

test('place lands the piece where its placement said, with a hard drop\'s events', async () => {
  const game = fakeGame(prepared());
  const before = game.state;
  const chosen = listPlacements(before).find((p) => p.id === '-r1c9');
  const out = await call(game, 'place', { id: '-r1c9' });
  assert.equal(out.ok, true);
  assert.equal(out.placed.id, '-r1c9');
  assert.deepEqual(out.events, playActions(before, chosen.actions).events);
  assert.deepEqual(out.events.map((e) => e.type).slice(0, 3), ['hardDrop', 'lock', 'clear']);
  assert.equal(out.lines, 1);
  assert.deepEqual(out.board.slice(17), ['.........I', '.........I', '.........I']);
});

test('place with hold swaps first and reports the hold event', async () => {
  const game = fakeGame(prepared());
  const held = listPlacements(game.state).find((p) => p.useHold);
  const out = await call(game, 'place', { id: held.id });
  assert.equal(out.ok, true);
  assert.equal(out.events[0].type, 'hold');
  assert.equal(out.hold, 'I');
});

test('an id not in the list answers ok: false with the valid ids, changing nothing', async () => {
  const game = fakeGame(prepared());
  const before = game.state;
  const out = await call(game, 'place', { id: '-r0c9' });
  assert.equal(out.ok, false);
  assert.match(out.error, /-r0c9/);
  assert.deepEqual(out.validIds, listPlacements(before).map((p) => p.id));
  assert.equal(game.state, before);
});

test('a non-string id answers ok: false', async () => {
  const game = fakeGame();
  for (const input of [{ id: 4 }, { id: null }, {}, null, 'r0c0', [{ id: '-r0c0' }]]) {
    const out = await call(game, 'place', input);
    assert.equal(out.ok, false, JSON.stringify(input));
    assert.match(out.error, /id: string/);
  }
});

test('place resumes a paused game and refuses before a game starts', async () => {
  const game = fakeGame(prepared(), 'paused');
  assert.ok((await call(game, 'list_placements')).placements.length > 0);
  assert.equal(game.mode, 'paused', 'listing does not resume');
  assert.equal((await call(game, 'place', { id: '-r0c0' })).ok, true);
  assert.equal(game.mode, 'playing');
  const fresh = fakeGame(newGame(1), 'start');
  const out = await call(fresh, 'place', { id: '-r0c0' });
  assert.equal(out.ok, false);
  assert.match(out.error, /new_game/);
});

test('new_game refuses unknown keys and wrongly typed seed or turnBased', async () => {
  const game = fakeGame();
  const bad = [{ level: 3 }, { seed: 1, turbo: true }, { seed: '7' }, { seed: 1.5 },
    { turnBased: 'yes' }, { turnBased: 1 }, null, 'seed', [1]];
  for (const input of bad) {
    const out = await call(game, 'new_game', input);
    assert.equal(out.ok, false, JSON.stringify(input));
    assert.match(out.error, /seed\?: integer, turnBased\?: true or false/);
  }
});

test('new_game starts a seeded, turn-based game', async () => {
  const game = fakeGame(newGame(1), 'over');
  const out = await call(game, 'new_game', { seed: 42, turnBased: true });
  assert.equal(out.ok, true);
  assert.equal(out.status, 'playing');
  assert.equal(out.turnBased, true);
  assert.deepEqual(out.next, (await call(fakeGame(newGame(42)), 'get_game')).next);
  assert.equal((await call(game, 'new_game', {})).turnBased, false);
});

test('a tool that throws answers ok: false instead', async () => {
  const game = { read() { throw new Error('boom'); } };
  const out = await call(game, 'get_game');
  assert.deepEqual(out, { ok: false, error: 'boom' });
});

test('without document.modelContext the module does nothing', async () => {
  const throwing = { get modelContext() { throw new Error('no'); } };
  for (const doc of [undefined, null, {}, { modelContext: {} }, throwing]) {
    assert.deepEqual(await initWebMcp(doc, fakeGame()), []);
  }
});

test('one refused registration leaves the other three registered', async () => {
  for (const refuse of [(t) => Promise.reject(new Error(`dup ${t.name}`)), () => { throw new Error('sync'); }]) {
    const registered = [];
    const modelContext = {
      registerTool(tool) {
        if (tool.name === 'place') return refuse(tool);
        registered.push(tool.name);
        return Promise.resolve();
      },
    };
    const names = await initWebMcp({ modelContext }, fakeGame());
    assert.deepEqual(registered, ['get_game', 'list_placements', 'new_game']);
    assert.deepEqual(names, registered);
  }
});
