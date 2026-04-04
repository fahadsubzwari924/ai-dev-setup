import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { detectProject } from '../src/core/detector.js';

describe('detector', () => {
  /** @type {string} */
  let tmp;

  before(async () => {
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'ai-dev-setup-det-'));
  });

  after(async () => {
    await fs.rm(tmp, { recursive: true, force: true });
  });

  it('detects TypeScript + Next from package.json and tsconfig', async () => {
    const dir = path.join(tmp, 'next');
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(
      path.join(dir, 'package.json'),
      JSON.stringify({
        name: 'web',
        dependencies: { next: '14.0.0', react: '18.0.0' },
        scripts: { test: 'pnpm test', lint: 'pnpm lint', build: 'pnpm build' },
      }),
      'utf8',
    );
    await fs.writeFile(path.join(dir, 'tsconfig.json'), '{}', 'utf8');
    await fs.writeFile(path.join(dir, 'next.config.js'), 'module.exports = {}', 'utf8');

    const d = await detectProject(dir);
    assert.equal(d.name, 'web');
    assert.ok(d.detectedStack.includes('ts'));
    assert.ok(d.detectedStack.includes('nextjs'));
    assert.ok(d.detectedStack.includes('react'));
    assert.equal(d.language, 'TypeScript');
    assert.equal(d.framework, 'Next.js');
    assert.equal(d.testCmd, 'pnpm test');
  });

  it('detects Python project', async () => {
    const dir = path.join(tmp, 'py');
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, 'pyproject.toml'), '[project]\nname="x"\n', 'utf8');
    const d = await detectProject(dir);
    assert.ok(d.detectedStack.includes('python'));
    assert.equal(d.language, 'Python');
  });

  it('detects Go module', async () => {
    const dir = path.join(tmp, 'go');
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, 'go.mod'), 'module example.com/m\n', 'utf8');
    const d = await detectProject(dir);
    assert.ok(d.detectedStack.includes('go'));
    assert.equal(d.language, 'Go');
  });

  it('detects NestJS via nest-cli.json', async () => {
    const dir = path.join(tmp, 'nest');
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, 'package.json'), JSON.stringify({ name: 'n' }), 'utf8');
    await fs.writeFile(path.join(dir, 'nest-cli.json'), '{}', 'utf8');
    await fs.writeFile(path.join(dir, 'tsconfig.json'), '{}', 'utf8');
    const d = await detectProject(dir);
    assert.ok(d.detectedStack.includes('nestjs'));
    assert.equal(d.framework, 'NestJS');
  });
});
