import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getPlatform } from '../src/platforms/registry.js';
import '../src/platforms/claude-code.js';
import '../src/platforms/cursor.js';

const sampleConfig = {
  projectName: 'demo',
  language: 'TypeScript',
  framework: 'Next.js',
  testCmd: 'npm test',
  lintCmd: 'npm run lint',
  buildCmd: 'npm run build',
  database: 'PostgreSQL',
  stacks: ['ts', 'nextjs'],
};

describe('platforms', () => {
  it('claude platform returns expected paths', async () => {
    const p = getPlatform('claude');
    assert.ok(p);
    const files = await p.getFiles(sampleConfig);
    const paths = files.map((f) => f.path).sort();
    assert.deepEqual(paths, [
      '.claude/commands/implement.md',
      '.claude/commands/kickoff.md',
      '.claude/commands/review.md',
      '.claude/commands/ship.md',
      '.claude/hooks/contract.sh',
      '.claude/hooks/task-guard.mjs',
      '.claude/settings.json',
      '.claudeignore',
      'CLAUDE.md',
    ]);
    const claudeMd = files.find((f) => f.path === 'CLAUDE.md');
    assert.ok(claudeMd, 'expected CLAUDE.md');
    assert.ok(claudeMd.content.includes('Operating contract'), 'CLAUDE.md should point to contract');
    const settings = files.find((f) => f.path === '.claude/settings.json');
    assert.ok(settings, 'expected .claude/settings.json');
    const settingsJson = JSON.parse(settings.content);
    assert.ok(settingsJson.hooks?.SessionStart, 'settings should register SessionStart hooks');
    assert.ok(settingsJson.hooks?.UserPromptSubmit, 'settings should register UserPromptSubmit');
    assert.ok(settingsJson.hooks?.PreToolUse, 'settings should register PreToolUse');
    const ss = settingsJson.hooks.SessionStart[0];
    assert.ok(ss.matcher, 'SessionStart should have matcher');
    assert.match(ss.matcher, /startup/);
    const cmd = ss.hooks[0].command;
    assert.ok(
      cmd.includes('session-start') && cmd.includes('CLAUDE_PROJECT_DIR'),
      'SessionStart command should invoke vendored session-start via project dir',
    );
    const ups = settingsJson.hooks.UserPromptSubmit[0]?.hooks?.[0]?.command || '';
    assert.ok(ups.includes('.claude/hooks/contract.sh'), 'UserPromptSubmit should call contract hook');
    const preTask = settingsJson.hooks.PreToolUse.find((h) => h.matcher === 'Task');
    assert.ok(preTask, 'PreToolUse should include Task matcher');
    const preTaskCmd = preTask.hooks?.[0]?.command || '';
    assert.ok(preTaskCmd.includes('.claude/hooks/task-guard.mjs'));
    const kickoff = files.find((f) => f.path === '.claude/commands/kickoff.md');
    assert.ok(kickoff?.content.includes('Run these before continuing'), 'kickoff should include shared preamble');
    const implement = files.find((f) => f.path === '.claude/commands/implement.md');
    assert.ok(
      implement?.content.includes('verification-before-completion'),
      'implement should require verification skill',
    );
  });

  it('cursor platform returns expected paths and MDC frontmatter', async () => {
    const p = getPlatform('cursor');
    assert.ok(p);
    const files = await p.getFiles(sampleConfig);
    const paths = files.map((f) => f.path).sort();
    assert.deepEqual(paths, [
      '.cursor/rules/agents.mdc',
      '.cursor/rules/core-rules.mdc',
      '.cursor/rules/dispatch-guard.mdc',
      '.cursor/rules/review.mdc',
      '.cursor/rules/routing.mdc',
      '.cursor/rules/workflow.mdc',
      '.cursorignore',
      '.cursorrules',
    ]);
    const core = files.find((f) => f.path === '.cursor/rules/core-rules.mdc');
    assert.ok(core, 'expected .cursor/rules/core-rules.mdc');
    assert.ok(core.content.startsWith('---'));
    assert.match(core.content, /alwaysApply:\s*true/);
    const workflow = files.find((f) => f.path === '.cursor/rules/workflow.mdc');
    assert.ok(workflow, 'expected .cursor/rules/workflow.mdc');
    assert.match(workflow.content, /alwaysApply:\s*false/);
    const routing = files.find((f) => f.path === '.cursor/rules/routing.mdc');
    assert.ok(routing, 'expected .cursor/rules/routing.mdc');
    assert.ok(routing.content.startsWith('---'));
    assert.match(routing.content, /alwaysApply:\s*false/);
    const cursorrules = files.find((f) => f.path === '.cursorrules');
    assert.ok(cursorrules?.content.includes('<SYSTEM-CONTRACT'), '.cursorrules should embed operating contract');
  });
});
