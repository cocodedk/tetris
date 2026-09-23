// WebMCP tools: an AI agent in the visitor's browser plays through the same
// actions the keys use. `game` is main.js's adapter:
// { read() -> { state, mode }, perform(action), start({ seed, turnBased }), resume() }.
import { HIDDEN_ROWS, pieceCells, nextPieces, listPlacements } from '../core/index.js';

// Core action names to the names main.js's `perform` takes.
const KEYS = { moveLeft: 'left', moveRight: 'right' };
const NO_INPUT = { type: 'object', properties: {} };

const given = (input) =>
  (input && typeof input === 'object' && !Array.isArray(input) ? input : null);
const refuse = (error, extra = {}) => ({ ok: false, error, ...extra });

export function gameView({ state, mode }) {
  const { current } = state;
  return {
    ok: true,
    status: mode,
    board: state.board.slice(HIDDEN_ROWS).map((row) => row.map((c) => c ?? '.').join('')),
    current: current && !state.over ? {
      piece: current.type,
      rotation: current.rotation,
      cells: pieceCells(current).map(([x, y]) => [x, y - HIDDEN_ROWS]),
    } : null,
    hold: state.hold,
    canHold: state.canHold,
    next: nextPieces(state),
    score: state.score,
    level: state.level,
    lines: state.lines,
    turnBased: Boolean(state.turnBased),
  };
}

const publicPlacement = ({ actions, ...p }) => p;

function placements(game) {
  const view = game.read();
  const inPlay = view.mode === 'playing' || view.mode === 'paused';
  const list = inPlay ? listPlacements(view.state) : [];
  return { ok: true, status: view.mode, placements: list.map(publicPlacement) };
}

function place(game, input) {
  const id = given(input)?.id;
  if (typeof id !== 'string') return refuse('Expected { id: string }, an id from list_placements.');
  if (game.read().mode === 'paused') game.resume();
  const { state, mode } = game.read();
  if (mode !== 'playing') return refuse(`No game in play (status: ${mode}). Call new_game.`, { status: mode });
  const list = listPlacements(state);
  const chosen = list.find((p) => p.id === id);
  if (!chosen) return refuse(`Unknown placement id "${id}".`, { validIds: list.map((p) => p.id) });
  const events = [];
  for (const action of chosen.actions) {
    game.perform(KEYS[action] ?? action);
    events.push(...game.read().state.events);
  }
  return { ...gameView(game.read()), placed: publicPlacement(chosen), events };
}

function newGameTool(game, input) {
  const args = given(input);
  const expected = 'Expected { seed?: integer, turnBased?: true or false } and no other keys.';
  if (!args) return refuse(expected);
  const extra = Object.keys(args).filter((k) => k !== 'seed' && k !== 'turnBased');
  if (extra.length) return refuse(`${expected} Unknown: ${extra.join(', ')}.`);
  const { seed, turnBased } = args;
  if (seed !== undefined && !Number.isInteger(seed)) return refuse(`${expected} seed must be an integer.`);
  if (turnBased !== undefined && typeof turnBased !== 'boolean') {
    return refuse(`${expected} turnBased must be true or false.`);
  }
  game.start({ seed: seed ?? Date.now(), turnBased: turnBased ?? false });
  return gameView(game.read());
}

export function createTools(game) {
  const tool = (name, title, description, inputSchema, run, readOnly = false) => ({
    name, title, description, inputSchema,
    annotations: { readOnlyHint: readOnly },
    execute: async (input) => {
      try { return run(input); } catch (e) { return refuse(String(e?.message ?? e)); }
    },
  });
  return [
    tool('get_game', 'Get the game',
      'The Tetris game now: status (start, playing, paused, over); board as 20 strings of 10 '
      + 'characters, top row first ("." empty, else a piece letter; the falling piece is not in it); '
      + 'current piece with its cells as [column, row] (row 0 = top, negative = above the board); '
      + 'hold, canHold, the next five pieces, score, level, lines and turnBased.',
      NO_INPUT, () => gameView(game.read()), true),
    tool('list_placements', 'List placements',
      'Every place the current piece can go by rotating, sliding, then dropping straight down, and '
      + 'when canHold, the same for the piece hold would bring (useHold: true). Each has an id for '
      + 'place, piece, rotation, column (leftmost cell), and the result: linesCleared, holes, '
      + 'height of the stack and bumpiness. Empty before a game starts and after it ends; '
      + 'while paused it lists as usual and place resumes.',
      NO_INPUT, () => placements(game), true),
    tool('place', 'Place the piece',
      'Puts the current piece at a placement from list_placements by pressing the player\'s own '
      + 'keys (hold, rotate, move, hard drop). Resumes a paused game first. Returns the game as '
      + 'get_game does, the placement and the events it caused (lock, clear, levelUp, gameOver).',
      { type: 'object', properties: { id: { type: 'string', description: 'e.g. -r1c4 or Hr0c2' } },
        required: ['id'] },
      (input) => place(game, input)),
    tool('new_game', 'Start a new game',
      'Starts a new game, ending any game in play. seed (integer) repeats a piece sequence. '
      + 'turnBased: true stops gravity and the lock delay, so the piece waits for place. '
      + 'Returns the game as get_game does.',
      { type: 'object', properties: { seed: { type: 'integer' }, turnBased: { type: 'boolean' } } },
      (input) => newGameTool(game, input)),
  ];
}

// Registers the tools when the browser offers WebMCP. Never rejects; resolves
// to the names that registered (none without document.modelContext).
export async function initWebMcp(doc, game) {
  try {
    const context = doc?.modelContext;
    if (!context || typeof context.registerTool !== 'function') return [];
    const results = await Promise.all(createTools(game).map(async (tool) => {
      try {
        await context.registerTool(tool);
        return tool.name;
      } catch {
        return null;
      }
    }));
    return results.filter(Boolean);
  } catch {
    return [];
  }
}
