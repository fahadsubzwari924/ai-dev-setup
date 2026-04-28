import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseArgv } from '../src/cli/index.js';

describe('cli', () => {
  it('parses --skills flag', () => {
    const { flags } = parseArgv(['init', '--skills=full']);
    assert.equal(flags.skills, 'full');
  });

  it('rejects invalid --skills value', () => {
    assert.throws(() => parseArgv(['init', '--skills=bad']), /Invalid --skills value/);
  });
});
