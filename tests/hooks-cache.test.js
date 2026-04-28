import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

describe('hooks cache invariants', () => {
  it('contract hook output is byte-stable for code prompts', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'ai-dev-hook-cache-'));
    try {
      const src = path.join(
        process.cwd(),
        'src',
        'templates',
        'claude-code',
        'hooks',
        'contract.sh.tmpl',
      );
      const hookPath = path.join(tmp, 'contract.sh');
      await fs.copyFile(src, hookPath);
      await fs.chmod(hookPath, 0o755);

      const run = (stamp) =>
        spawnSync('bash', [hookPath], {
          input: JSON.stringify({ prompt: 'implement endpoint health check' }),
          encoding: 'utf8',
          env: {
            ...process.env,
            FAKE_TIMESTAMP: stamp,
          },
        }).stdout;

      const a = run('2026-04-28T12:00:00Z');
      const b = run('2027-01-01T01:00:00Z');
      assert.equal(a, b);
      assert.match(a, /hookSpecificOutput/);
    } finally {
      await fs.rm(tmp, { recursive: true, force: true });
    }
  });
});
