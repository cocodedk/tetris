# 08 — Spanish

A third language, from a volunteer translator's strings: **https://tetris.cocode.dk/es/**. This
extends the languages in `specs/02-play.md` and the pages and site URLs in
`specs/04-github-and-pages.md` and `specs/06-custom-domain.md` from two pages to three.

## What it must do

- **Page:** `es/index.html` (`lang="es"`, left to right), the English page with Spanish head text
  and `../` paths. It loads only what the English page loads: no extra fonts.
- **Text:** an `es` table in `src/ui/i18n.js` with every key the `en` table has. Score, level and
  lines keep Latin digits. The script reads the page's own `lang` and falls back to English.
- **Links:** every page names all three in its `hreflang` alternates (plus `x-default` →
  English) and its `og:locale:alternate` tags. The header pill shows EN, FA, ES. The start
  screen links to the other two languages, each named in its own language (English, فارسی,
  Español).
- **Titles:** each page keeps its own `<title>`; the script no longer replaces it with the game's
  name, so the Spanish and Persian titles reach tabs and search results.
- **Screen readers:** the board, hold and next canvases are `role="img"` with an `aria-label`
  from the table (`data-i18n-label`), in the page's language.
- **Site:** `sitemap.xml` lists all three pages with their alternates; `pages.yml` deploys `es/`;
  `README.md`, `llms.txt`, `CONTRIBUTING.md` and `scripts/setup-repo.sh` name Spanish.
- **Frame:** the cocode.dk family frame (`cocodedk/brand`) has Spanish words and the name
  "Español", so its head and foot read Spanish on this page.

## Done when

The tests check that every table has the same keys, none empty; that `es/index.html` is
`lang="es"` and loads `../src/main.js`, `../style.css` and only the cocode.dk frame; that each page
links to the other two; that all three pages share one body structure; that every canvas carries
`role="img"` and a `data-i18n-label` key found in the table; that every page carries its own
canonical, `og:url`, `og:locale` (`es_ES` for Spanish) and JSON-LD `inLanguage` and names every
page in its `hreflang` alternates; and that `sitemap.xml` lists exactly the three pages.
