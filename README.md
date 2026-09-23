# Tetris

Classic Tetris in the browser, with neon visual effects as its twist: glowing pieces, line-clear
flashes, particles and a little screen shake. Seven pieces, hold, a next queue, keyboard and
touch. Plain HTML, CSS and JavaScript: no install, no sign-up, no build step.

**Play it:** [English](https://cocodedk.github.io/tetris/) · [فارسی](https://cocodedk.github.io/tetris/fa/)

[![Tetris in its neon look: the title, falling pieces and a glowing line clear](og.png)](https://cocodedk.github.io/tetris/)

## Controls

| Key | Action |
|---|---|
| ← → | Move |
| ↓ | Soft drop |
| Space | Hard drop |
| ↑ or X | Rotate clockwise |
| Z or Ctrl | Rotate back |
| C or Shift | Hold |
| P or Esc | Pause |

On a touch screen: tap to rotate, drag to move, flick down to drop.

## Play with an AI agent

The page registers four [WebMCP](https://github.com/webmachinelearning/webmcp) tools
(`src/ui/webmcp.js`), so an AI agent in your browser can play with the same moves your keys make:

| Tool | What it does |
|---|---|
| `get_game` | The status, the board as 20 rows of 10 characters, the current piece, hold, the next five, score, level and lines. |
| `list_placements` | Every place the current piece (or the held one) can go, each with an id and what it would do: lines cleared, holes, stack height, bumpiness. |
| `place` | Puts the piece at one placement by id (hold, rotate, move, hard drop) and returns the new game and its events. |
| `new_game` | Starts a game. `seed` repeats a piece sequence; `turnBased: true` stops gravity and the lock delay between placements, so a slow agent loses nothing to time. |

WebMCP is a draft browser API, today only in Chrome with its WebMCP flag on. Without it the page
registers nothing and plays as usual.

## Run it locally

Any static server works. With Python:

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000/ (English) or http://localhost:8000/fa/ (Persian).

## Test

```sh
node --test
```

Node 22 or newer. The suite has no dependencies and needs no network.

## Layout

| Path | Contents |
|---|---|
| `src/core/` | Game rules: board, pieces, rotation, scoring. Pure functions, no DOM. |
| `src/fx/` | Effect state: particles, shake, flashes, timers. Pure, stepped by `dt`. |
| `src/ui/` | Canvas drawing, input, screens, text in both languages. |
| `src/main.js` | Wires it together; loaded by both pages. |
| `index.html`, `fa/index.html` | The English and Persian pages. |
| `test/` | `node:test` suites mirroring `src/`, plus checks on the repository itself. |
| `scripts/` | `install-hooks.sh`, `setup-repo.sh` (publishing), `render-og.js` (the social image). |
| `spec/`, `specs/` | The product brief and one spec per feature. |

To re-render the social image `og.png` after a design change: `node scripts/render-og.js`.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Security reports go to babak@cocode.dk, see
[SECURITY.md](SECURITY.md).

## License

[Apache License 2.0](LICENSE). Copyright 2026 Babak Bandpey.

---

Made by Babak Bandpey at [Cocode](https://cocode.dk) · [LinkedIn](https://linkedin.com/in/babakbandpey)
