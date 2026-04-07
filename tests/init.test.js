import { describe, it, before, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { initCommand } from '../src/commands/init.js';

describe('init command', () => {
  /** @type {string} */
  let tmp;
  /** @type {string} */
  let prevCwd;

  before(() => {
    prevCwd = process.cwd();
  });

  beforeEach(async () => {
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'ai-dev-setup-init-'));
    await fs.writeFile(
      path.join(tmp, 'package.json'),
      JSON.stringify({
        name: 'fixture-app',
        scripts: { test: 'node --test', lint: 'echo lint', build: 'echo build' },
        devDependencies: { typescript: '5.0.0' },
      }),
      'utf8',
    );
    await fs.writeFile(path.join(tmp, 'tsconfig.json'), '{}', 'utf8');
    process.chdir(tmp);
  });

  afterEach(async () => {
    process.chdir(prevCwd);
    await fs.rm(tmp, { recursive: true, force: true });
  });

  it('generates shared and platform files with --yes', async () => {
    await initCommand({
      yes: true,
      force: true,
      skipVendor: true,
      vendorOnly: false,
      stack: null,
      platforms: 'claude,cursor',
      superpowersRef: null,
      agencyRef: null,
      help: false,
      version: false,
    });

    const expected = [
      '.ai/rules.md',
      '.ai/workflow.md',
      '.ai/agents.md',
      'docs/ARCHITECTURE.md',
      'docs/CONVENTIONS.md',
      'docs/TESTING-STRATEGY.md',
      'docs/API-PATTERNS.md',
      'docs/ERROR-HANDLING.md',
      'docs/SECURITY.md',
      'CLAUDE.md',
      '.claude/settings.json',
      '.claude/commands/kickoff.md',
      '.claude/commands/review.md',
      '.claude/commands/ship.md',
      '.cursorrules',
      '.cursor/rules/core-rules.mdc',
      '.cursor/rules/routing.mdc',
      '.cursor/rules/workflow.mdc',
      '.cursor/rules/review.mdc',
      '.cursor/rules/agents.mdc',
      '.claudeignore',
      '.cursorignore',
    ];

    for (const rel of expected) {
      await fs.access(path.join(tmp, rel));
    }

    const claudeMd = await fs.readFile(path.join(tmp, 'CLAUDE.md'), 'utf8');
    const lines = claudeMd.split('\n').length;
    assert.ok(lines < 200, `CLAUDE.md should stay under 200 lines, got ${lines}`);

    const cursorRules = await fs.readFile(path.join(tmp, '.cursorrules'), 'utf8');
    const crLines = cursorRules.split('\n').length;
    assert.ok(crLines < 80, `.cursorrules should stay under 80 lines, got ${crLines}`);

    const core = await fs.readFile(path.join(tmp, '.cursor/rules/core-rules.mdc'), 'utf8');
    const alwaysTrue = (core.match(/alwaysApply:\s*true/g) ?? []).length;
    assert.equal(alwaysTrue, 1);
    assert.ok(core.includes('alwaysApply: true'));

    const gi = await fs.readFile(path.join(tmp, '.gitignore'), 'utf8');
    assert.ok(gi.includes('/vendor/'));
    assert.ok(gi.includes('# --- ai-dev-setup: vendor (managed) ---'));
  });

  it('Claude-only does not emit Cursor files including .cursorignore', async () => {
    await initCommand({
      yes: true,
      force: true,
      skipVendor: true,
      vendorOnly: false,
      stack: null,
      platforms: 'claude',
      superpowersRef: null,
      agencyRef: null,
      help: false,
      version: false,
    });

    await fs.access(path.join(tmp, '.claudeignore'));
    await fs.access(path.join(tmp, 'CLAUDE.md'));
    await assert.rejects(() => fs.access(path.join(tmp, '.cursorignore')), { code: 'ENOENT' });
    await assert.rejects(() => fs.access(path.join(tmp, '.cursorrules')), { code: 'ENOENT' });
  });

  it('Cursor-only does not emit Claude files including .claudeignore', async () => {
    await initCommand({
      yes: true,
      force: true,
      skipVendor: true,
      vendorOnly: false,
      stack: null,
      platforms: 'cursor',
      superpowersRef: null,
      agencyRef: null,
      help: false,
      version: false,
    });

    await fs.access(path.join(tmp, '.cursorignore'));
    await fs.access(path.join(tmp, '.cursorrules'));
    await assert.rejects(() => fs.access(path.join(tmp, '.claudeignore')), { code: 'ENOENT' });
    await assert.rejects(() => fs.access(path.join(tmp, 'CLAUDE.md')), { code: 'ENOENT' });
  });

  it('dedupes duplicate platforms in --platforms', async () => {
    await initCommand({
      yes: true,
      force: true,
      skipVendor: true,
      vendorOnly: false,
      stack: null,
      platforms: 'claude,claude,cursor',
      superpowersRef: null,
      agencyRef: null,
      help: false,
      version: false,
    });

    await fs.access(path.join(tmp, '.claudeignore'));
    await fs.access(path.join(tmp, '.cursorignore'));
  });
});
