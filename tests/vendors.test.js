import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  rewriteSuperpowersCursorPlugin,
  copyAgencyCursorRules,
  markdownStartsWithFrontmatter,
  readMarkdownFrontmatter,
  writeAgencyIndex,
  removeTypeScriptFilesRecursive,
  applyAgencyOverlays,
  pruneSuperpowersSkills,
} from '../src/core/vendors.js';
import { render } from '../src/core/renderer.js';

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

    it('writes _index.json with compatibility dispatch candidates', async () => {
      const count = await writeAgencyIndex(tmp);
      assert.equal(count, 3);
      const raw = await fs.readFile(
        path.join(tmp, '.claude', 'agents', '_index.json'),
        'utf8',
      );
      const manifest = JSON.parse(raw);
      const dispatchRaw = await fs.readFile(
        path.join(tmp, '.claude', 'agents', '_index.dispatch.json'),
        'utf8',
      );
      const dispatch = JSON.parse(dispatchRaw);
      assert.equal(manifest.count, 3);
      assert.equal(dispatch.byTask.api, 'Backend Architect');
      assert.equal(dispatch.byTask.review, 'Code Reviewer');
      assert.ok(Array.isArray(manifest.agents));
      assert.equal(manifest.schemaVersion, 2);
      // primary subagentType tracks frontmatter name and includes compatibility candidates
      const byType = Object.fromEntries(manifest.agents.map((a) => [a.subagentType, a]));

      assert.ok(byType['Backend Architect']);
      assert.equal(byType['Backend Architect'].division, 'engineering');
      assert.equal(byType['Backend Architect'].name, 'Backend Architect');
      assert.equal(byType['Backend Architect'].fileId, 'engineering-backend-architect');
      assert.equal(byType['Backend Architect'].file, 'engineering-backend-architect.md');
      assert.deepEqual(byType['Backend Architect'].subagentTypeCandidates, [
        'Backend Architect',
        'backend-architect',
        'engineering-backend-architect',
      ]);
      assert.equal(byType['Backend Architect'].cursorRule, '@agency-backend-architect.mdc');

      assert.ok(byType['API Tester']);
      assert.equal(byType['API Tester'].division, 'testing');
      assert.deepEqual(byType['API Tester'].subagentTypeCandidates, [
        'API Tester',
        'api-tester',
        'testing-api-tester',
      ]);

      assert.ok(byType['Product Manager']);
      assert.equal(byType['Product Manager'].division, 'product');
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

  describe('pruneSuperpowersSkills', () => {
    /** @type {string} */
    let tmp;

    before(async () => {
      tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'ai-dev-skill-prune-'));
      const root = path.join(tmp, 'skills');
      await fs.mkdir(path.join(root, 'using-superpowers'), { recursive: true });
      await fs.mkdir(path.join(root, 'writing-plans'), { recursive: true });
      await fs.mkdir(path.join(root, 'dispatching-parallel-agents'), { recursive: true });
      await fs.mkdir(path.join(root, 'writing-skills'), { recursive: true });
    });

    after(async () => {
      await fs.rm(tmp, { recursive: true, force: true });
    });

    it('keeps core profile and removes optional skills', async () => {
      const removed = await pruneSuperpowersSkills(path.join(tmp, 'skills'), 'core');
      assert.equal(removed, 2);
      await assert.doesNotReject(fs.access(path.join(tmp, 'skills', 'using-superpowers')));
      await assert.rejects(fs.access(path.join(tmp, 'skills', 'writing-skills')));
    });
  });

  describe('applyAgencyOverlays', () => {
    /** @type {string} */
    let tmp;

    before(async () => {
      tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'ai-dev-overlay-'));
    });

    after(async () => {
      await fs.rm(tmp, { recursive: true, force: true });
    });

    it('patches implementer prompt and appends writing-plans schema', async () => {
      const superRoot = path.join(tmp, 'vendor', 'superpowers');
      const claudeSkills = path.join(tmp, '.claude', 'skills');
      const superSkills = path.join(superRoot, 'skills');
      await fs.mkdir(path.join(superSkills, 'subagent-driven-development'), { recursive: true });
      await fs.mkdir(path.join(superSkills, 'writing-plans'), { recursive: true });
      await fs.mkdir(path.join(claudeSkills, 'subagent-driven-development'), { recursive: true });
      await fs.mkdir(path.join(claudeSkills, 'writing-plans'), { recursive: true });
      const implementer = '# Prompt\n\nTask tool (general-purpose):\n  description: "Implement Task N"\n';
      const plans = '## Intro\n\n## Task Structure\n- path\n';
      await fs.writeFile(
        path.join(superSkills, 'subagent-driven-development', 'implementer-prompt.md'),
        implementer,
        'utf8',
      );
      await fs.writeFile(path.join(superSkills, 'writing-plans', 'SKILL.md'), plans, 'utf8');
      await fs.writeFile(
        path.join(claudeSkills, 'subagent-driven-development', 'implementer-prompt.md'),
        implementer,
        'utf8',
      );
      await fs.writeFile(path.join(claudeSkills, 'writing-plans', 'SKILL.md'), plans, 'utf8');

      await applyAgencyOverlays(superRoot, claudeSkills);

      const implOut = await fs.readFile(
        path.join(superSkills, 'subagent-driven-development', 'implementer-prompt.md'),
        'utf8',
      );
      assert.ok(implOut.includes('<!-- ai-dev-setup-overlay -->'));
      assert.ok(!implOut.includes('Task tool (general-purpose):'));
      const plansOut = await fs.readFile(path.join(superSkills, 'writing-plans', 'SKILL.md'), 'utf8');
      assert.ok(plansOut.includes('ai-dev-setup project schema'));
      assert.ok(plansOut.includes('**agency**'));
      assert.ok(plansOut.includes('**docs**'));
    });
  });

  describe('task guard hook', () => {
    /** @type {string} */
    let tmp;

    before(async () => {
      tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'ai-dev-guard-'));
    });

    after(async () => {
      await fs.rm(tmp, { recursive: true, force: true });
    });

    it('denies general-purpose and allows specialist dispatch', async () => {
      const template = await fs.readFile(
        path.join(
          process.cwd(),
          'src',
          'templates',
          'claude-code',
          'hooks',
          'task-guard.mjs.tmpl',
        ),
        'utf8',
      );
      const rendered = render(template, {
        projectName: 'demo',
        language: 'JavaScript',
        framework: 'None',
        testCmd: 'npm test',
        lintCmd: 'npm run lint',
        buildCmd: 'npm run build',
        database: 'None',
        operatingContract: '',
      });
      const hookPath = path.join(tmp, 'task-guard.mjs');
      await fs.writeFile(hookPath, rendered, 'utf8');

      const denied = spawnSync(
        process.execPath,
        [hookPath],
        { input: JSON.stringify({ tool_input: { subagent_type: 'general-purpose' } }), encoding: 'utf8' },
      );
      assert.equal(denied.status, 0);
      const deniedOut = JSON.parse(denied.stdout.trim());
      assert.equal(deniedOut.hookSpecificOutput.permissionDecision, 'deny');
      assert.match(
        deniedOut.hookSpecificOutput.permissionDecisionReason,
        /general-purpose is forbidden/,
      );

      const allowed = spawnSync(
        process.execPath,
        [hookPath],
        { input: JSON.stringify({ tool_input: { subagent_type: 'Backend Architect' } }), encoding: 'utf8' },
      );
      assert.equal(allowed.status, 0);
      const allowedOut = JSON.parse(allowed.stdout.trim());
      assert.equal(allowedOut.hookSpecificOutput.permissionDecision, 'allow');
    });
  });
});
