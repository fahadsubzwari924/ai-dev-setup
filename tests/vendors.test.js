import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  rewriteSuperpowersCursorPlugin,
  copyAgencyCursorRules,
  markdownStartsWithFrontmatter,
  readMarkdownFrontmatter,
  writeAgencyIndex,
  removeTypeScriptFilesRecursive,
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

  describe('readMarkdownFrontmatter', () => {
    /** @type {string} */
    let tmp;

    before(async () => {
      tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'ai-dev-fm-parse-'));
    });

    after(async () => {
      await fs.rm(tmp, { recursive: true, force: true });
    });

    it('parses simple key/value pairs', async () => {
      const p = path.join(tmp, 'agent.md');
      await fs.writeFile(
        p,
        '---\nname: Backend Architect\ndescription: Senior backend specialist\ncolor: blue\n---\n# Body\n',
        'utf8',
      );
      const fm = await readMarkdownFrontmatter(p);
      assert.equal(fm.name, 'Backend Architect');
      assert.equal(fm.description, 'Senior backend specialist');
      assert.equal(fm.color, 'blue');
    });

    it('strips surrounding quotes', async () => {
      const p = path.join(tmp, 'quoted.md');
      await fs.writeFile(p, '---\nname: "Backend Architect"\n---\n', 'utf8');
      const fm = await readMarkdownFrontmatter(p);
      assert.equal(fm.name, 'Backend Architect');
    });

    it('returns empty object when no frontmatter', async () => {
      const p = path.join(tmp, 'plain.md');
      await fs.writeFile(p, '# Hi\n', 'utf8');
      const fm = await readMarkdownFrontmatter(p);
      assert.deepEqual(fm, {});
    });
  });

  describe('writeAgencyIndex', () => {
    /** @type {string} */
    let tmp;

    before(async () => {
      tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'ai-dev-index-'));
      const agentsDir = path.join(tmp, '.claude', 'agents');
      await fs.mkdir(agentsDir, { recursive: true });
      await fs.writeFile(
        path.join(agentsDir, 'engineering-backend-architect.md'),
        '---\nname: Backend Architect\ndescription: Senior backend architect\n---\n# body\n',
        'utf8',
      );
      await fs.writeFile(
        path.join(agentsDir, 'testing-api-tester.md'),
        '---\nname: API Tester\ndescription: Tests APIs\n---\n# body\n',
        'utf8',
      );
      await fs.writeFile(
        path.join(agentsDir, 'product-manager.md'),
        '---\nname: Product Manager\ndescription: Scope and priorities\n---\n# body\n',
        'utf8',
      );
      // file without frontmatter — must be skipped
      await fs.writeFile(path.join(agentsDir, 'README.md'), '# readme, no fm\n', 'utf8');
    });

    after(async () => {
      await fs.rm(tmp, { recursive: true, force: true });
    });

    it('writes _index.json with subagent_type, division, name, description', async () => {
      const count = await writeAgencyIndex(tmp);
      assert.equal(count, 3);
      const raw = await fs.readFile(
        path.join(tmp, '.claude', 'agents', '_index.json'),
        'utf8',
      );
      const manifest = JSON.parse(raw);
      assert.equal(manifest.count, 3);
      assert.ok(Array.isArray(manifest.agents));
      const byType = Object.fromEntries(manifest.agents.map((a) => [a.subagentType, a]));

      assert.ok(byType['engineering-backend-architect']);
      assert.equal(byType['engineering-backend-architect'].division, 'engineering');
      assert.equal(byType['engineering-backend-architect'].name, 'Backend Architect');
      assert.equal(
        byType['engineering-backend-architect'].file,
        'engineering-backend-architect.md',
      );

      assert.ok(byType['testing-api-tester']);
      assert.equal(byType['testing-api-tester'].division, 'testing');

      assert.ok(byType['product-manager']);
      assert.equal(byType['product-manager'].division, 'product');
    });

    it('returns 0 when .claude/agents/ is missing', async () => {
      const empty = await fs.mkdtemp(path.join(os.tmpdir(), 'ai-dev-index-empty-'));
      try {
        const count = await writeAgencyIndex(empty);
        assert.equal(count, 0);
      } finally {
        await fs.rm(empty, { recursive: true, force: true });
      }
    });
  });

  describe('removeTypeScriptFilesRecursive', () => {
    /** @type {string} */
    let tmp;

    before(async () => {
      tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'ai-dev-ts-filter-'));
      await fs.mkdir(path.join(tmp, 'skills', 'nested'), { recursive: true });
      await fs.writeFile(path.join(tmp, 'skills', 'guide.md'), '# Keep me\n', 'utf8');
      await fs.writeFile(path.join(tmp, 'skills', 'example.ts'), 'export const x = 1;\n', 'utf8');
      await fs.writeFile(
        path.join(tmp, 'skills', 'nested', 'component.tsx'),
        'export const Comp = () => null;\n',
        'utf8',
      );
      await fs.writeFile(path.join(tmp, 'skills', 'nested', 'note.txt'), 'keep\n', 'utf8');
    });

    after(async () => {
      await fs.rm(tmp, { recursive: true, force: true });
    });

    it('removes .ts/.tsx files and keeps docs', async () => {
      await removeTypeScriptFilesRecursive(path.join(tmp, 'skills'));

      await assert.doesNotReject(fs.access(path.join(tmp, 'skills', 'guide.md')));
      await assert.doesNotReject(fs.access(path.join(tmp, 'skills', 'nested', 'note.txt')));
      await assert.rejects(fs.access(path.join(tmp, 'skills', 'example.ts')));
      await assert.rejects(fs.access(path.join(tmp, 'skills', 'nested', 'component.tsx')));
    });
  });
});
