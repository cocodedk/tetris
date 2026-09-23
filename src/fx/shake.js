// Screen shake: an amplitude in cells that decays to zero.
const DECAY_MS = 110;
const REST = 0.005;
export const TETRIS_SHAKE = 0.5;
const DROP_BASE = 0.04;
const DROP_PER_ROW = 0.015;
const DROP_MAX = 0.35;

export const createShake = () => ({ amp: 0, time: 0 });

export function addShake(shake, amp) {
  shake.amp = Math.max(shake.amp, amp);
}

// A hard drop shakes more the further the piece fell.
export const dropShake = (rows) => Math.min(DROP_MAX, DROP_BASE + DROP_PER_ROW * Math.max(0, rows));

export function stepShake(shake, dt) {
  shake.time += dt;
  shake.amp *= Math.exp(-dt / DECAY_MS);
  if (shake.amp < REST) shake.amp = 0;
}

// The board's offset [dx, dy] in cells this frame.
export function shakeOffset(shake) {
  if (!shake.amp) return [0, 0];
  return [shake.amp * Math.sin(shake.time * 0.09), shake.amp * Math.cos(shake.time * 0.113)];
}
