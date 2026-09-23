# 05 — WebMCP: let an AI agent play

Register a few typed tools with WebMCP so an AI agent in the visitor's browser can play the game
through the same code a player's keys use. The owner wants a fast decision model to play it by
picking one placement per piece, so the tools offer every placement as a ready-made choice.

## The API (a draft; this is its current shape)

`document.modelContext.registerTool({ name, title, description, inputSchema, execute, annotations })`
returns a Promise and rejects on a duplicate name. `execute(input, { signal })` receives input the
browser has NOT validated against `inputSchema`: check every field yourself and answer
`{ ok: false, error, ... }` rather than throwing (a throw reaches the agent as an opaque error).
Annotations: `readOnlyHint` for tools that change nothing. There is no `navigator.modelContext`
and no `provideContext`; do not use or polyfill them.

## The tools (four)

1. `get_game` (read-only): the status (start, playing, paused, over), the board as 20 strings of
   10 characters (`.` empty, a piece letter otherwise), the current piece and its position, hold,
   the next five, score, level and lines.
2. `list_placements` (read-only): every place the current piece reaches by rotating first, then
   moving sideways, then dropping straight down (no tucks or spins), and, when hold is allowed,
   the same for the piece hold would bring. Rotations that give the same cells count once, as the
   lowest rotation number. Each has an `id` built from the placement itself
   (`<H or ->r<rotation>c<column>`, for example `-r1c4`), `piece`, `rotation`, `column`,
   `useHold`, and what it would do: `linesCleared`, `holes`, `height` (of the stack after it),
   `bumpiness`.
3. `place` (`{ id }`): puts the current piece there by the player's own actions (hold if needed,
   rotate, move, hard drop) and returns the new `get_game` result plus the events it caused. An
   id not in the current list answers `ok: false` with the valid ids.
4. `new_game` (`{ seed?, turnBased? }`): starts a game. With `turnBased: true`, gravity and lock
   delay stop between placements, so a slow agent loses nothing to time; effects still play.

## Rules

- The placement search and its numbers live in `src/core/` (pure, tested); the tool module is
  `src/ui/webmcp.js`, started once by `src/main.js`.
- Input checks, exactly these: `get_game` and `list_placements` ignore their input. `place` needs
  `id` to be a string. `new_game` accepts only the keys `seed` (an integer) and `turnBased` (true or
  false), each optional. Anything else answers `ok: false` with what was expected. (The browser
  itself refuses input that is not a JSON object before it reaches a tool.)
- Without `document.modelContext` the module does nothing and shows nothing. One tool that fails to
  register does not stop the others. Nothing it does can throw into the page.
- Add a "Play with an AI agent" section to the README naming the four tools and `turnBased`.

## Done when

Tests cover, without a browser: the placements for an empty board (the I piece has 17 distinct
ones: 7 flat, 10 upright), a placement's `linesCleared` and `holes` on a prepared board, hold
placements appearing only when hold is allowed, `place` landing the piece where its placement said
and reporting the same events a hard drop does, an id not in the list, a non-string id, and
`new_game` with an unknown key or a wrongly typed `seed` or `turnBased` each answering `ok: false`, `turnBased` keeping the piece still across `step` calls, the module doing
nothing without `document.modelContext`, and one refused registration leaving the other three
registered (with a fake `document.modelContext`).
