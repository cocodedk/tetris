// Canvas drawing: board, current piece, ghost, hold and preview, with the effects on top.
import { COLS, ROWS, HIDDEN_ROWS, pieceCells, ghostY } from '../core/index.js';
import { SHAPES } from '../core/pieces.js';
import { shakeOffset } from '../fx/shake.js';
import { greyed } from '../fx/effects.js';
import { COLORS, GREY, block, glowOutline } from './blocks.js';
import { drawBackground, drawGlows, drawEffects } from './fx-draw.js';

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

function grid(ctx, cell, w, h) {
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 1; x < COLS; x++) { ctx.moveTo(x * cell, 0); ctx.lineTo(x * cell, h); }
  for (let y = 1; y < ROWS; y++) { ctx.moveTo(0, y * cell); ctx.lineTo(w, y * cell); }
  ctx.stroke();
}

// Draws all rows; the two spawn rows on top are a dimmed strip, so a new piece is seen at once.
// `fx` (optional) adds the background, shake, greying and effects.
export function drawBoard(canvas, state, fx) {
  const { ctx, w, h } = fitCanvas(canvas);
  const cell = Math.min(w / COLS, h / ROWS);
  if (fx) drawBackground(ctx, w, h, fx.bg);
  const [dx, dy] = fx ? shakeOffset(fx.shake) : [0, 0];
  ctx.save();
  ctx.translate(dx * cell, dy * cell);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(0, 0, w, HIDDEN_ROWS * cell);
  grid(ctx, cell, w, h);
  const at = (x, y) => [x * cell, y * cell];
  const grey = fx ? greyed(fx) * ROWS : 0;
  state.board.forEach((row, y) => {
    row.forEach((type, x) => {
      if (type) block(ctx, ...at(x, y), cell, y < grey ? GREY : COLORS[type], 1, y < grey ? 0 : 0.45);
    });
  });
  if (fx) drawGlows(ctx, fx, cell);
  if (fx) drawEffects(ctx, fx, cell, w, h);
  // The piece goes last, so no effect ever hides it.
  const piece = state.current;
  if (piece && !state.over) {
    const color = COLORS[piece.type];
    for (const [x, y] of pieceCells({ ...piece, y: ghostY(state) })) glowOutline(ctx, ...at(x, y), cell, color);
    for (const [x, y] of pieceCells(piece)) block(ctx, ...at(x, y), cell, color);
  }
  ctx.restore();
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
