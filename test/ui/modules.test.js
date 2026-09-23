import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const DOM_MODULES = ['draw', 'input', 'touch', 'screens', 'storage'];

test('the drawing and input modules load without a browser', async () => {
  for (const name of DOM_MODULES) {
    const mod = await import(`../../src/ui/${name}.js`);
    assert.ok(Object.keys(mod).length > 0, name);
  }
});

test('every name src/main.js imports is exported by its module', async () => {
  const mainUrl = new URL('../../src/main.js', import.meta.url);
  const source = readFileSync(mainUrl, 'utf8');
  const imports = [...source.matchAll(/import\s*\{([^}]+)\}\s*from\s*'([^']+)'/g)];
  assert.ok(imports.length >= 5);
  for (const [, names, path] of imports) {
    const mod = await import(new URL(path, mainUrl));
    for (const name of names.split(',').map((n) => n.trim()).filter(Boolean)) {
      assert.ok(name in mod, `${name} from ${path}`);
    }
  }
});
