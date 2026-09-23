// The board is 22 rows of 10 cells, each null or a piece letter.
// Rows 0-1 are hidden (spawn area); rows 2-21 are visible. Every `rows` and
// `cells` value in the events is in these board coordinates: [x, y], y down.
export const COLS = 10;
export const VISIBLE_ROWS = 20;
export const HIDDEN_ROWS = 2;
export const ROWS = VISIBLE_ROWS + HIDDEN_ROWS;

export const emptyRow = () => Array(COLS).fill(null);
export const emptyBoard = () => Array.from({ length: ROWS }, emptyRow);

export function fits(board, cells) {
  return cells.every(([x, y]) =>
    x >= 0 && x < COLS && y >= 0 && y < ROWS && board[y][x] === null);
}

export function placeCells(board, cells, type) {
  const next = board.map((row) => [...row]);
  for (const [x, y] of cells) next[y][x] = type;
  return next;
}

export function fullRows(board) {
  return board.flatMap((row, y) => (row.every((c) => c !== null) ? [y] : []));
}

// Removes the given rows; the rows above fall and empty rows fill the top.
export function clearRows(board, rows) {
  const kept = board.filter((_, y) => !rows.includes(y));
  return [...rows.map(emptyRow), ...kept];
}
