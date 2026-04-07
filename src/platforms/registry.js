import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderFile } from '../core/renderer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');

/** @type {Map<string, import('./platform.js').Platform>} */
const platforms = new Map();

/** @param {import('./platform.js').Platform} platform */
export function register(platform) {
  platforms.set(platform.key, platform);
}

/** @param {string} key */
export function getPlatform(key) {
  return platforms.get(key);
}

export function getAllPlatforms() {
  return [...platforms.values()];
}

/** @param {string} rel */
function tpl(rel) {
  return path.join(TEMPLATES_DIR, rel);
}

/**
 * Shared artifacts for every run (.ai/, docs/). Tool-specific ignores live under each platform.
 * @param {Record<string, unknown>} config
 */
export async function getSharedFiles(config) {
  /** @type {Array<{ template: string, out: string }>} */
  const map = [
    { template: 'shared/rules.md.tmpl', out: '.ai/rules.md' },
    { template: 'shared/workflow.md.tmpl', out: '.ai/workflow.md' },
    { template: 'shared/agents.md.tmpl', out: '.ai/agents.md' },
    { template: 'shared/docs/architecture.md.tmpl', out: 'docs/ARCHITECTURE.md' },
    { template: 'shared/docs/conventions.md.tmpl', out: 'docs/CONVENTIONS.md' },
    { template: 'shared/docs/testing.md.tmpl', out: 'docs/TESTING-STRATEGY.md' },
    { template: 'shared/docs/api-patterns.md.tmpl', out: 'docs/API-PATTERNS.md' },
    { template: 'shared/docs/error-handling.md.tmpl', out: 'docs/ERROR-HANDLING.md' },
    { template: 'shared/docs/security.md.tmpl', out: 'docs/SECURITY.md' },
  ];

  const out = [];
  for (const { template, out: dest } of map) {
    const content = await renderFile(tpl(template), config);
    out.push({ path: dest, content });
  }
  return out;
}
