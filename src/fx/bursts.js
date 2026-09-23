// Particle bursts. Colours are piece letters (or 'white'); the UI maps them to paint.
import { nextRandom } from '../core/random.js';
import { spawn } from './particles.js';

export const PER_CELL = 10;
export const TETRIS_EXTRA = 240;
export const SPARKS_PER_CELL = 4;
const CENTER_X = 5;

export function rand(fx) {
  const [v, next] = nextRandom(fx.rng);
  fx.rng = next;
  return v;
}

function particle(fx, x, y, vx, vy, color) {
  spawn(fx.particles, {
    x, y, vx, vy, color,
    life: 450 + rand(fx) * 450,
    size: 0.08 + rand(fx) * 0.12,
  });
}

// n particles flung from (x, y) in every direction, drifting away from the centre column.
function burst(fx, x, y, color, n, power) {
  for (let i = 0; i < n; i++) {
    const a = rand(fx) * Math.PI * 2;
    const s = power * (0.3 + rand(fx) * 0.7);
    const out = (x - CENTER_X) * 0.9;
    particle(fx, x, y, Math.cos(a) * s + out, Math.sin(a) * s - power * 0.6, color);
  }
}

// Each cleared cell bursts in its own colour; a Tetris adds a big white burst.
export function clearBurst(fx, event) {
  if (fx.reduced) return;
  event.rows.forEach((y, i) => {
    event.blocks[i].forEach((type, x) => {
      if (type) burst(fx, x + 0.5, y + 0.5, type, PER_CELL, 6);
    });
  });
  if (!event.tetris) return;
  const mid = event.rows.reduce((a, b) => a + b, 0) / event.rows.length + 0.5;
  burst(fx, CENTER_X, mid, 'white', TETRIS_EXTRA, 14);
}

// A short row of sparks under the lowest cell of each column the piece landed on.
export function impactSparks(fx, cells, color) {
  if (fx.reduced) return;
  const bottom = new Map();
  for (const [x, y] of cells) bottom.set(x, Math.max(bottom.get(x) ?? -1, y));
  for (const [x, y] of bottom) {
    for (let i = 0; i < SPARKS_PER_CELL; i++) {
      const vx = (rand(fx) - 0.5) * 8;
      particle(fx, x + rand(fx), y + 1, vx, -2 - rand(fx) * 4, color);
    }
  }
}
