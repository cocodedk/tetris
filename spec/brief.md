# Brief: Tetris, with awesome visual effects

Owner: Claude, for Babak Bandpey ([Cocode](https://cocode.dk)). Written 2026-09-23.

## What it is

The classic falling-block game, played in any modern browser on desktop or phone, following the
modern guideline rules players expect. The twist is its look: every action has a visible,
satisfying reaction — light, particles, motion — without ever hiding the board or slowing the game.

## Who it is for

Anyone who knows Tetris and wants a beautiful version that opens instantly from a link.

## What the owner will accept at the end

1. It plays like real Tetris: the seven pieces, rotation with wall kicks, a fair random bag, hold,
   a five-piece preview, a ghost piece, soft and hard drop, scoring, levels that speed it up, and
   a clear game over.
2. It looks striking: glowing blocks, particle bursts on line clears, a screen shake on hard drops
   and Tetrises, a moving background that reacts to the level, and big moments for a Tetris and a
   level-up. It stays smooth (60 frames per second on an ordinary laptop) and respects the
   player's reduced-motion setting.
3. It works with a keyboard and with touch, in English and in Persian (right to left).
4. It is a public GitHub repository, `cocodedk/tetris`, with green CI, hooks, the usual public
   files, and a GitHub Pages site at https://tetris.cocode.dk/ where the game is playable,
   with complete SEO and a real 1200×630 social image.
5. An AI agent can play it through WebMCP, choosing one placement per piece, in a turn-based mode.

## Features, in build order

1. `specs/01-game-rules.md` — the rules, as pure tested code.
2. `specs/02-play.md` — the playable game: drawing, input, screens, two languages.
3. `specs/03-visual-effects.md` — the twist.
4. `specs/04-github-and-pages.md` — everything the public repository and its site need, including
   the script the owner runs to publish it.
5. `specs/05-webmcp.md` — tools an AI agent in the browser can use to play, one placement per piece.
6. `specs/06-custom-domain.md` — every stated URL moves to the site's own domain.

## Left out on purpose

Sound, online play, accounts, leaderboards beyond this browser, versioned releases (a static game
site needs none), Docker. Add them only when someone asks.

## The people in it

The owner is reachable by email (the loop's proven contact) and appears only at the edges: this
brief at the start, and acceptance at the end — reading and running `scripts/setup-repo.sh`, then
playing the live site. No feature asks a person for anything in the middle.
