// Canvas drawing: board, current piece, ghost, hold and preview.
import { COLS, ROWS, HIDDEN_ROWS, pieceCells, ghostY } from '../core/index.js';
import { SHAPES } from '../core/pieces.js';

export const COLORS = {
  I: '#35e0ff', O: '#ffd83d', T: '#b45cff', S: '#4dff7a',
  Z: '#ff4d6d', J: '#4d7bff', L: '#ff9a3d',
};

// Sizes the backing store to CSS size x device pixel ratio; draws in CSS pixels.
export function fitCanvas(canvas) {
  const dpr = globalThis.devicePixelRatio || 1;
  const { width, height } = canvas.getBoundingClientRect();
  const pw = Math.max(1, Math.round(width * dpr));
  const ph = Math.max(1, Math.round(height * dpr));
  if (canvas.width !== pw || canvas.height !== ph) {
    canvas.width = pw;
    canvas.height = ph;
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  return { ctx, w: width, h: height };
}

function block(ctx, x, y, size, color, alpha = 1) {
  const pad = Math.max(1, size * 0.06);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.fillRect(x + pad, y + pad, size - 2 * pad, size - 2 * pad);
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillRect(x + pad, y + pad, size - 2 * pad, size * 0.18);
  ctx.globalAlpha = 1;
}

function outline(ctx, x, y, size, color) {
  const pad = Math.max(1, size * 0.1);
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1, size * 0.08);
  ctx.globalAlpha = 0.6;
  ctx.strokeRect(x + pad, y + pad, size - 2 * pad, size - 2 * pad);
  ctx.globalAlpha = 1;
}

function grid(ctx, cell, w, h) {
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 1; x < COLS; x++) { ctx.moveTo(x * cell, 0); ctx.lineTo(x * cell, h); }
  for (let y = 1; y < ROWS; y++) { ctx.moveTo(0, y * cell); ctx.lineTo(w, y * cell); }
  ctx.stroke();
}

// Draws all rows; the two spawn rows on top are a dimmed strip, so a new piece is seen at once.
export function drawBoard(canvas, state) {
  const { ctx, w, h } = fitCanvas(canvas);
  const cell = Math.min(w / COLS, h / ROWS);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(0, 0, w, HIDDEN_ROWS * cell);
  grid(ctx, cell, w, h);
  const at = (x, y) => [x * cell, y * cell];
  state.board.forEach((row, y) => {
    row.forEach((type, x) => { if (type) block(ctx, ...at(x, y), cell, COLORS[type]); });
  });
  const piece = state.current;
  if (!piece || state.over) return;
  const color = COLORS[piece.type];
  for (const [x, y] of pieceCells({ ...piece, y: ghostY(state) })) outline(ctx, ...at(x, y), cell, color);
  for (const [x, y] of pieceCells(piece)) block(ctx, ...at(x, y), cell, color);
}

// One piece centred in a box, in orientation 0.
function miniPiece(ctx, type, bx, by, bw, bh, cell, alpha) {
  const cells = SHAPES[type][0];
  const xs = cells.map(([x]) => x);
  const ys = cells.map(([, y]) => y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const pw = (Math.max(...xs) - minX + 1) * cell;
  const ph = (Math.max(...ys) - minY + 1) * cell;
  const ox = bx + (bw - pw) / 2;
  const oy = by + (bh - ph) / 2;
  for (const [x, y] of cells) {
    block(ctx, ox + (x - minX) * cell, oy + (y - minY) * cell, cell, COLORS[type], alpha);
  }
}

// Pieces stacked top to bottom, one per slot (hold is a list of one).
export function drawPieces(canvas, types, { slots = types.length, alpha = 1 } = {}) {
  const { ctx, w, h } = fitCanvas(canvas);
  const slotH = h / Math.max(1, slots);
  const cell = Math.min(w / 5, slotH / 2.6);
  types.forEach((type, i) => {
    if (type) miniPiece(ctx, type, 0, i * slotH, w, slotH, cell, alpha);
  });
}
