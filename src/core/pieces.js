// Guideline tetrominoes in their SRS bounding boxes, orientation 0 (spawn).
export const PIECES = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

const BASE = {
  I: { size: 4, cells: [[0, 1], [1, 1], [2, 1], [3, 1]] },
  O: { size: 3, cells: [[1, 0], [2, 0], [1, 1], [2, 1]] },
  T: { size: 3, cells: [[1, 0], [0, 1], [1, 1], [2, 1]] },
  S: { size: 3, cells: [[1, 0], [2, 0], [0, 1], [1, 1]] },
  Z: { size: 3, cells: [[0, 0], [1, 0], [1, 1], [2, 1]] },
  J: { size: 3, cells: [[0, 0], [0, 1], [1, 1], [2, 1]] },
  L: { size: 3, cells: [[2, 0], [0, 1], [1, 1], [2, 1]] },
};

function orientations(type, { size, cells }) {
  if (type === 'O') return [cells, cells, cells, cells];
  const out = [cells];
  for (let i = 1; i < 4; i++) out.push(out[i - 1].map(([x, y]) => [size - 1 - y, x]));
  return out;
}

// SHAPES[type][rotation] for rotations 0, R, 2, L (indices 0-3).
export const SHAPES = Object.fromEntries(
  Object.entries(BASE).map(([type, base]) => [type, orientations(type, base)]),
);

export function pieceCells({ type, rotation, x, y }) {
  return SHAPES[type][rotation].map(([cx, cy]) => [x + cx, y + cy]);
}

// Every piece spawns flat in the two hidden rows, in the middle columns.
export function spawnPiece(type) {
  return { type, rotation: 0, x: 3, y: 0 };
}
