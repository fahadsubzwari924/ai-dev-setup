import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { initCommand } from '../src/commands/init.js';

describe('init flags', () => {
  it('rejects --skip-vendor with --vendor-only', async () => {
    await assert.rejects(
      () =>
        initCommand({
          vendorOnly: true,
          skipVendor: true,
          yes: false,
          force: false,
          stack: null,
          platforms: null,
          superpowersRef: null,
          agencyRef: null,
        }),
      /Cannot use --skip-vendor together with --vendor-only/,
    );
  });
});
