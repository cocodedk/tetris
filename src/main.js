// Browser entry point: the game loop, input and screens.
import {
  newGame, nextPieces, step,
  moveLeft, moveRight, softDrop, hardDrop, rotateCW, rotateCCW, hold,
} from './core/index.js';
import { drawBoard, drawPieces } from './ui/draw.js';
import { createKeyboard } from './ui/input.js';
import { createTouch } from './ui/touch.js';
import { createScreens } from './ui/screens.js';
import { readBest, saveBest } from './ui/storage.js';

const MAX_DT = 50;
const ACTIONS = {
  left: moveLeft, right: moveRight, softDrop, hardDrop, rotateCW, rotateCCW, hold,
};

const $ = (id) => document.getElementById(id);
const screens = createScreens(document);
const canvases = { board: $('board'), hold: $('hold'), next: $('next') };

let state = newGame(Date.now());
let mode = 'start'; // 'start' | 'playing' | 'paused' | 'over'
let last = 0;

function start() {
  state = newGame(Date.now());
  mode = 'playing';
  screens.show(null);
}

function setPaused(paused) {
  if (paused ? mode !== 'playing' : mode !== 'paused') return;
  mode = paused ? 'paused' : 'playing';
  keyboard.release();
  screens.show(paused ? 'pause' : null);
}

function endGame() {
  mode = 'over';
  keyboard.release();
  screens.gameOver(state.score, saveBest(state.score));
  screens.show('over');
}

const accepts = (action) =>
  mode === 'playing' || (action === 'pause' && mode === 'paused');

function perform(action) {
  if (action === 'pause') return setPaused(mode === 'playing');
  if (mode !== 'playing') return;
  state = ACTIONS[action](state);
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
$('start-btn').addEventListener('click', start);
$('again-btn').addEventListener('click', start);
$('resume-btn').addEventListener('click', () => setPaused(false));

// Pause by itself when the tab loses focus.
document.addEventListener('visibilitychange', () => { if (document.hidden) setPaused(true); });
window.addEventListener('blur', () => setPaused(true));

function draw() {
  screens.stats(state);
  if (mode === 'paused') return;
  drawBoard(canvases.board, state);
  drawPieces(canvases.hold, [state.hold], { slots: 1, alpha: state.canHold ? 1 : 0.4 });
  drawPieces(canvases.next, nextPieces(state), { slots: 5 });
}

function frame(now) {
  const dt = last ? Math.min(now - last, MAX_DT) : 0;
  last = now;
  if (mode === 'playing') {
    keyboard.update(dt);
    if (mode === 'playing') state = step(state, dt);
    if (mode === 'playing' && state.over) endGame();
  }
  draw();
  requestAnimationFrame(frame);
}

screens.gameOver(0, readBest());
screens.show('start');
requestAnimationFrame(frame);
