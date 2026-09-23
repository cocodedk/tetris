// Touch gesture classifier. Pure: takes pointer points [{ x, y, t }] (px, ms).
export const TAP_MAX_PX = 10;
export const TAP_MAX_MS = 250;
export const FLICK_MIN_SPEED = 0.8; // px per ms, downward

// Whole cells dragged horizontally from the first point (signed, cumulative).
export function dragCells(points, cell) {
  const dx = points[points.length - 1].x - points[0].x;
  return Math.trunc(dx / cell);
}

export const SPEED_WINDOW_MS = 100;

// Downward speed from the latest point at least 100 ms before the end
// (or the first point, if the gesture is shorter or sampled sparsely).
function downSpeed(points) {
  const last = points[points.length - 1];
  let from = points[0];
  for (let i = points.length - 2; i >= 0; i--) {
    if (last.t - points[i].t >= SPEED_WINDOW_MS) { from = points[i]; break; }
  }
  const dt = last.t - from.t;
  return dt > 0 ? (last.y - from.y) / dt : 0;
}

// Farthest the pointer got from where it started.
const reach = (points) =>
  Math.max(...points.map((p) => Math.hypot(p.x - points[0].x, p.y - points[0].y)));

// Returns { kind: 'tap' | 'drag' | 'flick' | 'soft' | 'none', cells, rows }.
export function classify(points, cell) {
  const first = points[0];
  const last = points[points.length - 1];
  const dx = last.x - first.x;
  const dy = last.y - first.y;
  // A tap never leaves the tap radius; a drag that comes back is still a drag.
  if (reach(points) < TAP_MAX_PX) {
    const kind = last.t - first.t <= TAP_MAX_MS ? 'tap' : 'none';
    return { kind, cells: 0, rows: 0 };
  }
  if (Math.abs(dx) >= Math.abs(dy)) return { kind: 'drag', cells: dragCells(points, cell), rows: 0 };
  if (dy < 0) return { kind: 'none', cells: 0, rows: 0 };
  if (downSpeed(points) >= FLICK_MIN_SPEED) return { kind: 'flick', cells: 0, rows: 0 };
  return { kind: 'soft', cells: 0, rows: Math.trunc(dy / cell) };
}
