# 03 — Visual effects (the twist)

Give every action a striking, satisfying reaction. Effect state lives in `src/fx/` as pure code
stepped by `dt` and driven by the core's `events`; drawing it lives in `src/ui/`. Build on what
exists; the game must play exactly as before.

## The look

Neon on deep night: each piece has its own saturated colour, drawn as a glowing block (an inner
highlight, a soft outer glow). The board has a faint grid. Nothing may hide the board or the
current piece, and every effect is finished within one second.

## The effects

1. **Line-clear burst:** each cleared row flashes white, sweeps away from the centre outward, and
   bursts into particles in the colours of its blocks (at least 8 per cell), which fly, fade and
   fall with gravity.
2. **Tetris moment:** four rows at once add a bigger burst, a bright full-board flash, a strong
   shake, and a large "TETRIS" text that scales up and fades. Back-to-back adds "BACK-TO-BACK".
3. **Hard-drop trail and impact:** a fading light streak from where the piece started to where it
   landed, a short shake scaled by the distance fallen, and a small spark row where it hits.
4. **Lock pulse:** a locked piece's cells glow brighter for a moment.
5. **Combo text:** "COMBO ×n" pops up near the cleared rows from a combo of 2 and up.
6. **Level-up wave:** a ring of light sweeps across the board and the background changes hue.
7. **Living background:** a slow-moving starfield (or gradient field) behind the board whose speed
   and hue follow the level.
8. **Ghost piece:** drawn as a glowing outline, not a filled block.
9. **Game over:** the stack greys out row by row from the top, then the game-over screen fades in.

## Limits

- **Performance:** at most 600 live particles; the oldest are dropped first. Particles are reused
  from a pool rather than created per frame.
- **Reduced motion:** when `prefers-reduced-motion: reduce` is set, there is no shake, no particles
  and no moving background; flashes and text stay, shortened. A settings toggle on the start screen
  (effects: full / reduced) overrides it, remembered in `localStorage`.
- Every effect's state is deterministic given its events, `dt` and a seeded random.

## Done when

Tests cover, without a browser: each event type starting its effects; particles moving, fading
and being removed at the end of their life; the 600 cap dropping the oldest; the shake's offset
decaying to zero; the hard-drop shake growing with distance; the Tetris and back-to-back texts;
the combo text only from combo 2; the level-up changing the background hue; reduced mode starting
no particles and no shake; and the toggle overriding the system setting.
