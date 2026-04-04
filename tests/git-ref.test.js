import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { assertSafeGitRef } from '../src/core/git-ref.js';

describe('git-ref', () => {
  it('accepts main, tags, and branch-like names', () => {
    assert.equal(assertSafeGitRef('main'), 'main');
    assert.equal(assertSafeGitRef('v5.0.7'), 'v5.0.7');
    assert.equal(assertSafeGitRef('feature/foo-bar'), 'feature/foo-bar');
    assert.equal(assertSafeGitRef('  main  '), 'main');
  });

  it('rejects empty', () => {
    assert.throws(() => assertSafeGitRef(''), /non-empty/);
    assert.throws(() => assertSafeGitRef(null), /non-empty/);
  });

  it('rejects path traversal and option-like refs', () => {
    assert.throws(() => assertSafeGitRef('foo..bar'), /Invalid git ref/);
    assert.throws(() => assertSafeGitRef('--help'), /Invalid git ref/);
    assert.throws(() => assertSafeGitRef('-main'), /Invalid git ref/);
  });

  it('rejects shell metacharacters', () => {
    assert.throws(() => assertSafeGitRef('foo;rm -rf'), /Invalid git ref/);
    assert.throws(() => assertSafeGitRef('foo$(x)'), /Invalid git ref/);
  });

  it('rejects excessive length', () => {
    assert.throws(() => assertSafeGitRef('a'.repeat(300)), /maximum length/);
  });
});
