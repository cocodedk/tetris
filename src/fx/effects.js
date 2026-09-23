// Effect state for the board, driven by the core's events and stepped by `dt`.
// Everything is in board cells and milliseconds; the UI turns it into pixels.
import { createPool, stepParticles } from './particles.js';
import { createShake, addShake, stepShake, dropShake, TETRIS_SHAKE } from './shake.js';
import { createBackground, setLevel, stepBackground } from './background.js';
import { clearBurst, impactSparks } from './bursts.js';

// How long each effect lasts (ms); every one ends within a second.
export const LIFE = {
  rowFlash: 350, boardFlash: 450, text: 950, combo: 800,
  trail: 280, glow: 320, wave: 850, gameOver: 650, // + a 300 ms screen fade in style.css
};
const SHORT = 0.5; // reduced mode keeps flashes and text, shortened

export function createFx({ seed = 1, reduced = false, level = 1 } = {}) {
  return {
    reduced,
    rng: seed >>> 0,
    particles: createPool(),
    shake: createShake(),
    bg: createBackground(seed, level),
    flashes: [], // { y, blocks } for a row, or { board: true }
    texts: [], // { text, x, y, size }
    trails: [], // { cols: [[x, fromY, toY]], color }
    glows: [], // { cells, color }
    waves: [], // {}
    over: null, // { t, life } once the game ends
  };
}

function add(fx, list, item, life) {
  list.push({ ...item, t: 0, life: fx.reduced ? life * SHORT : life });
}

// Start the effects for one action's events, in order.
export function fxEvents(fx, events) {
  for (const event of events) {
    if (event.type === 'hardDrop') hardDropFx(fx, event, events.find((e) => e.type === 'lock')?.piece);
    else if (event.type === 'lock') add(fx, fx.glows, { cells: event.cells, color: event.piece }, LIFE.glow);
    else if (event.type === 'clear') clearFx(fx, event);
    else if (event.type === 'levelUp') levelUpFx(fx, event.level);
    else if (event.type === 'gameOver') fx.over = { t: 0, life: LIFE.gameOver };
  }
}

function hardDropFx(fx, { cells, from, to }, color) {
  const dist = to - from;
  const top = new Map();
  for (const [x, y] of cells) top.set(x, Math.min(top.get(x) ?? Infinity, y));
  const cols = [...top].map(([x, y]) => [x, y - dist, y]);
  add(fx, fx.trails, { cols, color }, LIFE.trail);
  impactSparks(fx, cells, color);
  if (!fx.reduced && dist > 0) addShake(fx.shake, dropShake(dist));
}

function clearFx(fx, event) {
  event.rows.forEach((y, i) => add(fx, fx.flashes, { y, blocks: event.blocks[i] }, LIFE.rowFlash));
  clearBurst(fx, event);
  const mid = event.rows.reduce((a, b) => a + b, 0) / event.rows.length;
  if (event.tetris) {
    add(fx, fx.flashes, { board: true }, LIFE.boardFlash);
    add(fx, fx.texts, { text: 'TETRIS', x: 5, y: 10, size: 2.2 }, LIFE.text);
    if (event.backToBack) add(fx, fx.texts, { text: 'BACK-TO-BACK', x: 5, y: 12.5, size: 0.9 }, LIFE.text);
    if (!fx.reduced) addShake(fx.shake, TETRIS_SHAKE);
  }
  if (event.combo >= 2) {
    add(fx, fx.texts, { text: `COMBO ×${event.combo}`, x: 5, y: mid - 0.5, size: 0.9 }, LIFE.combo);
  }
}

function levelUpFx(fx, level) {
  add(fx, fx.waves, {}, LIFE.wave);
  setLevel(fx.bg, level);
}

function age(list, dt) {
  let n = 0;
  for (const item of list) {
    item.t += dt;
    if (item.t < item.life) list[n++] = item;
  }
  list.length = n;
}

export function stepFx(fx, dt) {
  stepParticles(fx.particles, dt);
  stepShake(fx.shake, dt);
  for (const list of [fx.flashes, fx.texts, fx.trails, fx.glows, fx.waves]) age(list, dt);
  if (fx.over) fx.over.t = Math.min(fx.over.t + dt, fx.over.life);
  stepBackground(fx.bg, dt, fx.reduced);
}

// 0..1: how far the stack has greyed out from the top.
export const greyed = (fx) => (fx.over ? fx.over.t / fx.over.life : 0);
export const gameOverDone = (fx) => greyed(fx) >= 1;

// 0 at birth, 1 at the end of its life.
export const progress = (item) => Math.min(1, item.t / item.life);
