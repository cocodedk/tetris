# 02 — Play in the browser

Make the rules from `src/core/` playable: a page, a canvas, input, screens, and two languages.
Build on the existing core; change it only to fix a real defect, with a test.

## What it must do

- **Pages:** `index.html` (English, `lang="en"`) and `fa/index.html` (Persian, `lang="fa"`,
  `dir="rtl"`). Both load `src/main.js` as a module and one shared stylesheet. The Persian page
  uses the Vazirmatn font from Google Fonts; nothing else loads from the network.
- **Layout:** the board in the centre; hold on one side; the next-5 preview, score, level and
  lines on the other. It fits a phone in portrait (360 px wide) and a desktop, with no page scroll
  while playing. The canvas is sharp on high-density screens (device pixel ratio).
- **Drawing:** a `requestAnimationFrame` loop calls the core's `step(state, dt)` and draws the
  board, the current piece, its ghost, hold and the preview. Keep drawing code in `src/ui/`.
- **Keyboard:** ← → move, ↓ soft drop, Space hard drop, ↑ or X rotate clockwise, Z or Ctrl
  rotate counter-clockwise, C or Shift hold, P or Esc pause. Held left/right repeats after a
  170 ms delay (DAS) at 50 ms per step (ARR).
- **Touch:** tap rotates, horizontal drag moves one cell per cell-width dragged, a quick downward
  flick hard-drops, a slow downward drag soft-drops, and a hold button and a pause button are on
  screen.
- **Screens:** a start screen (title, controls, a start button), pause (the board hidden while
  paused), and game over (final score, best score, play again). The game pauses by itself when the
  tab loses focus.
- **Best score:** kept in `localStorage` (read and write inside try/catch).
- **Languages:** every piece of UI text comes from one table in `src/ui/i18n.js` with `en` and
  `fa` entries; the Persian page shows Persian digits (۰–۹) for score, level and lines. Each page
  links to the other (English → `fa/`, Persian → `../`).

## Done when

Tests cover, without a browser: the key map (each key to its action), DAS and ARR timing as a
pure function of held time, the touch gesture classifier (tap, drag, flick, slow drag) from a list
of pointer points, Persian digit formatting, that every i18n key exists in both languages, and
that both HTML pages load `src/main.js` and link to each other.
