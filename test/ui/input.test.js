import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createKeyboard } from '../../src/ui/input.js';
import { createTouch } from '../../src/ui/touch.js';

function fire(target, type, props) {
  const e = new Event(type, { cancelable: true });
  for (const [k, v] of Object.entries(props)) Object.defineProperty(e, k, { value: v });
  target.dispatchEvent(e);
  return e;
}

function keyboard(accepts = () => true) {
  const target = new EventTarget();
  const actions = [];
  const kb = createKeyboard(target, { accepts, onAction: (a) => actions.push(a) });
  const down = (code, repeat = false) => fire(target, 'keydown', { code, repeat });
  const up = (code) => fire(target, 'keyup', { code });
  return { kb, actions, down, up };
}

const count = (list, action) => list.filter((a) => a === action).length;

test('a held left moves on press, at 170 ms, then every 50 ms, across any frames', () => {
  const { kb, actions, down } = keyboard();
  assert.equal(down('ArrowLeft').defaultPrevented, true);
  assert.equal(count(actions, 'left'), 1);
  for (let i = 0; i < 10; i++) kb.update(17); // 170 ms
  assert.equal(count(actions, 'left'), 2);
  kb.update(50);
  kb.update(50);
  assert.equal(count(actions, 'left'), 4);
});

test("the browser's own key repeat is ignored", () => {
  const { actions, down } = keyboard();
  down('ArrowRight');
  down('ArrowRight', true);
  down('ArrowRight', true);
  assert.deepEqual(actions, ['right']);
});

test('releasing the key or pressing the other way stops the repeat', () => {
  const { kb, actions, down, up } = keyboard();
  down('ArrowLeft');
  down('ArrowRight');
  kb.update(300);
  assert.equal(count(actions, 'left'), 1);
  up('ArrowRight');
  kb.update(300);
  assert.deepEqual(actions, ['left', 'right', 'right', 'right', 'right']); // 4 moves in 300 ms
});

test('release() stops every held key (on pause and game over)', () => {
  const { kb, actions, down } = keyboard();
  down('ArrowDown');
  kb.release();
  kb.update(500);
  assert.deepEqual(actions, ['softDrop']);
});

test('keys the game does not accept now do nothing and keep their default', () => {
  const { actions, down } = keyboard((a) => a === 'pause');
  assert.equal(down('Space').defaultPrevented, false);
  assert.equal(down('KeyP').defaultPrevented, true);
  assert.deepEqual(actions, ['pause']);
});

function touch() {
  const surface = new EventTarget();
  surface.getBoundingClientRect = () => ({ width: 300 }); // 30 px cells
  const actions = [];
  createTouch(surface, { accepts: () => true, onAction: (a) => actions.push(a) });
  const at = (type, x, y, t) => fire(surface, type, { clientX: x, clientY: y, timeStamp: t, pointerId: 1 });
  return { actions, at };
}

test('a live drag moves once per cell and nothing more on release', () => {
  const { actions, at } = touch();
  at('pointerdown', 100, 100, 0);
  at('pointermove', 135, 101, 50);
  assert.deepEqual(actions, ['right']);
  at('pointermove', 175, 102, 100);
  at('pointerup', 175, 102, 120);
  assert.deepEqual(actions, ['right', 'right']);
});

test('dragging two cells right and back returns the piece and does not rotate it', () => {
  const { actions, at } = touch();
  at('pointerdown', 100, 100, 0);
  at('pointermove', 165, 100, 60);
  at('pointermove', 100, 100, 120);
  at('pointerup', 100, 100, 140);
  assert.deepEqual(actions, ['right', 'right', 'left', 'left']);
});

test('a tap rotates and a flick hard-drops', () => {
  const { actions, at } = touch();
  at('pointerdown', 100, 100, 0);
  at('pointerup', 101, 101, 80);
  at('pointerdown', 100, 100, 1000);
  at('pointermove', 100, 160, 1030);
  at('pointerup', 100, 220, 1060);
  assert.deepEqual(actions, ['rotateCW', 'hardDrop']);
});
