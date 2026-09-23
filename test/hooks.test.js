import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// The hooks keep their rule in one ERE variable, which is also a valid JS RegExp; these tests
// run that exact regex, and check the hook applies it to the whole input with no escape hatch.
const hook = (name) => readFileSync(new URL(`../.githooks/${name}`, import.meta.url), 'utf8');
const rule = (src, name) => new RegExp(src.match(new RegExp(`${name}='([^']+)'`))[1]);

test('commit-msg accepts Conventional Commit subjects, the loop\'s own included', () => {
  const pattern = rule(hook('commit-msg'), 'pattern');
  for (const ok of ['feat(04-github-and-pages): 04-github-and-pages', 'fix: stop double lock',
    'docs(specs)!: rename', 'revert: drop hold', 'chore: merge main']) assert.match(ok, pattern, ok);
});

test('commit-msg refuses everything else, merges, reverts and fixups included', () => {
  const src = hook('commit-msg');
  const pattern = rule(src, 'pattern');
  for (const bad of ['Update stuff', 'feat:missing space', 'wip: later', 'feat(): empty scope',
    'Merge branch \'x\'', 'Revert "feat: hold"', 'fixup! feat: hold', 'squash! fix: x',
    'Merge anything at all']) assert.doesNotMatch(bad, pattern, bad);
  assert.doesNotMatch(src, /exit 0/, 'no subject is let through before the check');
  assert.match(src, /if ! \[\[ "\$subject" =~ \$pattern \]\]; then/);
});

test('pre-push allows only repositories directly under github.com/cocodedk/', () => {
  const src = hook('pre-push');
  const url = rule(src, 'url_pattern');
  for (const ok of ['https://github.com/cocodedk/tetris.git', 'https://github.com/cocodedk/tetris',
    'git@github.com:cocodedk/tetris.git', 'ssh://git@github.com/cocodedk/tetris.git',
    'https://github.com/cocodedk/cocode.dk']) assert.match(ok, url, ok);
  for (const bad of [
    'https://github.com/cocodedk/../another-owner/tetris.git',
    'https://github.com/cocodedk/./tetris.git', 'https://github.com/cocodedk/..',
    'https://github.com/cocodedk/.git', 'https://github.com/cocodedk/tetris/../../x/y.git',
    'https://github.com/cocodedk/%2e%2e/x.git', 'https://github.com/cocodedk/',
    'https://github.com/cocodedkevil/tetris.git', 'https://github.com.evil.com/cocodedk/tetris.git',
    'https://evil.com/github.com/cocodedk/tetris.git', 'git@github.com:other/tetris.git',
    'http://github.com/cocodedk/tetris.git', '/tmp/cocodedk/tetris',
  ]) assert.doesNotMatch(bad, url, bad);
  // [[ =~ ]] anchors to the whole string; grep would accept any one matching line of it.
  assert.match(src, /if ! \[\[ "\$url" =~ \$url_pattern \]\]; then/);
  assert.doesNotMatch(src, /<OWNER>/);
});

test('pre-push refuses deleting or rewriting main', () => {
  const src = hook('pre-push');
  assert.match(src, /refs\/heads\/main/);
  assert.match(src, /"\$local_sha" = "\$zero"/, 'a zero local sha is a deletion');
  assert.match(src, /! git merge-base --is-ancestor "\$remote_sha" "\$local_sha"/, 'non-fast-forward');
});
