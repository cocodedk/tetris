# 01 — Game rules

Build the game's rules as pure JavaScript modules under `src/core/`, with `node:test` suites under
`test/core/`. No DOM, no canvas, no timers: the UI (a later feature) drives this code.
The state is plain data, including the random generator's state (for example a number), so the
same state and the same action always give the same result.

## What it must do

- **Board:** 10 columns × 20 visible rows, plus 2 hidden rows above for spawning.
- **Pieces:** I, O, T, S, Z, J, L with the standard guideline shapes, spawn positions and
  orientations (0, R, 2, L).
- **Rotation:** Super Rotation System, clockwise and counter-clockwise, with the standard wall-kick
  tables (one for J, L, S, T, Z; one for I; O does not kick).
- **Randomizer:** a 7-bag, shuffled with a seeded random function passed in, so a seed replays
  exactly the same sequence.
- **Queue and hold:** a preview of the next 5 pieces; hold swaps the current piece with the held
  one (or takes the next), at most once until the piece locks.
- **Movement:** left, right, soft drop (1 point per cell), hard drop (2 points per cell), and the
  ghost piece's landing row.
- **Gravity and lock:** a step function `step(state, dt)` advances time in milliseconds. Gravity
  per level follows the guideline curve `(0.8 - (level-1)*0.007)^(level-1)` seconds per row. A
  grounded piece locks after 500 ms; a move or rotation resets that delay, at most 15 times.
  The count of resets starts again whenever the piece reaches a row lower than any it has reached
  (the guideline's extended placement). Once 15 are spent, the piece locks as soon as it is grounded.
- **Line clears:** full rows clear and the rows above fall. Score single 100, double 300,
  triple 500, Tetris 800, each × level. A back-to-back Tetris scores ×1.5. A combo adds
  50 × combo × level.
- **Levels:** start at 1, one level per 10 cleared lines.
- **Game over:** when a new piece cannot spawn (block out) or a piece locks entirely above the
  visible rows (lock out).
- **Events:** each state change reports what happened in an `events` list (for example
  `{type: "lock"}`, `{type: "clear", rows: [..], count, tetris, backToBack, combo}`,
  `{type: "hardDrop", cells, from, to}`, `{type: "levelUp", level}`, `{type: "hold"}`,
  `{type: "gameOver"}`), so later features can react with effects without reading internals.
  Those events are the required ones; gravity moving a piece down one row needs no event.

## Done when

Tests cover each rule above, including at least: each piece's spawn, every wall-kick case of the
I piece and one per other kick table, the O piece never kicking, the bag containing each piece
once per 7, the same seed giving the same 14 pieces, hold's once-per-piece limit, lock delay and
its 15-reset cap, all four clear scores, back-to-back and combo scores, the level-up at 10 lines,
both game-over conditions, and the events each action reports.
