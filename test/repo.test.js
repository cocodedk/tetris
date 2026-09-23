import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';

const at = (path) => new URL(`../${path}`, import.meta.url);
const read = (path) => readFileSync(at(path), 'utf8');
const SITE = 'https://tetris.cocode.dk/';
const SITE_FA = `${SITE}fa/`;

const FILES = [
  'README.md', 'LICENSE', 'CONTRIBUTING.md', 'SECURITY.md', '.gitignore', '.gitattributes', 'llms.txt',
  '.github/pull_request_template.md', '.github/ISSUE_TEMPLATE/bug_report.md',
  '.github/ISSUE_TEMPLATE/feature_request.md', '.github/dependabot.yml',
  '.github/workflows/ci.yml', '.github/workflows/pages.yml',
  '.githooks/pre-commit', '.githooks/commit-msg', '.githooks/pre-push',
  'scripts/install-hooks.sh', 'scripts/setup-repo.sh', 'scripts/render-og.js',
  'favicon.svg', 'og.png', 'robots.txt', 'sitemap.xml',
];

test('every public, CI, hook and site file exists', () => {
  for (const file of FILES) assert.ok(existsSync(at(file)), file);
});

test('README links both pages, shows og.png and credits Cocode', () => {
  const readme = read('README.md');
  for (const s of [SITE, SITE_FA, 'فارسی', '(og.png)', 'python3 -m http.server 8000', 'node --test',
    'Made by Babak Bandpey at [Cocode](https://cocode.dk)']) assert.ok(readme.includes(s), s);
});

test('LICENSE is Apache-2.0 for 2026 Babak Bandpey; SECURITY names the contact', () => {
  assert.match(read('LICENSE'), /Apache License\s+Version 2\.0/);
  assert.match(read('LICENSE'), /Copyright 2026 Babak Bandpey/);
  assert.match(read('SECURITY.md'), /babak@cocode\.dk/);
});

test('.gitattributes normalises text and keeps shell scripts and hooks LF', () => {
  const attrs = read('.gitattributes');
  assert.match(attrs, /^\* text=auto$/m);
  assert.match(attrs, /^\*\.sh text eol=lf$/m);
  assert.match(attrs, /^\.githooks\/\* text eol=lf$/m);
});

test('llms.txt links the README, the site and the specs', () => {
  const llms = read('llms.txt');
  assert.match(llms, /^# Tetris/);
  for (const s of ['README.md', SITE, '/specs']) assert.ok(llms.includes(s), s);
});

test('dependabot updates github-actions weekly', () => {
  const dep = read('.github/dependabot.yml');
  assert.match(dep, /package-ecosystem: github-actions/);
  assert.match(dep, /interval: weekly/);
});

test('CI runs node --test on Node 22 for pull requests and pushes to any branch', () => {
  const ci = read('.github/workflows/ci.yml');
  assert.match(ci, /pull_request:/);
  assert.match(ci, /branches: \['\*\*'\]/);
  assert.match(ci, /node-version: 22/);
  assert.match(ci, /run: node --test/);
  assert.match(ci, /^  test:$/m, 'setup-repo.sh requires the check named "test"');
});

test('pages.yml deploys only the site files, never cancelling a deploy', () => {
  const pages = read('.github/workflows/pages.yml');
  assert.match(pages, /branches: \[main\]/);
  assert.match(pages, /workflow_dispatch:/);
  assert.match(pages, /pages: write/);
  assert.match(pages, /id-token: write/);
  assert.match(pages, /group: pages\n\s+cancel-in-progress: false/);
  assert.match(pages, /actions\/upload-pages-artifact@/);
  assert.match(pages, /actions\/deploy-pages@/);
  const copies = [...pages.matchAll(/^\s*cp -r (.+) _site\/$/gm)];
  assert.equal(copies.length, 1);
  assert.deepEqual(copies[0][1].split(/\s+/).sort(),
    ['fa', 'favicon.svg', 'index.html', 'og.png', 'robots.txt', 'sitemap.xml', 'src', 'style.css']);
});

test('install-hooks.sh makes the hooks executable and sets core.hooksPath', () => {
  const sh = read('scripts/install-hooks.sh');
  assert.match(sh, /chmod \+x .*\.githooks/);
  assert.match(sh, /config core\.hooksPath \.githooks/);
});

test('pre-commit runs the suite; commit-msg accepts the loop\'s own subjects', () => {
  assert.match(read('.githooks/pre-commit'), /node --test/);
  assert.match(read('.githooks/commit-msg'), /pattern='\^\(feat\|fix\|/); // exercised in hooks.test.js
});

test('pre-push allows only github.com/cocodedk/ and guards main', () => {
  const hook = read('.githooks/pre-push');
  assert.match(hook, /github\.com\/cocodedk\//);
  assert.doesNotMatch(hook, /<OWNER>/);
  assert.match(hook, /refs\/heads\/main/);
  assert.match(hook, /merge-base --is-ancestor/);
  assert.match(hook, /0{40}/);
});

test('setup-repo.sh names the repository once and never forces or skips hooks', () => {
  const sh = read('scripts/setup-repo.sh');
  assert.doesNotMatch(sh, /--force/);
  assert.doesNotMatch(sh, /--no-verify/);
  assert.equal(sh.match(/cocodedk\/tetris/g).length, 1);
  assert.match(sh, /REPO_URL="https:\/\/github\.com\/cocodedk\/tetris\.git"/);
  assert.match(sh, /git push "\$REPO_URL" main:main/);
  const code = sh.replace(/^\s*#.*$/gm, '');
  assert.doesNotMatch(code, /git remote|\borigin\b/, 'reads no existing remote');
  for (const s of ['--public', '--description', '--homepage', '--add-topic', 'build_type=workflow',
    'install-hooks.sh', '"allow_force_pushes": false', '"allow_deletions": false',
    '"required_approving_review_count": 0', '"contexts": ["$CI_CHECK"]', 'SITE_URL']) {
    assert.ok(sh.includes(s), s);
  }
  for (const call of sh.matchAll(/gh (repo|workflow|run) \w+ [^\n]*/g)) {
    assert.match(call[0], /"\$SLUG"/, `gh call names the repo: ${call[0]}`);
  }
});

test('setup-repo.sh sets the site URL once and tetris.cocode.dk as the Pages custom domain', () => {
  const sh = read('scripts/setup-repo.sh');
  assert.equal(sh.match(/tetris\.cocode\.dk/g).length, 1);
  assert.match(sh, /^SITE_URL="https:\/\/tetris\.cocode\.dk\/"\nDOMAIN="\$\{SITE_URL#https:\/\/\}"\nDOMAIN="\$\{DOMAIN%\/\}"/m);
  assert.match(sh, /gh api -X PUT "repos\/\$SLUG\/pages" -f build_type=workflow -f cname="\$DOMAIN"/);
});

test('no file outside spec/, specs/ and .git/ names the old github.io address', () => {
  const walk = (dir) => readdirSync(at(dir), { withFileTypes: true })
    .filter((e) => dir || !['.git', 'spec', 'specs'].includes(e.name))
    .flatMap((e) => (e.isDirectory() ? walk(`${dir}${e.name}/`) : [`${dir}${e.name}`]));
  const files = walk(''), old = ['cocodedk', 'github', 'io'].join('.'); // split so this file passes
  assert.ok(files.includes('fa/index.html') && !files.includes('CNAME'), 'no CNAME: the domain is a setting');
  for (const file of files) assert.ok(!read(file).includes(old), file);
});

const PAGES = [
  { file: 'index.html', url: SITE, lang: 'en', locale: 'en_US', icon: 'favicon.svg',
    footer: '© 2026 Cocode | Created by Babak Bandpey' },
  { file: 'fa/index.html', url: SITE_FA, lang: 'fa', locale: 'fa_IR', icon: '../favicon.svg',
    footer: '© ۱۴۰۵ Cocode | ساخته شده توسط بابک بندپی' },
];
const meta = (html, key) => html.match(new RegExp(`<meta (?:property|name)="${key}" content="([^"]*)">`))?.[1];

for (const page of PAGES) {
  test(`${page.file} carries its SEO, social and structured-data tags`, () => {
    const html = read(page.file);
    const title = html.match(/<title>([^<]+)<\/title>/)[1];
    assert.ok(title.length > 10, 'a page-specific title');
    assert.ok(meta(html, 'description').length > 50, 'a page-specific description');
    assert.ok(html.includes(`<link rel="canonical" href="${page.url}">`));
    assert.ok(html.includes(`<link rel="alternate" hreflang="en" href="${SITE}">`));
    assert.ok(html.includes(`<link rel="alternate" hreflang="fa" href="${SITE_FA}">`));
    assert.ok(html.includes(`<link rel="alternate" hreflang="x-default" href="${SITE}">`));
    assert.ok(html.includes(`<link rel="icon" href="${page.icon}" type="image/svg+xml">`));
    assert.equal(meta(html, 'og:type'), 'website');
    assert.ok(meta(html, 'og:title') && meta(html, 'og:description'));
    assert.equal(meta(html, 'og:url'), page.url);
    assert.equal(meta(html, 'og:image'), `${SITE}og.png`);
    assert.equal(meta(html, 'og:image:width'), '1200');
    assert.equal(meta(html, 'og:image:height'), '630');
    assert.equal(meta(html, 'og:locale'), page.locale);
    assert.equal(meta(html, 'twitter:card'), 'summary_large_image');
    assert.equal(meta(html, 'twitter:image'), `${SITE}og.png`);
    const ld = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
    assert.equal(ld['@type'], 'VideoGame');
    assert.equal(ld.url, page.url);
    assert.equal(ld.author.name, 'Babak Bandpey');
    assert.equal(ld.publisher.name, 'Cocode');
    assert.equal(ld.genre, 'Puzzle');
    assert.equal(ld.playMode, 'SinglePlayer');
    assert.equal(ld.inLanguage, page.lang);
    assert.ok(ld.name);
  });

  test(`${page.file} has the credit footer, its links opening in a new tab`, () => {
    const footer = read(page.file).match(/<footer[^>]*>([\s\S]*?)<\/footer>/)[1];
    assert.equal(footer.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(), page.footer);
    const links = [...footer.matchAll(/<a [^>]*>/g)].map((m) => m[0]);
    assert.equal(links.length, 2);
    for (const a of links) {
      assert.match(a, /target="_blank"/);
      assert.match(a, /rel="noreferrer"/);
    }
  });
}

test('og.png is a PNG of exactly 1200×630', () => {
  const png = readFileSync(at('og.png'));
  assert.deepEqual([...png.subarray(0, 8)], [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  assert.equal(png.toString('latin1', 12, 16), 'IHDR');
  assert.equal(png.readUInt32BE(16), 1200);
  assert.equal(png.readUInt32BE(20), 630);
});

test('robots.txt allows all and links the sitemap; the sitemap lists both pages', () => {
  const robots = read('robots.txt');
  assert.match(robots, /User-agent: \*\nAllow: \//);
  assert.ok(robots.includes(`Sitemap: ${SITE}sitemap.xml`));
  const locs = [...read('sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.deepEqual(locs, [SITE, SITE_FA]);
});
