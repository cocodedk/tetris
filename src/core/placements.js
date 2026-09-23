import { COLS, ROWS, HIDDEN_ROWS } from './board.js';
import { moveLeft, moveRight, hardDrop, rotateCW, rotateCCW, hold } from './actions.js';

const ACTIONS = { moveLeft, moveRight, hardDrop, rotateCW, rotateCCW, hold };
// Quarter turns clockwise, by the player's own keys: 1 = CW, 2 = CW twice, 3 = CCW.
const TURNS = [[], ['rotateCW'], ['rotateCW', 'rotateCW'], ['rotateCCW']];

// Plays a list of action names, collecting every event they cause.
export function playActions(state, actions) {
  let s = state;
  const events = [];
  for (const name of actions) {
    s = ACTIONS[name](s);
    events.push(...s.events);
  }
  return { state: { ...s, events }, events };
}

function columnHeights(board) {
  return Array.from({ length: COLS }, (_, x) => {
    const top = board.findIndex((row, y) => y >= HIDDEN_ROWS && row[x] !== null);
    return top < 0 ? 0 : ROWS - top;
  });
}

// Empty cells with a filled cell somewhere above them in the same column.
function countHoles(board) {
  let holes = 0;
  for (let x = 0; x < COLS; x++) {
    let covered = false;
    for (let y = 0; y < ROWS; y++) {
      if (board[y][x] !== null) covered = true;
      else if (covered) holes++;
    }
  }
  return holes;
}

export function boardStats(board) {
  const heights = columnHeights(board);
  const bumpiness = heights.slice(1).reduce((sum, h, i) => sum + Math.abs(h - heights[i]), 0);
  return { holes: countHoles(board), height: Math.max(...heights), bumpiness };
}

// Every x the rotated piece reaches by sliding, with the slides that reach it.
function slides(state) {
  const out = [{ state, moves: [] }];
  for (const name of ['moveLeft', 'moveRight']) {
    let s = state;
    const moves = [];
    for (;;) {
      const next = ACTIONS[name](s);
      if (next.current.x === s.current.x) break;
      s = next;
      moves.push(name);
      out.push({ state: s, moves: [...moves] });
    }
  }
  return out;
}

function branch(state, useHold, prefix) {
  const found = new Map();
  for (let r = 0; r < 4; r++) {
    // The piece may already be turned: rotate from where it is to rotation r.
    const turns = TURNS[(r - state.current.rotation + 4) % 4];
    const turned = playActions(state, turns).state;
    if (turned.over || turned.current.rotation !== r) continue;
    for (const { state: slid, moves } of slides(turned)) {
      const dropped = hardDrop(slid);
      const landed = dropped.events.find((e) => e.type === 'hardDrop').cells;
      const landedKey = landed.map(([x, y]) => `${x},${y}`).sort().join(' ');
      if (found.has(landedKey)) continue;
      const column = Math.min(...landed.map(([x]) => x));
      const clear = dropped.events.find((e) => e.type === 'clear');
      found.set(landedKey, {
        id: `${prefix}r${r}c${column}`,
        piece: slid.current.type,
        rotation: r,
        column,
        useHold,
        linesCleared: clear ? clear.count : 0,
        ...boardStats(dropped.board),
        actions: [...(useHold ? ['hold'] : []), ...turns, ...moves, 'hardDrop'],
      });
    }
  }
  return [...found.values()];
}

// Every rotate-then-slide-then-drop placement of the current piece and, when
// hold is allowed, of the piece hold would bring. `actions` replays one.
export function listPlacements(state) {
  if (state.over || !state.current) return [];
  const out = branch(state, false, '-');
  if (state.canHold) {
    const held = hold(state);
    if (!held.over && held.current) out.push(...branch(held, true, 'H'));
  }
  return out;
}
