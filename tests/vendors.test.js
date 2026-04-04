import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  rewriteSuperpowersCursorPlugin,
  copyAgencyCursorRules,
  markdownStartsWithFrontmatter,
} from '../src/core/vendors.js';

describe('vendors', () => {
  it('rewriteSuperpowersCursorPlugin prefixes paths', () => {
    const plugin = {
      name: 'superpowers',
      skills: './skills/',
      agents: './agents/',
      commands: './commands/',
      hooks: './hooks/hooks-cursor.json',
    };
    const out = rewriteSuperpowersCursorPlugin(plugin, './vendor/superpowers/');
    assert.equal(out.skills, './vendor/superpowers/skills/');
    assert.equal(out.agents, './vendor/superpowers/agents/');
    assert.equal(out.commands, './vendor/superpowers/commands/');
    assert.equal(out.hooks, './vendor/superpowers/hooks/hooks-cursor.json');
  });

  describe('copyAgencyCursorRules', () => {
    /** @type {string} */
    let tmp;

    before(async () => {
      tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'ai-dev-vendor-'));
      await fs.mkdir(path.join(tmp, 'src', 'rules'), { recursive: true });
      await fs.writeFile(path.join(tmp, 'src', 'rules', 'foo.mdc'), '---\nfoo\n', 'utf8');
      await fs.writeFile(path.join(tmp, 'src', 'rules', 'agency-bar.mdc'), '---\nbar\n', 'utf8');
      await fs.mkdir(path.join(tmp, 'dest'), { recursive: true });
      await fs.writeFile(path.join(tmp, 'dest', 'core-rules.mdc'), 'keep', 'utf8');
    });

    after(async () => {
      await fs.rm(tmp, { recursive: true, force: true });
    });

    it('prefixes mdc files and skips existing', async () => {
      const n = await copyAgencyCursorRules(
        path.join(tmp, 'src', 'rules'),
        path.join(tmp, 'dest'),
        false,
      );
      assert.equal(n, 2);
      const foo = await fs.readFile(path.join(tmp, 'dest', 'agency-foo.mdc'), 'utf8');
      assert.ok(foo.includes('foo'));
      const bar = await fs.readFile(path.join(tmp, 'dest', 'agency-bar.mdc'), 'utf8');
      assert.ok(bar.includes('bar'));
    });
  });

  describe('markdownStartsWithFrontmatter', () => {
    /** @type {string} */
    let tmp;

    before(async () => {
      tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'ai-dev-vendor-fm-'));
    });

    after(async () => {
      await fs.rm(tmp, { recursive: true, force: true });
    });

    it('detects leading ---', async () => {
      const p = path.join(tmp, 'a.md');
      await fs.writeFile(p, '---\ntitle: x\n---\n', 'utf8');
      assert.equal(await markdownStartsWithFrontmatter(p), true);
    });

    it('rejects without frontmatter', async () => {
      const p = path.join(tmp, 'b.md');
      await fs.writeFile(p, '# Hi\n', 'utf8');
      assert.equal(await markdownStartsWithFrontmatter(p), false);
    });
  });
});
