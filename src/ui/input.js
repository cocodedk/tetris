// Keyboard wiring: maps keys to actions and repeats held keys (DAS/ARR).
import { actionFor, REPEATS, repeatsAfter } from './keys.js';

const OPPOSITE = { left: 'right', right: 'left' };

// `accepts(action)` says whether the game wants this action now;
// `onAction(action)` performs it. Call `update(dt)` every frame.
export function createKeyboard(target, { accepts, onAction }) {
  const held = new Map(); // action -> { ms, done, code }

  function keydown(e) {
    const action = actionFor(e.code);
    if (!action || !accepts(action)) return;
    e.preventDefault();
    if (e.repeat) return; // our own repeat replaces the browser's
    if (REPEATS.has(action)) {
      held.delete(OPPOSITE[action]);
      held.set(action, { ms: 0, done: 1, code: e.code });
    }
    onAction(action);
  }

  function keyup(e) {
    for (const [action, h] of held) if (h.code === e.code) held.delete(action);
  }

  target.addEventListener('keydown', keydown);
  target.addEventListener('keyup', keyup);

  return {
    update(dt) {
      for (const [action, h] of held) {
        h.ms += dt;
        const total = repeatsAfter(action, h.ms);
        for (; h.done < total; h.done++) onAction(action);
      }
    },
    release() {
      held.clear();
    },
  };
}
