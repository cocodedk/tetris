// Neon paint: piece colours and the glowing block every cell is drawn as.
export const COLORS = {
  I: '#35e0ff', O: '#ffd83d', T: '#b45cff', S: '#4dff7a',
  Z: '#ff4d6d', J: '#4d7bff', L: '#ff9a3d',
};
export const GREY = '#4a4f68';

// A piece letter, 'white', or undefined (white) to a CSS colour.
export const paint = (color) => COLORS[color] ?? '#ffffff';

// A saturated block with a soft outer glow and an inner highlight.
export function block(ctx, x, y, size, color, alpha = 1, glow = 0.45) {
  const pad = Math.max(1, size * 0.06);
  const s = size - 2 * pad;
  ctx.globalAlpha = alpha;
  ctx.shadowColor = color;
  ctx.shadowBlur = size * glow;
  ctx.fillStyle = color;
  ctx.fillRect(x + pad, y + pad, s, s);
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  ctx.fillRect(x + pad + s * 0.18, y + pad + s * 0.18, s * 0.64, s * 0.64);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(x + pad, y + pad, s, s * 0.16);
  ctx.globalAlpha = 1;
}

// A glowing outline, used for the ghost piece.
export function glowOutline(ctx, x, y, size, color) {
  const pad = Math.max(1, size * 0.1);
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1, size * 0.08);
  ctx.shadowColor = color;
  ctx.shadowBlur = size * 0.5;
  ctx.globalAlpha = 0.8;
  ctx.strokeRect(x + pad, y + pad, size - 2 * pad, size - 2 * pad);
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
}
