import { PIECES } from './pieces.js';
import { nextRandom } from './random.js';

// One 7-bag, Fisher-Yates shuffled. `random(seed)` returns [value, nextSeed].
export function shuffledBag(seed, random = nextRandom) {
  const pieces = [...PIECES];
  let s = seed;
  for (let i = pieces.length - 1; i > 0; i--) {
    const [value, next] = random(s);
    s = next;
    const j = Math.floor(value * (i + 1));
    [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
  }
  return { pieces, seed: s };
}

// Appends whole bags until the queue holds at least `min` pieces.
export function fillQueue(queue, seed, min, random = nextRandom) {
  let out = queue;
  let s = seed;
  while (out.length < min) {
    const bag = shuffledBag(s, random);
    out = [...out, ...bag.pieces];
    s = bag.seed;
  }
  return { queue: out, seed: s };
}
