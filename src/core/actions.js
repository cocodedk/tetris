import { pieceCells } from './pieces.js';
import { kickOffsets } from './kicks.js';
import { canPlace, ghostY, lockPiece, spawnNext, spawnType } from './game.js';

const idle = (state) => state.over || !state.current;
const quiet = (state) => ({ ...state, events: [] });

function shift(state, dx, dy) {
  if (idle(state)) return null;
  const moved = { ...state.current, x: state.current.x + dx, y: state.current.y + dy };
  return canPlace(state.board, moved) ? moved : null;
}

function slide(state, dx) {
  const moved = shift(state, dx, 0);
  return moved ? { ...state, current: moved, lockMs: 0, events: [] } : quiet(state);
}

export const moveLeft = (state) => slide(state, -1);
export const moveRight = (state) => slide(state, 1);

// One row down, 1 point.
export function softDrop(state) {
  const moved = shift(state, 0, 1);
  if (!moved) return quiet(state);
  return { ...state, current: moved, score: state.score + 1, gravityMs: 0, lockMs: 0, events: [] };
}

// Straight to the ghost row, 2 points per row, then lock.
export function hardDrop(state) {
  if (idle(state)) return quiet(state);
  const from = state.current.y;
  const to = ghostY(state);
  const current = { ...state.current, y: to };
  const event = { type: 'hardDrop', cells: pieceCells(current), from, to };
  return lockPiece({ ...state, current, score: state.score + 2 * (to - from) }, [event]);
}

function rotate(state, dir) {
  if (idle(state)) return quiet(state);
  const { current } = state;
  const to = (current.rotation + dir + 4) % 4;
  for (const [dx, dy] of kickOffsets(current.type, current.rotation, to)) {
    const moved = { ...current, rotation: to, x: current.x + dx, y: current.y - dy };
    if (canPlace(state.board, moved)) return { ...state, current: moved, lockMs: 0, events: [] };
  }
  return quiet(state);
}

export const rotateCW = (state) => rotate(state, 1);
export const rotateCCW = (state) => rotate(state, -1);

// Swap with the held piece (or take the next), once until the piece locks.
export function hold(state) {
  if (idle(state) || !state.canHold) return quiet(state);
  const held = state.current.type;
  const events = [{ type: 'hold', piece: held }];
  const next = { ...state, hold: held, canHold: false };
  return state.hold ? spawnType(next, state.hold, events) : spawnNext(next, events);
}
