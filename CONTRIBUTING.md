# Contributing

Thanks for wanting to help. Bug reports, ideas and pull requests are all welcome.

## Getting started

```sh
git clone https://github.com/cocodedk/tetris.git
cd tetris
bash scripts/install-hooks.sh   # tests before each commit, commit-message check, safe pushes
python3 -m http.server 8000     # then open http://localhost:8000/
node --test                     # the whole suite; Node 22 or newer
```

There is nothing to install: no npm dependencies, no bundler, no build step.

## House rules

- Plain HTML, CSS and JavaScript ES modules. No dependencies, no network at runtime or in tests.
- `src/core/` (game rules) and `src/fx/` (effect state) never touch `window`, `document` or a
  canvas. Randomness and time are passed in, so `node --test` can test them directly.
- Every behaviour you add gets a test. Pixels are not tested; the state that drives them is.
- Keep every code file under 200 lines. Split into helpers when one grows.
- Both pages, `index.html` (English) and `fa/index.html` (Persian), must keep working. New text
  goes into both languages in `src/ui/i18n.js`.

## Commits and pull requests

- Commit subjects follow [Conventional Commits](https://www.conventionalcommits.org/):
  `feat(play): add hold`, `fix: stop double lock`, `docs: clarify controls`.
- `main` is protected. Open a pull request; CI (`node --test`) must pass before it merges.
- Keep a pull request to one change, and say what it does and why.

By contributing you agree that your work is licensed under the [Apache License 2.0](LICENSE).
