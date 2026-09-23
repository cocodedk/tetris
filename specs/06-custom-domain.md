# 06 — The site's own domain

The site now lives at **https://tetris.cocode.dk/** (Persian: https://tetris.cocode.dk/fa/).
GitHub Pages is already set to that custom domain, and `cocodedk.github.io/tetris/` redirects there.
Every URL the project states still names the old address. This supersedes the site URLs in
`specs/04-github-and-pages.md`.

## What it must do

- Replace `https://cocodedk.github.io/tetris/` with `https://tetris.cocode.dk/` everywhere outside
  `spec/` and `specs/`: both pages' canonical, `hreflang` alternates, `og:url`, `og:image`, and
  JSON-LD `url`; `sitemap.xml`; the sitemap link in `robots.txt`; `README.md`; `SECURITY.md`;
  `llms.txt`; and the tests.
- `scripts/setup-repo.sh` states the site URL once as `https://tetris.cocode.dk/`, uses it as the
  repository homepage, and sets the Pages custom domain to `tetris.cocode.dk` (keeping build type
  workflow), so running it again keeps the domain.
- No `CNAME` file: a Pages site deployed by a workflow takes its domain from the repository setting.

## Done when

`test/repo.test.js` checks that no file outside `spec/`, `specs/` and `.git/` contains
`cocodedk.github.io`, that both pages' canonical and `og:url` are `https://tetris.cocode.dk/` and
`https://tetris.cocode.dk/fa/`, that `og:image` is `https://tetris.cocode.dk/og.png`, that
`sitemap.xml` lists exactly those two pages, and that `setup-repo.sh` names `tetris.cocode.dk` as
the Pages custom domain.
