import { test } from 'node:test';
import assert from 'node:assert/strict';
import handler from '../../api/girlhood';
import { parseProgramJson } from '../../src/lib/programImport';
import { readFile } from 'node:fs/promises';

test('campaign dispatcher rejects unknown actions and preserves method guards', async () => {
  const res = () => ({ statusCode: 0, headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(n) { this.statusCode = n; return this; }, json(body) { return body; } }) as any;
  for (const action of [undefined, 'constructor', '__proto__', 'unknown', ['submit', 'wall']]) {
    const response = res();
    await handler({ query: { action }, method: 'GET', headers: {} } as any, response);
    assert.equal(response.statusCode, 404);
  }
  for (const action of ['submit', 'withdraw']) {
    const response = res();
    await handler({ query: { action }, method: 'GET', headers: {} } as any, response);
    assert.equal(response.statusCode, 405);
    assert.equal(response.headers['Cache-Control'], 'no-store');
  }
});

test('campaign example imports into the existing editor without publishing', async () => {
  const parsed = parseProgramJson(await readFile('examples/girlhood-program.json', 'utf8'));
  assert.equal(parsed.fatal, false);
  assert.deepEqual(parsed.errors, []);
  assert.deepEqual(parsed.warnings, []);
  assert.equal(parsed.values.pageTemplate, 'girlhood');
  assert.equal(parsed.values.slug, 'girlhood');
  assert.equal('published' in parsed.values, false);
});
