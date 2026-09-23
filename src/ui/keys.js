// Keyboard map and auto-repeat timing. Pure: no DOM.
// Keys are matched on `event.code` (the physical key), so a Persian layout still works.
export const KEY_MAP = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowDown: 'softDrop',
  Space: 'hardDrop',
  ArrowUp: 'rotateCW',
  KeyX: 'rotateCW',
  KeyZ: 'rotateCCW',
  ControlLeft: 'rotateCCW',
  ControlRight: 'rotateCCW',
  KeyC: 'hold',
  ShiftLeft: 'hold',
  ShiftRight: 'hold',
  KeyP: 'pause',
  Escape: 'pause',
};

export const actionFor = (code) => KEY_MAP[code] ?? null;

// Actions that repeat while held (the rest fire once per press).
export const REPEATS = new Set(['left', 'right', 'softDrop']);

export const DAS_MS = 170;
export const ARR_MS = 50;

// How many moves a key held for `heldMs` has made in total:
// one on press, one more at DAS, then one every ARR.
export function movesAfter(heldMs) {
  if (heldMs < DAS_MS) return 1;
  return 2 + Math.floor((heldMs - DAS_MS) / ARR_MS);
}

// Soft drop has no delay: one row on press, then one every ARR.
export const dropsAfter = (heldMs) => 1 + Math.floor(heldMs / ARR_MS);

export const repeatsAfter = (action, heldMs) =>
  (action === 'softDrop' ? dropsAfter(heldMs) : movesAfter(heldMs));
