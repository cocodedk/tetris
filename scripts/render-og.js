// Renders og.png (1200×630), the social image, in the game's neon look.
// Run: node scripts/render-og.js
import { writeFileSync } from 'node:fs';
import { raster, rect, blur, addInto, encodePng, hex, mix } from './og/raster.js';

const W = 1200, H = 630, CELL = 40;
const WHITE = [1, 1, 1];
const C = {
  I: hex('#35e0ff'), O: hex('#ffd83d'), T: hex('#b45cff'), S: hex('#4dff7a'),
  Z: hex('#ff4d6d'), J: hex('#4d7bff'), L: hex('#ff9a3d'),
};
const SHAPES = {
  I: [[0, 0], [0, 1], [0, 2], [0, 3]], O: [[0, 0], [1, 0], [0, 1], [1, 1]],
  T: [[0, 0], [1, 0], [2, 0], [1, 1]], S: [[1, 0], [2, 0], [0, 1], [1, 1]],
  Z: [[0, 0], [1, 0], [1, 1], [2, 1]], L: [[0, 0], [0, 1], [0, 2], [1, 2]],
  J: [[1, 0], [1, 1], [1, 2], [0, 2]],
};
const FONT = {
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
};

const img = raster(W, H);
const glow = raster(W, H);

// One neon block: bright rim, saturated core, a highlight, and light for the glow layer.
function block(x, y, s, rgb, alpha = 1, shine = 1) {
  const rim = Math.max(2, Math.round(s * 0.1));
  rect(img, x + 1, y + 1, s - 2, s - 2, mix(rgb, WHITE, 0.55), alpha);
  rect(img, x + 1 + rim, y + 1 + rim, s - 2 - 2 * rim, s - 2 - 2 * rim, mix(rgb, [0, 0, 0], 0.15), alpha);
  rect(img, x + 1 + rim, y + 1 + rim, s - 2 - 2 * rim, rim, mix(rgb, WHITE, 0.35), alpha);
  rect(glow, x, y, s, s, rgb, alpha * shine, true);
}

function piece(name, x, y, trail = 0) {
  for (let t = trail; t >= 0; t--) {
    const alpha = t === 0 ? 1 : 0.28 / t;
    for (const [cx, cy] of SHAPES[name]) block(x + cx * CELL, y + cy * CELL - t * 26, CELL, C[name], alpha, alpha);
  }
}

function background() {
  const top = hex('#05061a'), bottom = hex('#171b3d');
  for (let j = 0; j < H; j++) rect(img, 0, j, W, 1, mix(top, bottom, j / H));
  for (let x = 0; x < W; x += CELL) rect(img, x, 0, 1, H, [0.35, 0.4, 0.9], 0.07, true);
  for (let y = H % CELL; y < H; y += CELL) rect(img, 0, y, W, 1, [0.35, 0.4, 0.9], 0.07, true);
  rect(glow, 0, H - 150, W, 150, hex('#3a2a8a'), 0.35, true);
}

function stack() {
  const names = 'IOTSZJL';
  const heights = [2, 3, 3, 2, 1, 2, 3, 3, 3, 2, 2, 1, 1, 2, 3, 3, 2, 2, 3, 3, 3, 2, 1, 1, 2, 2, 3, 3, 2, 3];
  const rows = Math.ceil(W / CELL);
  for (let i = 0; i < rows; i++) {
    for (let r = 0; r < heights[i]; r++) {
      if (r === 1) continue; // row 1 is the line being cleared, drawn below
      const y = H - (r + 1) * CELL;
      block(i * CELL, y, CELL, C[names[(i * 3 + r * 5) % 7]], 0.9, 0.55);
    }
  }
  // The full line flashing white as it clears.
  for (let i = 0; i < rows; i++) block(i * CELL, H - 2 * CELL, CELL, mix(C.I, WHITE, 0.45), 1, 0.8);
  rect(glow, 0, H - 2 * CELL - 6, W, CELL + 12, WHITE, 0.2, true);
}

function title() {
  const word = 'TETRIS', px = 19, gap = 24;
  const letterW = 5 * px, total = word.length * letterW + (word.length - 1) * gap;
  const x0 = Math.round((W - total) / 2), y0 = 150;
  const colors = [C.Z, C.L, C.O, C.S, C.I, C.T];
  [...word].forEach((ch, n) => {
    FONT[ch].forEach((row, j) => {
      [...row].forEach((bit, i) => {
        if (bit === '1') block(x0 + n * (letterW + gap) + i * px, y0 + j * px, px, colors[n], 1, 1.2);
      });
    });
  });
  // An underline beam under the title.
  rect(img, x0, y0 + 7 * px + 22, total, 4, mix(C.I, WHITE, 0.6));
  rect(glow, x0, y0 + 7 * px + 18, total, 12, C.I, 0.9, true);
}

background();
piece('T', 70, 90, 3);
piece('I', 1090, 40, 3);
piece('S', 110, 330, 2);
piece('L', 980, 290, 2);
piece('Z', 360, 400, 2);
piece('O', 720, 370, 2);
piece('J', 430, 10, 2);
piece('O', 900, 60, 2);
stack();
title();

blur(glow, 16);
addInto(img, glow, 0.85);

const out = new URL('../og.png', import.meta.url);
writeFileSync(out, encodePng(img));
console.log(`wrote ${out.pathname} (${W}×${H})`);
