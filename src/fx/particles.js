// A fixed pool of particles. Positions are in board cells, speeds in cells per second.
export const MAX_PARTICLES = 1500;
export const GRAVITY = 30; // cells / s²

const blank = () => ({ x: 0, y: 0, vx: 0, vy: 0, age: 0, life: 0, color: '', size: 0, id: 0 });

// Every particle object is made here, once; spawning reuses them.
export function createPool(max = MAX_PARTICLES) {
  return { max, live: [], free: Array.from({ length: max }, blank), born: 0 };
}

// Takes a free particle, or drops the oldest live one when the pool is full.
export function spawn(pool, props) {
  const p = pool.free.pop() ?? pool.live.shift();
  Object.assign(p, props, { age: 0, id: pool.born++ });
  pool.live.push(p);
  return p;
}

// Moves, ages and falls; a particle past its life goes back to the free list.
export function stepParticles(pool, dt) {
  const s = dt / 1000;
  const { live } = pool;
  let n = 0;
  for (let i = 0; i < live.length; i++) {
    const p = live[i];
    p.age += dt;
    if (p.age >= p.life) {
      pool.free.push(p);
      continue;
    }
    p.vy += GRAVITY * s;
    p.x += p.vx * s;
    p.y += p.vy * s;
    live[n++] = p;
  }
  live.length = n;
}

// 1 when born, 0 at the end of its life.
export const fade = (p) => Math.max(0, 1 - p.age / p.life);
