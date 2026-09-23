// The living background: a starfield whose speed and hue follow the level.
// Star positions are fractions of the board (0..1).
import { nextRandom } from '../core/random.js';

const STARS = 70;

export const hueFor = (level) => (230 + (level - 1) * 41) % 360;
export const speedFor = (level) => 0.02 + 0.012 * Math.min(level, 20); // boards / s

export function createBackground(seed, level = 1) {
  let rng = seed >>> 0;
  const r = () => {
    const [v, next] = nextRandom(rng);
    rng = next;
    return v;
  };
  const stars = Array.from({ length: STARS }, () => ({ x: r(), y: r(), z: 0.3 + r() * 0.7 }));
  return { level, hue: hueFor(level), speed: speedFor(level), stars };
}

export function setLevel(bg, level) {
  bg.level = level;
  bg.hue = hueFor(level);
  bg.speed = speedFor(level);
}

// Stars drift down and wrap; a still background does not move.
export function stepBackground(bg, dt, still) {
  if (still) return;
  const d = (bg.speed * dt) / 1000;
  for (const s of bg.stars) {
    s.y += d * s.z;
    if (s.y >= 1) s.y -= 1;
  }
}
