export const LINE_POINTS = [0, 100, 300, 500, 800];

// `combo` is the guideline counter: 0 on the first clear, +1 per consecutive clear.
export function clearPoints({ count, level, backToBack, combo }) {
  const base = LINE_POINTS[count] * level * (backToBack ? 1.5 : 1);
  return base + (combo > 0 ? 50 * combo * level : 0);
}

export function levelFor(lines) {
  return 1 + Math.floor(lines / 10);
}

// Milliseconds per row: the guideline curve (0.8 - (level-1)*0.007)^(level-1) s.
export function gravityInterval(level) {
  return Math.pow(0.8 - (level - 1) * 0.007, level - 1) * 1000;
}
