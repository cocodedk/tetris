// Shared test fixtures (no tests here).
import { emptyBoard, ROWS } from '../../src/core/board.js';

// Builds a board from strings aligned to the bottom row; '.' is empty.
export function makeBoard(lines = []) {
  const board = emptyBoard();
  lines.forEach((line, i) => {
    const y = ROWS - lines.length + i;
    [...line].forEach((c, x) => { if (c !== '.') board[y][x] = c; });
  });
  return board;
}

export const sortCells = (cells) =>
  [...cells].sort(([ax, ay], [bx, by]) => ay - by || ax - bx);

export const types = (state) => state.events.map((e) => e.type);

export const GAP_ROW = '#########.';
// An upright I that falls into column 9.
export const UPRIGHT_I = { type: 'I', rotation: 1, x: 7, y: 0 };
