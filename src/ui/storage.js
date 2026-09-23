// Best score and effects choice in localStorage; the game works without it.
import { EFFECTS } from '../fx/motion.js';

const KEY = 'tetris.best';
let sessionBest = 0; // used when storage is blocked

export function readBest() {
  try {
    const n = Number(globalThis.localStorage?.getItem(KEY));
    return Math.max(sessionBest, Number.isFinite(n) ? Math.floor(n) : 0);
  } catch {
    return sessionBest;
  }
}

export function saveBest(score) {
  sessionBest = Math.max(readBest(), score);
  try {
    globalThis.localStorage?.setItem(KEY, String(sessionBest));
  } catch {
    // Storage blocked or full: the best lasts for this session only.
  }
  return sessionBest;
}

// The effects toggle: 'full', 'reduced', or null when the player has not chosen.
const FX_KEY = 'tetris.effects';
let sessionEffects = null;

export function readEffects() {
  try {
    const value = globalThis.localStorage?.getItem(FX_KEY);
    return EFFECTS.includes(value) ? value : sessionEffects;
  } catch {
    return sessionEffects;
  }
}

export function saveEffects(choice) {
  sessionEffects = choice;
  try {
    globalThis.localStorage?.setItem(FX_KEY, choice);
  } catch {
    // Storage blocked: the choice lasts for this session only.
  }
}
