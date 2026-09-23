// Browser entry point: the game loop, input and screens.
import {
  newGame, nextPieces, step,
  moveLeft, moveRight, softDrop, hardDrop, rotateCW, rotateCCW, hold,
} from './core/index.js';
import { drawBoard, drawPieces } from './ui/draw.js';
import { createKeyboard } from './ui/input.js';
import { createTouch } from './ui/touch.js';
import { createScreens } from './ui/screens.js';
import { readBest, saveBest, readEffects, saveEffects } from './ui/storage.js';
import { createFx, fxEvents, stepFx, gameOverDone } from './fx/effects.js';
import { reducedMotion } from './fx/motion.js';
import { initWebMcp } from './ui/webmcp.js';

const MAX_DT = 50;
const ACTIONS = {
  left: moveLeft, right: moveRight, softDrop, hardDrop, rotateCW, rotateCCW, hold,
};

const $ = (id) => document.getElementById(id);
const screens = createScreens(document);
const canvases = { board: $('board'), hold: $('hold'), next: $('next') };
const motionQuery = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)');
const isReduced = () => reducedMotion(motionQuery?.matches, readEffects());
const newFx = () => createFx({ seed: Date.now(), reduced: isReduced(), level: state.level });

let state = newGame(Date.now());
let fx = newFx();
let mode = 'start'; // 'start' | 'playing' | 'paused' | 'over'
let overShown = false;
let last = 0;

function start({ seed = Date.now(), turnBased = false } = {}) {
  state = newGame(seed, { turnBased });
  fx = newFx();
  mode = 'playing';
  overShown = false;
  screens.show(null);
}

// The start screen's toggle: flips the effects mode and remembers the choice.
function toggleEffects(e) {
  e.currentTarget.blur();
  saveEffects(isReduced() ? 'full' : 'reduced');
  fx = newFx();
  screens.effects(fx.reduced);
}

function setPaused(paused) {
  if (paused ? mode !== 'playing' : mode !== 'paused') return;
  mode = paused ? 'paused' : 'playing';
  keyboard.release();
  screens.show(paused ? 'pause' : null);
}

// The stack greys out first; the game-over screen appears when that is done.
function endGame() {
  mode = 'over';
  keyboard.release();
  screens.gameOver(state.score, saveBest(state.score));
}

const accepts = (action) =>
  mode === 'playing' || (action === 'pause' && mode === 'paused');

function perform(action) {
  if (action === 'pause') return setPaused(mode === 'playing');
  if (mode !== 'playing') return;
  state = ACTIONS[action](state);
  fxEvents(fx, state.events);
  if (state.over) endGame();
}

const keyboard = createKeyboard(window, { accepts, onAction: perform });
createTouch($('board').parentElement, { accepts, onAction: perform });

function pad(id, action) {
  $(id).addEventListener('click', (e) => {
    e.currentTarget.blur(); // keep Space for hard drop, not for this button
    if (accepts(action)) perform(action);
  });
}
pad('hold-btn', 'hold');
pad('pause-btn', 'pause');
$('start-btn').addEventListener('click', () => start());
$('again-btn').addEventListener('click', () => start());
$('resume-btn').addEventListener('click', () => setPaused(false));
$('fx-btn').addEventListener('click', toggleEffects);

// Pause by itself when the tab loses focus.
document.addEventListener('visibilitychange', () => { if (document.hidden) setPaused(true); });
window.addEventListener('blur', () => setPaused(true));

function draw() {
  screens.stats(state);
  if (mode === 'paused') return;
  drawBoard(canvases.board, state, fx);
  drawPieces(canvases.hold, [state.hold], { slots: 1, alpha: state.canHold ? 1 : 0.4 });
  drawPieces(canvases.next, nextPieces(state), { slots: 5 });
}

function frame(now) {
  const dt = last ? Math.min(now - last, MAX_DT) : 0;
  last = now;
  if (mode === 'playing') {
    keyboard.update(dt);
    if (mode === 'playing') {
      state = step(state, dt);
      fxEvents(fx, state.events);
    }
    if (mode === 'playing' && state.over) endGame();
  }
  if (mode !== 'paused') stepFx(fx, dt);
  if (mode === 'over' && !overShown && gameOverDone(fx)) {
    overShown = true;
    screens.show('over');
  }
  draw();
  requestAnimationFrame(frame);
}

screens.effects(fx.reduced);
screens.gameOver(0, readBest());
screens.show('start');
requestAnimationFrame(frame);

// Tools for an AI agent in this browser; does nothing without WebMCP.
initWebMcp(document, {
  read: () => ({ state, mode }),
  perform,
  start,
  resume: () => setPaused(false),
});
