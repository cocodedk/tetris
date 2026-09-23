import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPool, spawn, stepParticles, fade, MAX_PARTICLES, GRAVITY } from '../../src/fx/particles.js';

const props = (life = 500) => ({ x: 1, y: 2, vx: 3, vy: -4, life, color: 'T', size: 0.1 });

test('a particle moves, falls with gravity and fades', () => {
  const pool = createPool();
  const p = spawn(pool, props());
  stepParticles(pool, 100);
  assert.ok(Math.abs(p.x - 1.3) < 1e-9);
  const vy = -4 + GRAVITY * 0.1;
  assert.ok(Math.abs(p.vy - vy) < 1e-9);
  assert.ok(Math.abs(p.y - (2 + vy * 0.1)) < 1e-9);
  assert.ok(Math.abs(fade(p) - 0.8) < 1e-9);
});

test('a particle is removed at the end of its life and its object is reused', () => {
  const pool = createPool();
  const p = spawn(pool, props(300));
  spawn(pool, props(600));
  stepParticles(pool, 299);
  assert.equal(pool.live.length, 2);
  stepParticles(pool, 1);
  assert.equal(pool.live.length, 1);
  assert.equal(pool.free.at(-1), p);
  assert.equal(spawn(pool, props()), p);
});

test('all particle objects are made up front; spawning creates none', () => {
  const pool = createPool();
  assert.equal(pool.free.length, MAX_PARTICLES);
  const all = new Set(pool.free);
  for (let i = 0; i < MAX_PARTICLES + 200; i++) assert.ok(all.has(spawn(pool, props())));
});

test('past the 1500 cap the oldest particles are dropped first', () => {
  const pool = createPool();
  for (let i = 0; i < MAX_PARTICLES + 10; i++) spawn(pool, props());
  assert.equal(pool.live.length, MAX_PARTICLES);
  const ids = pool.live.map((p) => p.id);
  assert.equal(Math.min(...ids), 10);
  assert.equal(Math.max(...ids), MAX_PARTICLES + 9);
});
