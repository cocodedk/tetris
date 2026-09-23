import { emptyBoard, fits, placeCells, fullRows, clearRows, HIDDEN_ROWS } from './board.js';
import { pieceCells, spawnPiece } from './pieces.js';
import { fillQueue } from './bag.js';
import { clearPoints, levelFor } from './scoring.js';

export const PREVIEW = 5;
export const LOCK_DELAY_MS = 500;

// The whole game is plain data; every action returns a new state whose
// `events` lists what that action did.
// With `turnBased`, gravity and lock delay stop: a piece moves only when acted on.
export function newGame(seed = 1, { turnBased = false } = {}) {
  const { queue, seed: rng } = fillQueue([], seed >>> 0, PREVIEW + 1);
  return spawnNext({
    turnBased,
    board: emptyBoard(),
    current: null,
    queue,
    hold: null,
    canHold: true,
    rng,
    score: 0,
    level: 1,
    lines: 0,
    combo: -1,
    backToBack: false,
    gravityMs: 0,
    lockMs: 0,
    over: false,
    events: [],
  }, []);
}

export const nextPieces = (state) => state.queue.slice(0, PREVIEW);

export const canPlace = (board, piece) => fits(board, pieceCells(piece));

// The row the current piece would land on (the ghost's y).
export function ghostY(state) {
  const { board, current } = state;
  let y = current.y;
  while (canPlace(board, { ...current, y: y + 1 })) y++;
  return y;
}

export function spawnType(state, type, events) {
  const current = spawnPiece(type);
  const next = { ...state, current, gravityMs: 0, lockMs: 0 };
  if (canPlace(next.board, current)) return { ...next, events };
  return { ...next, over: true, events: [...events, { type: 'gameOver', reason: 'blockOut' }] };
}

export function spawnNext(state, events) {
  const [type, ...rest] = state.queue;
  const { queue, seed } = fillQueue(rest, state.rng, PREVIEW);
  return spawnType({ ...state, queue, rng: seed }, type, events);
}

function applyClear(state, rows, events) {
  const count = rows.length;
  const tetris = count === 4;
  const backToBack = tetris && state.backToBack;
  const combo = state.combo + 1;
  const points = clearPoints({ count, level: state.level, backToBack, combo });
  const blocks = rows.map((y) => [...state.board[y]]);
  const lines = state.lines + count;
  const level = Math.max(state.level, levelFor(lines));
  const out = [...events, { type: 'clear', rows, count, tetris, backToBack, combo, points, blocks }];
  if (level > state.level) out.push({ type: 'levelUp', level });
  const next = {
    ...state,
    board: clearRows(state.board, rows),
    score: state.score + points,
    lines,
    level,
    combo,
    backToBack: tetris,
  };
  return { state: next, events: out };
}

// Locks the current piece, clears rows, scores, and spawns the next piece.
export function lockPiece(state, events) {
  const piece = state.current;
  const cells = pieceCells(piece);
  const board = placeCells(state.board, cells, piece.type);
  let out = [...events, { type: 'lock', piece: piece.type, cells }];
  if (cells.every(([, y]) => y < HIDDEN_ROWS)) {
    out = [...out, { type: 'gameOver', reason: 'lockOut' }];
    return { ...state, board, current: null, over: true, events: out };
  }
  let next = { ...state, board, canHold: true };
  const rows = fullRows(board);
  if (rows.length === 0) {
    next.combo = -1;
  } else {
    ({ state: next, events: out } = applyClear(next, rows, out));
  }
  return spawnNext(next, out);
}
