import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classify, dragCells } from '../../src/ui/gestures.js';

const CELL = 30;
// Points from (x0, y0) moving by (dx, dy) per step every `ms`.
function path(steps, dx, dy, ms, x0 = 100, y0 = 100) {
  return Array.from({ length: steps + 1 }, (_, i) => ({ x: x0 + i * dx, y: y0 + i * dy, t: i * ms }));
}

test('a short touch that barely moves is a tap', () => {
  const g = classify([{ x: 100, y: 100, t: 0 }, { x: 103, y: 102, t: 120 }], CELL);
  assert.equal(g.kind, 'tap');
});

test('a long press without moving is not a tap', () => {
  const g = classify([{ x: 100, y: 100, t: 0 }, { x: 101, y: 100, t: 600 }], CELL);
  assert.equal(g.kind, 'none');
});

test('a horizontal drag moves one cell per cell width dragged', () => {
  assert.deepEqual(classify(path(10, 10, 1, 20), CELL), { kind: 'drag', cells: 3, rows: 0 });
  assert.deepEqual(classify(path(5, -13, 0, 20), CELL), { kind: 'drag', cells: -2, rows: 0 });
});

test('a drag shorter than one cell moves nothing', () => {
  assert.equal(dragCells(path(2, 12, 0, 20), CELL), 0);
});

test('a quick downward flick hard-drops', () => {
  assert.equal(classify(path(4, 0, 40, 16), CELL).kind, 'flick');
});

test('a slow downward drag soft-drops one row per cell', () => {
  assert.deepEqual(classify(path(10, 0, 10, 50), CELL), { kind: 'soft', cells: 0, rows: 3 });
});

test('a slow drag that ends with a fast flick counts as a flick', () => {
  const slow = path(5, 0, 8, 50);
  const tail = path(3, 0, 40, 16, 100, 140).slice(1).map((p) => ({ ...p, t: p.t + 250 }));
  assert.equal(classify([...slow, ...tail], CELL).kind, 'flick');
});

test('a drag that returns to where it started is a drag of zero cells, not a tap', () => {
  const there = path(4, 15, 0, 20);
  const back = path(4, -15, 0, 20, 160, 100).slice(1).map((p) => ({ ...p, t: p.t + 80 }));
  assert.deepEqual(classify([...there, ...back], CELL), { kind: 'drag', cells: 0, rows: 0 });
});

test('a quick flick sampled sparsely (two points 120 ms apart) still hard-drops', () => {
  const g = classify([{ x: 100, y: 100, t: 0 }, { x: 100, y: 250, t: 120 }], CELL);
  assert.equal(g.kind, 'flick');
});

test('an upward swipe does nothing', () => {
  assert.equal(classify(path(4, 0, -40, 16), CELL).kind, 'none');
});
