import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PIECES, pieceCells, spawnPiece } from '../../src/core/pieces.js';
import { newGame } from '../../src/core/game.js';
import { sortCells } from './helpers.js';

const SPAWN_CELLS = {
  I: [[3, 1], [4, 1], [5, 1], [6, 1]],
  O: [[4, 0], [5, 0], [4, 1], [5, 1]],
  T: [[4, 0], [3, 1], [4, 1], [5, 1]],
  S: [[4, 0], [5, 0], [3, 1], [4, 1]],
  Z: [[3, 0], [4, 0], [4, 1], [5, 1]],
  J: [[3, 0], [3, 1], [4, 1], [5, 1]],
  L: [[5, 0], [3, 1], [4, 1], [5, 1]],
};

test('there are seven pieces', () => {
  assert.deepEqual([...PIECES].sort(), ['I', 'J', 'L', 'O', 'S', 'T', 'Z']);
});

for (const type of PIECES) {
  test(`${type} spawns flat in the hidden rows, middle columns, orientation 0`, () => {
    const piece = spawnPiece(type);
    assert.equal(piece.rotation, 0);
    assert.deepEqual(sortCells(pieceCells(piece)), sortCells(SPAWN_CELLS[type]));
  });
}

test('a new game spawns its first piece at the spawn position', () => {
  const state = newGame(3);
  assert.deepEqual(state.current, spawnPiece(state.current.type));
});

// Box-relative cells for each orientation 0, R, 2, L.
const ORIENTATIONS = {
  T: [
    [[1, 0], [0, 1], [1, 1], [2, 1]],
    [[1, 0], [1, 1], [2, 1], [1, 2]],
    [[0, 1], [1, 1], [2, 1], [1, 2]],
    [[1, 0], [0, 1], [1, 1], [1, 2]],
  ],
  I: [
    [[0, 1], [1, 1], [2, 1], [3, 1]],
    [[2, 0], [2, 1], [2, 2], [2, 3]],
    [[0, 2], [1, 2], [2, 2], [3, 2]],
    [[1, 0], [1, 1], [1, 2], [1, 3]],
  ],
  J: [
    [[0, 0], [0, 1], [1, 1], [2, 1]],
    [[1, 0], [2, 0], [1, 1], [1, 2]],
    [[0, 1], [1, 1], [2, 1], [2, 2]],
    [[1, 0], [1, 1], [0, 2], [1, 2]],
  ],
  S: [
    [[1, 0], [2, 0], [0, 1], [1, 1]],
    [[1, 0], [1, 1], [2, 1], [2, 2]],
    [[1, 1], [2, 1], [0, 2], [1, 2]],
    [[0, 0], [0, 1], [1, 1], [1, 2]],
  ],
  O: Array(4).fill([[1, 0], [2, 0], [1, 1], [2, 1]]),
};

for (const [type, shapes] of Object.entries(ORIENTATIONS)) {
  test(`${type} has the guideline orientations 0, R, 2, L`, () => {
    shapes.forEach((cells, rotation) => {
      const got = pieceCells({ type, rotation, x: 0, y: 0 });
      assert.deepEqual(sortCells(got), sortCells(cells), `rotation ${rotation}`);
    });
  });
}
