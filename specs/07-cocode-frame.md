# 07 — The cocode.dk family frame

Every cocode.dk project site wears the same header and footer, `<cocode-head>` and `<cocode-foot>`
from https://brand.cocode.dk, so the family reads as one thing across projects. Tetris keeps its
own board, look and neon effects; the frame is only the furniture around it.

This supersedes the footer text and its rules in `specs/04-github-and-pages.md`.

## What it must do

- Both pages load `https://brand.cocode.dk/v1.css` (after `style.css`) and
  `https://brand.cocode.dk/v1.js` as a module, in `<head>`; the frame's own stylesheet then loads
  its fonts from https://cocode.dk.
- `<cocode-head>` is the first child of `<body>`, with `project="Tetris"` (Persian: `"تتریس"`),
  `accent="#5ee3ff"`, `on-accent="#0b0d1a"` (the game's own cyan and background) and `dark`. Its
  light-DOM children are the no-JavaScript fallback: a `cocode.dk` link and an EN/FA language pill
  pair built from the same two pages the site already links between — the frame reads the working
  switch from the pages' `hreflang` alternates, not from these. There was no site-wide top bar for
  it to replace; it is new furniture, not a swap.
- `<cocode-foot repo="cocodedk/tetris" dark>` is the last child of `<body>`, replacing the old
  `<footer class="site-footer">`: the foot carries its own author, copyright and source-code links
  in place of that footer's, so nothing a visitor could reach becomes unreachable, though the
  author link now opens cocode.dk rather than LinkedIn — the frame's standard link, the same on
  every cocode.dk site. The in-game language link on the start screen is app UI, not a site bar,
  and stays.
- The board still fills the screen and stays playable, on a phone and on a desktop: `.game` and
  `.board-wrap` reserve the frame's real rendered head and foot height, the same way they already
  reserved space for the old footer, so nothing overlaps and nothing scrolls.
- `CLAUDE.md`, `CONTRIBUTING.md` and `specs/02-play.md` say truthfully what now loads at runtime:
  the cocode.dk family frame (script and stylesheet from `brand.cocode.dk`, fonts from
  `cocode.dk`) on both pages, and Vazirmatn from Google Fonts on the Persian page only. Nothing
  else loads from the network, and the test suite still needs none to run. `README.md` makes no
  runtime-network claim, only that the test suite needs none, which stays true unchanged.

## Done when

`test/ui/pages.test.js` checks that both pages' markup loads `v1.css` and `v1.js` from
`brand.cocode.dk` and nothing else remote except, on the Persian page, Vazirmatn from Google
Fonts — the frame's own font requests are inside its stylesheet, not the page markup, so the
suite cannot see them, and does not claim to; and `test/repo.test.js` checks that both pages
carry a `<cocode-head>` with the right `project`, `accent` and `on-accent`, and a
`<cocode-foot repo="cocodedk/tetris" dark>` with a `cocode.dk` link, in place of the old footer
assertion.
