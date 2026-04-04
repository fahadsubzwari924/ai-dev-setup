import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  ensureVendorDirGitignored,
  fileAlreadyIgnoresVendorDir,
  GITIGNORE_VENDOR_BEGIN,
  GITIGNORE_VENDOR_END,
  lineIgnoresRootVendor,
} from '../src/core/gitignore-vendor.js';

describe('gitignore-vendor', () => {
  /** @type {string} */
  let tmp;

  before(async () => {
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'ai-dev-gitignore-'));
  });

  after(async () => {
    await fs.rm(tmp, { recursive: true, force: true });
  });

  it('lineIgnoresRootVendor matches common root vendor patterns', () => {
    assert.equal(lineIgnoresRootVendor('vendor'), true);
    assert.equal(lineIgnoresRootVendor('vendor/'), true);
    assert.equal(lineIgnoresRootVendor('/vendor'), true);
    assert.equal(lineIgnoresRootVendor('/vendor/'), true);
    assert.equal(lineIgnoresRootVendor('**/vendor'), true);
    assert.equal(lineIgnoresRootVendor('**/vendor/'), true);
    assert.equal(lineIgnoresRootVendor('  /vendor/  '), true);
    assert.equal(lineIgnoresRootVendor('# vendor'), false);
    assert.equal(lineIgnoresRootVendor(''), false);
    assert.equal(lineIgnoresRootVendor('node_modules/'), false);
    assert.equal(lineIgnoresRootVendor('path/vendor/extra'), false);
  });

  it('fileAlreadyIgnoresVendorDir', () => {
    assert.equal(fileAlreadyIgnoresVendorDir('node_modules/\n'), false);
    assert.equal(fileAlreadyIgnoresVendorDir('build/\nvendor/\n'), true);
  });

  it('creates .gitignore with managed block when missing', async () => {
    const cwd = path.join(tmp, 'a');
    await fs.mkdir(cwd, { recursive: true });
    const r = await ensureVendorDirGitignored(cwd);
    assert.equal(r.action, 'created');
    const text = await fs.readFile(path.join(cwd, '.gitignore'), 'utf8');
    assert.ok(text.includes(GITIGNORE_VENDOR_BEGIN));
    assert.ok(text.includes('/vendor/'));
    assert.ok(text.includes(GITIGNORE_VENDOR_END));
  });

  it('appends managed block and preserves existing lines', async () => {
    const cwd = path.join(tmp, 'b');
    await fs.mkdir(cwd, { recursive: true });
    await fs.writeFile(path.join(cwd, '.gitignore'), 'node_modules/\n', 'utf8');
    const r = await ensureVendorDirGitignored(cwd);
    assert.equal(r.action, 'appended_block');
    const text = await fs.readFile(path.join(cwd, '.gitignore'), 'utf8');
    assert.ok(text.startsWith('node_modules/\n'));
    assert.ok(text.includes(GITIGNORE_VENDOR_BEGIN));
    const r2 = await ensureVendorDirGitignored(cwd);
    assert.equal(r2.action, 'noop_managed_ok');
    const text2 = await fs.readFile(path.join(cwd, '.gitignore'), 'utf8');
    assert.equal((text2.match(new RegExp(GITIGNORE_VENDOR_BEGIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) ?? []).length, 1);
  });

  it('noop when vendor already ignored outside managed block', async () => {
    const cwd = path.join(tmp, 'c');
    await fs.mkdir(cwd, { recursive: true });
    await fs.writeFile(path.join(cwd, '.gitignore'), 'dist/\nvendor/\n', 'utf8');
    const r = await ensureVendorDirGitignored(cwd);
    assert.equal(r.action, 'noop_already_ignored');
    const text = await fs.readFile(path.join(cwd, '.gitignore'), 'utf8');
    assert.ok(!text.includes(GITIGNORE_VENDOR_BEGIN));
  });

  it('repairs managed block when /vendor/ line was removed', async () => {
    const cwd = path.join(tmp, 'd');
    await fs.mkdir(cwd, { recursive: true });
    const broken = `${GITIGNORE_VENDOR_BEGIN}\n\n${GITIGNORE_VENDOR_END}\n`;
    await fs.writeFile(path.join(cwd, '.gitignore'), broken, 'utf8');
    const r = await ensureVendorDirGitignored(cwd);
    assert.equal(r.action, 'repaired_block');
    const text = await fs.readFile(path.join(cwd, '.gitignore'), 'utf8');
    assert.ok(text.includes('/vendor/'));
    assert.ok(text.indexOf('/vendor/') < text.indexOf(GITIGNORE_VENDOR_END));
  });

  it('appends when only comment lines exist', async () => {
    const cwd = path.join(tmp, 'e');
    await fs.mkdir(cwd, { recursive: true });
    await fs.writeFile(path.join(cwd, '.gitignore'), '# nothing yet\n', 'utf8');
    const r = await ensureVendorDirGitignored(cwd);
    assert.equal(r.action, 'appended_block');
    assert.ok((await fs.readFile(path.join(cwd, '.gitignore'), 'utf8')).includes('/vendor/'));
  });
});
