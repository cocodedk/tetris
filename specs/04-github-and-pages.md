# 04 — GitHub repository and Pages site

Add everything the public repository `cocodedk/tetris` and its GitHub Pages site need, and the
script the owner runs to publish it. Do not publish anything: no `git push`, no `gh` call, no
network. The owner runs `scripts/setup-repo.sh` at acceptance.

Identity (fixed): author Babak Bandpey, company [Cocode](https://cocode.dk), GitHub owner
`cocodedk`, LinkedIn https://linkedin.com/in/babakbandpey, security contact babak@cocode.dk.
Site URL https://cocodedk.github.io/tetris/ (English) and https://cocodedk.github.io/tetris/fa/
(Persian). Versioned releases are out: a static game site needs none.

## Public files

- `README.md`: what it is, a "Play it" link to the site (English and فارسی), a screenshot slot
  pointing at `og.png`, controls, running locally (`python3 -m http.server 8000`), testing
  (`node --test`), the layout, license, and "Made by Babak Bandpey at [Cocode](https://cocode.dk)".
- `LICENSE` (Apache-2.0, copyright 2026 Babak Bandpey), `CONTRIBUTING.md`, `SECURITY.md`
  (report to babak@cocode.dk), `.gitignore`, `.gitattributes` (text=auto, LF for sh), `llms.txt`
  (the project in a few lines, with links to the README, the site and the specs).
- `.github/`: a pull-request template, bug and feature issue templates, and `dependabot.yml`
  (github-actions, weekly).

## CI and Pages

- `.github/workflows/ci.yml`: on pull requests and pushes to any branch, Node 22, `node --test`.
  It may cancel superseded CI runs.
- `.github/workflows/pages.yml`: on push to `main` and manual dispatch; copies only the site
  (`index.html`, `fa/`, `src/`, the stylesheet, `favicon.svg`, `og.png`, `robots.txt`,
  `sitemap.xml`) into `_site`, uploads it and deploys with `actions/deploy-pages`. Permissions
  `pages: write`, `id-token: write`. Concurrency group `pages` with `cancel-in-progress: false`.

## Git hooks

`.githooks/pre-commit` (runs `node --test`), `.githooks/commit-msg` (Conventional Commit subject),
`.githooks/pre-push` (refuses a push URL outside `github.com/cocodedk/`, and refuses a force-push
or deletion of `main`), all executable, and `scripts/install-hooks.sh` (sets `core.hooksPath`).

## SEO on both pages

Page-specific title and description; canonical; `hreflang` alternates for `en`, `fa` and
`x-default`; Open Graph (type, title, description, url, absolute `og:image` with width 1200 and
height 630, locale); Twitter `summary_large_image`; JSON-LD `VideoGame` (name, url, author,
publisher Cocode, genre puzzle, playMode single-player, inLanguage); `favicon.svg`; and a footer
"© 2026 Cocode | Created by Babak Bandpey" (Persian: "© ۱۴۰۵ Cocode | ساخته شده توسط بابک بندپی"),
both links opening in a new tab with `rel="noreferrer"`. Add `robots.txt` (allow all, sitemap
link) and `sitemap.xml` listing both pages.

## Social image

`og.png`, checked in, exactly 1200×630, designed for this game in its neon look (title, falling
pieces, glow). Produce it with a small script in `scripts/` that uses only Node's standard library
(for example `zlib` to write the PNG), so it can be re-rendered without dependencies.

## The publish script

`scripts/setup-repo.sh`, safe to run again: refuses unless the current directory's `origin`
(if any) is under `cocodedk`; creates `cocodedk/tetris` as public with a description, homepage
and topics if it does not exist, otherwise just pushes `main` (never force); enables Pages with
the workflow build type; installs the hooks; and, once CI has run, protects `main` (pull request
required, 0 approvals, the CI check required, no force-push, no deletion). It prints each step and
the site URL. It never uses `--no-verify` or `--force`.

## Done when

A test suite `test/repo.test.js` checks, from the files alone: every file above exists; the hooks
and scripts are executable; `pre-push` names `cocodedk` and contains no `<OWNER>` placeholder;
`pages.yml` has `cancel-in-progress: false` and deploys only site files; both pages carry the
canonical, hreflang, Open Graph, Twitter and JSON-LD tags with the right URLs; `sitemap.xml`
lists both URLs; `og.png`'s PNG header says 1200×630; and `setup-repo.sh` contains no `--force`
and no `--no-verify`.
