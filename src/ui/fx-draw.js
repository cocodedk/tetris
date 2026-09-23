// Draws the effect state from src/fx onto the board canvas. Units: `cell` pixels per cell.
import { COLS } from '../core/index.js';
import { fade } from '../fx/particles.js';
import { progress } from '../fx/effects.js';
import { block, paint } from './blocks.js';

const CENTER = COLS / 2;

// Night gradient in the level's hue, with a starfield.
export function drawBackground(ctx, w, h, bg) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, `hsl(${bg.hue}, 55%, 9%)`);
  g.addColorStop(1, `hsl(${(bg.hue + 40) % 360}, 65%, 4%)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  for (const s of bg.stars) {
    ctx.fillStyle = `hsla(${bg.hue}, 90%, 85%, ${0.25 + s.z * 0.5})`;
    const r = 0.6 + s.z * 1.2;
    ctx.fillRect(s.x * w, s.y * h, r, r);
  }
}

// Just-locked cells glow brighter for a moment.
export function drawGlows(ctx, fx, cell) {
  for (const g of fx.glows) {
    const a = 1 - progress(g);
    for (const [x, y] of g.cells) block(ctx, x * cell, y * cell, cell, '#ffffff', 0.55 * a, 1.2 * a);
  }
}

function drawTrails(ctx, fx, cell) {
  for (const t of fx.trails) {
    const a = 1 - progress(t);
    const color = paint(t.color);
    for (const [x, from, to] of t.cols) {
      if (to <= from) continue;
      const g = ctx.createLinearGradient(0, from * cell, 0, to * cell);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(1, color);
      ctx.globalAlpha = 0.7 * a;
      ctx.fillStyle = g;
      ctx.fillRect((x + 0.15) * cell, from * cell, cell * 0.7, (to - from) * cell);
    }
  }
  ctx.globalAlpha = 1;
}

// A cleared row flashes white while its blocks vanish from the centre outward.
function drawFlashes(ctx, fx, cell, w, h) {
  for (const f of fx.flashes) {
    const p = progress(f);
    if (f.board) {
      ctx.fillStyle = `rgba(255,255,255,${0.45 * (1 - p)})`;
      ctx.fillRect(0, 0, w, h);
      continue;
    }
    const gap = p * CENTER * 1.2;
    f.blocks.forEach((type, x) => {
      if (type && Math.abs(x + 0.5 - CENTER) > gap) block(ctx, x * cell, f.y * cell, cell, paint(type), 1 - p);
    });
    ctx.fillStyle = `rgba(255,255,255,${0.85 * (1 - p)})`;
    ctx.fillRect(0, f.y * cell, w, cell);
  }
}

function drawParticles(ctx, fx, cell) {
  for (const p of fx.particles.live) {
    ctx.globalAlpha = fade(p);
    ctx.fillStyle = paint(p.color);
    const s = p.size * cell;
    ctx.fillRect(p.x * cell - s / 2, p.y * cell - s / 2, s, s);
  }
  ctx.globalAlpha = 1;
}

// A ring of light sweeping out from the centre of the board.
function drawWaves(ctx, fx, cell, w, h) {
  for (const wave of fx.waves) {
    const p = progress(wave);
    ctx.strokeStyle = `hsla(${fx.bg.hue}, 100%, 75%, ${1 - p})`;
    ctx.lineWidth = cell * 0.5 * (1 - p) + 1;
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = cell;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, p * Math.hypot(w, h) * 0.6, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
}

// Text that scales up and fades out.
function drawTexts(ctx, fx, cell) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const t of fx.texts) {
    const p = progress(t);
    ctx.globalAlpha = p < 0.25 ? 1 : (1 - p) / 0.75;
    ctx.font = `900 ${t.size * cell * (0.7 + 0.5 * p)}px system-ui, sans-serif`;
    ctx.shadowColor = `hsl(${fx.bg.hue}, 100%, 65%)`;
    ctx.shadowBlur = cell * 0.8;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(t.text, t.x * cell, t.y * cell);
  }
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
}

// Everything drawn over the stack and the piece.
export function drawEffects(ctx, fx, cell, w, h) {
  drawTrails(ctx, fx, cell);
  drawFlashes(ctx, fx, cell, w, h);
  drawParticles(ctx, fx, cell);
  drawWaves(ctx, fx, cell, w, h);
  drawTexts(ctx, fx, cell);
}
