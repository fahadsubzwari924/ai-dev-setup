import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { render } from '../src/core/renderer.js';

const base = {
  projectName: 'p',
  language: 'TypeScript',
  framework: 'Next.js',
  testCmd: 'npm test',
  lintCmd: 'npm run lint',
  buildCmd: 'npm run build',
  database: 'PostgreSQL',
  stacks: ['ts', 'nextjs'],
};

describe('renderer', () => {
  it('replaces known placeholders', () => {
    const out = render('{{PROJECT_NAME}} {{LANGUAGE}} {{UNKNOWN}}', base);
    assert.equal(out, 'p TypeScript {{UNKNOWN}}');
  });

  it('includes IF_TYPESCRIPT block when language matches', () => {
    const t = '{{#IF_TYPESCRIPT}}TS{{/IF_TYPESCRIPT}}{{#IF_PYTHON}}PY{{/IF_PYTHON}}';
    assert.equal(render(t, base), 'TS');
  });

  it('includes stack-based conditionals', () => {
    const t = '{{#IF_NEXTJS}}N{{/IF_NEXTJS}}{{#IF_NESTJS}}S{{/IF_NESTJS}}';
    assert.equal(render(t, base), 'N');
  });

});
