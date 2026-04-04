import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { writeFiles } from '../src/core/writer.js';

describe('writer', () => {
  /** @type {string} */
  let tmp;

  before(async () => {
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'ai-dev-setup-writer-'));
  });

  after(async () => {
    await fs.rm(tmp, { recursive: true, force: true });
  });

  it('writes files and creates directories', async () => {
    const results = await writeFiles(
      [{ path: 'a/b/c.txt', content: 'hello' }],
      { cwd: tmp, force: false },
    );
    assert.equal(results[0].status, 'written');
    const text = await fs.readFile(path.join(tmp, 'a/b/c.txt'), 'utf8');
    assert.equal(text, 'hello');
  });

  it('skips existing files without force', async () => {
    const p = path.join(tmp, 'skip.txt');
    await fs.writeFile(p, 'old', 'utf8');
    const results = await writeFiles([{ path: 'skip.txt', content: 'new' }], { cwd: tmp, force: false });
    assert.equal(results[0].status, 'skipped');
    assert.equal(await fs.readFile(p, 'utf8'), 'old');
  });

  it('overwrites with force', async () => {
    const p = path.join(tmp, 'force.txt');
    await fs.writeFile(p, 'old', 'utf8');
    const results = await writeFiles([{ path: 'force.txt', content: 'new' }], { cwd: tmp, force: true });
    assert.equal(results[0].status, 'written');
    assert.equal(await fs.readFile(p, 'utf8'), 'new');
  });

  it('rejects path traversal outside cwd', async () => {
    const results = await writeFiles([{ path: '../escape.txt', content: 'x' }], { cwd: tmp, force: false });
    assert.equal(results[0].status, 'error');
    assert.match(results[0].error ?? '', /working directory/);
  });
});
