import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PIECES } from '../../src/core/pieces.js';
import { shuffledBag, fillQueue } from '../../src/core/bag.js';
import { nextRandom } from '../../src/core/random.js';
import { newGame, nextPieces } from '../../src/core/game.js';
import { hardDrop } from '../../src/core/actions.js';
import { emptyBoard } from '../../src/core/board.js';

const sorted = (list) => [...list].sort();

test('the random generator is pure: same state, same value and next state', () => {
  assert.deepEqual(nextRandom(42), nextRandom(42));
  const [value, next] = nextRandom(42);
  assert.ok(value >= 0 && value < 1);
  assert.equal(typeof next, 'number');
  assert.notEqual(next, 42);
});

test('each bag holds every piece exactly once', () => {
  let seed = 9;
  for (let i = 0; i < 20; i++) {
    const bag = shuffledBag(seed);
    assert.deepEqual(sorted(bag.pieces), sorted(PIECES));
    seed = bag.seed;
  }
});

test('the bag is shuffled with the random function passed in', () => {
  const zero = (s) => [0, s + 1];
  const bag = shuffledBag(0, zero);
  assert.deepEqual(bag.pieces, ['O', 'T', 'S', 'Z', 'J', 'L', 'I']);
  assert.equal(bag.seed, 6);
});

test('the same seed gives the same 14 pieces, each 7 a full bag', () => {
  const a = fillQueue([], 1234, 14).queue;
  const b = fillQueue([], 1234, 14).queue;
  assert.equal(a.length, 14);
  assert.deepEqual(a, b);
  assert.deepEqual(sorted(a.slice(0, 7)), sorted(PIECES));
  assert.deepEqual(sorted(a.slice(7, 14)), sorted(PIECES));
  const others = [1, 2, 3, 4, 5].map((s) => fillQueue([], s, 14).queue.join(''));
  assert.ok(others.some((seq) => seq !== a.join('')), 'different seeds give different sequences');
});

test('a game replays its seed: the same 14 pieces in play, 5 always in preview', () => {
  const play = (seed) => {
    let state = newGame(seed);
    const seen = [];
    for (let i = 0; i < 14; i++) {
      seen.push(state.current.type);
      assert.equal(nextPieces(state).length, 5);
      state = hardDrop({ ...state, board: emptyBoard() });
    }
    return seen;
  };
  const seen = play(77);
  assert.deepEqual(seen, play(77));
  assert.deepEqual(seen, fillQueue([], 77, 14).queue);
  assert.deepEqual(newGame(77), newGame(77));
});

test('the state is plain data', () => {
  const state = newGame(5);
  assert.deepEqual(JSON.parse(JSON.stringify(state)), state);
});
