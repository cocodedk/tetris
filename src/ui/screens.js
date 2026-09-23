// Screens and text: fills UI text from the i18n table and shows one screen at a time.
import { strings, formatNumber } from './i18n.js';

export function createScreens(doc) {
  const lang = doc.documentElement.lang === 'fa' ? 'fa' : 'en';
  const text = strings(lang);
  const $ = (id) => doc.getElementById(id);
  const num = (n) => formatNumber(n, lang);

  for (const el of doc.querySelectorAll('[data-i18n]')) el.textContent = text[el.dataset.i18n];
  doc.title = text.title;

  const overlay = $('overlay');
  const screens = { start: $('screen-start'), pause: $('screen-pause'), over: $('screen-over') };
  const board = $('board');
  let shown = { score: null, level: null, lines: null };

  return {
    // name: 'start' | 'pause' | 'over', or null while playing.
    show(name) {
      overlay.hidden = !name;
      for (const [key, el] of Object.entries(screens)) el.hidden = key !== name;
      board.style.visibility = name === 'pause' ? 'hidden' : '';
      screens[name]?.querySelector('button')?.focus();
      overlay.classList.toggle('fade-in', name === 'over');
    },
    effects(reduced) {
      $('fx-btn').textContent = reduced ? text.effectsReduced : text.effectsFull;
      $('fx-btn').setAttribute('aria-pressed', String(reduced));
    },
    gameOver(score, best) {
      $('final-score').textContent = num(score);
      $('best-score').textContent = num(best);
    },
    stats(state) {
      for (const key of ['score', 'level', 'lines']) {
        if (shown[key] === state[key]) continue;
        $(key).textContent = num(state[key]);
      }
      shown = { score: state.score, level: state.level, lines: state.lines };
    },
  };
}
