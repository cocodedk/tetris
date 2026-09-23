# Tetris — working notes

Classic Tetris in the browser, with visual effects as its twist. The product brief is
`spec/brief.md`; each feature the loop builds is one file in `specs/`. Do not edit `spec/` or
`specs/` from a feature: they are the owner's.

The machine-level mechanics (the suite, the build, the artifact) are in
[profile-web-node.md](profile-web-node.md).

## Commands

| What | Command |
|---|---|
| All tests | `node --test` |
| Play locally | `python3 -m http.server 8000`, then open http://localhost:8000/ |

## Layout

| Path | Contents | DOM? |
|---|---|---|
| `src/core/` | Game rules: board, pieces, rotation, scoring. Pure functions and plain data. | no |
| `src/fx/` | Effect state: particles, shake, flashes, timers. Pure, stepped by `dt`. | no |
| `src/ui/` | Canvas drawing, input, screens, text. | yes |
| `test/` | `node:test` suites, named `*.test.js`, mirroring `src/`. | no |
| `index.html`, `fa/index.html` | English and Persian pages; both load `src/main.js`. | — |

## House rules

- Plain HTML, CSS and JavaScript ES modules. No npm dependencies, no bundler, no build step,
  no network in tests, and at runtime only the Persian page's Vazirmatn font from Google Fonts.
- `src/core/` and `src/fx/` never touch `window`, `document` or canvas, so `node --test` can
  test them directly. Randomness and time are passed in (a seeded random, a `dt`), never read
  from globals.
- Every code file stays under 200 lines (JS, HTML, CSS, shell, YAML).
- Every behaviour a feature adds has a test. Pixels are not tested; the state that drives them is.
- `localStorage` access is wrapped in try/catch; the game works without it.
