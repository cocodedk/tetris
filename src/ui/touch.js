// Touch wiring: turns pointer gestures on the board into actions.
import { classify } from './gestures.js';
import { COLS } from '../core/index.js';

export function createTouch(surface, { accepts, onAction }) {
  let points = null;
  let movedCells = 0;
  let droppedRows = 0;

  const cellSize = () => surface.getBoundingClientRect().width / COLS;
  const point = (e) => ({ x: e.clientX, y: e.clientY, t: e.timeStamp });

  // Applies the part of a drag or slow drag not applied yet.
  function follow(g) {
    if (g.kind === 'drag') {
      for (; movedCells < g.cells; movedCells++) onAction('right');
      for (; movedCells > g.cells; movedCells--) onAction('left');
    }
    if (g.kind === 'soft') {
      for (; droppedRows < g.rows; droppedRows++) onAction('softDrop');
    }
  }

  surface.addEventListener('pointerdown', (e) => {
    if (!accepts('rotateCW')) return;
    points = [point(e)];
    movedCells = 0;
    droppedRows = 0;
    surface.setPointerCapture?.(e.pointerId);
  });

  surface.addEventListener('pointermove', (e) => {
    if (!points) return;
    points.push(point(e));
    follow(classify(points, cellSize()));
  });

  function end(e) {
    if (!points) return;
    points.push(point(e));
    const g = classify(points, cellSize());
    points = null;
    if (!accepts(g.kind === 'tap' ? 'rotateCW' : 'hardDrop')) return;
    if (g.kind === 'tap') onAction('rotateCW');
    else if (g.kind === 'flick') onAction('hardDrop');
    else follow(g);
  }

  surface.addEventListener('pointerup', end);
  surface.addEventListener('pointercancel', () => { points = null; });
}
