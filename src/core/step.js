import { canPlace, lockPiece, LOCK_DELAY_MS } from './game.js';
import { gravityInterval } from './scoring.js';

const down = (piece) => ({ ...piece, y: piece.y + 1 });

// Advances one frame of `dt` ms (at most 50; the UI clamps it).
export function step(state, dt) {
  if (state.over || !state.current) return { ...state, events: [] };
  const { board } = state;
  if (!canPlace(board, down(state.current))) {
    const lockMs = state.lockMs + dt;
    if (lockMs >= LOCK_DELAY_MS) return lockPiece({ ...state, lockMs }, []);
    return { ...state, lockMs, gravityMs: 0, events: [] };
  }
  const interval = gravityInterval(state.level);
  let current = state.current;
  let gravityMs = state.gravityMs + dt;
  while (gravityMs >= interval && canPlace(board, down(current))) {
    current = down(current);
    gravityMs -= interval;
  }
  if (canPlace(board, down(current))) return { ...state, current, gravityMs, lockMs: 0, events: [] };
  // Landed this frame: the time left after the landing counts toward the lock delay.
  const landed = { ...state, current, gravityMs: 0, lockMs: gravityMs };
  return gravityMs >= LOCK_DELAY_MS ? lockPiece(landed, []) : { ...landed, events: [] };
}
