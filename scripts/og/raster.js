// A tiny RGB raster and PNG encoder on Node's standard library only.
import { deflateSync, crc32 } from 'node:zlib';

export const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
export const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

export function raster(w, h) {
  return { w, h, px: new Float32Array(w * h * 3) };
}

// Blend a colour over a rectangle; `add` makes it additive (light) instead of opaque.
export function rect(img, x, y, rw, rh, rgb, alpha = 1, add = false) {
  const x0 = Math.max(0, Math.round(x)), x1 = Math.min(img.w, Math.round(x + rw));
  const y0 = Math.max(0, Math.round(y)), y1 = Math.min(img.h, Math.round(y + rh));
  for (let j = y0; j < y1; j++) {
    for (let i = x0; i < x1; i++) {
      const k = (j * img.w + i) * 3;
      for (let c = 0; c < 3; c++) {
        img.px[k + c] = add ? img.px[k + c] + rgb[c] * alpha : img.px[k + c] + (rgb[c] - img.px[k + c]) * alpha;
      }
    }
  }
}

// Separable box blur, run three times: close enough to a Gaussian for a glow.
export function blur(img, radius) {
  const tmp = new Float32Array(img.px.length);
  const pass = (src, dst, along, across, step, stride) => {
    for (let a = 0; a < across; a++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        const at = (n) => a * stride + Math.min(along - 1, Math.max(0, n)) * step + c;
        for (let n = -radius; n <= radius; n++) sum += src[at(n)];
        for (let n = 0; n < along; n++) {
          dst[a * stride + n * step + c] = sum / (2 * radius + 1);
          sum += src[at(n + radius + 1)] - src[at(n - radius)];
        }
      }
    }
  };
  for (let i = 0; i < 3; i++) {
    pass(img.px, tmp, img.w, img.h, 3, img.w * 3);
    pass(tmp, img.px, img.h, img.w, img.w * 3, 3);
  }
}

export function addInto(dst, src, gain) {
  for (let k = 0; k < dst.px.length; k++) dst.px[k] += src.px[k] * gain;
}

function chunk(type, data) {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(data.length, 0);
  head.write(type, 4, 'latin1');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), data])) >>> 0, 0);
  return Buffer.concat([head, data, crc]);
}

export function encodePng(img) {
  const rows = Buffer.alloc((img.w * 3 + 1) * img.h);
  for (let j = 0; j < img.h; j++) {
    const row = j * (img.w * 3 + 1);
    for (let k = 0; k < img.w * 3; k++) {
      const v = img.px[j * img.w * 3 + k];
      rows[row + 1 + k] = Math.round(255 * Math.min(1, Math.max(0, v)));
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(img.w, 0);
  ihdr.writeUInt32BE(img.h, 4);
  ihdr.set([8, 2, 0, 0, 0], 8); // 8-bit RGB, no interlace
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(rows, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}
