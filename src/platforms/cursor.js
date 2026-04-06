import path from 'node:path';
import { renderFile } from '../core/renderer.js';
import { Platform } from './platform.js';
import { register, TEMPLATES_DIR } from './registry.js';

function tpl(rel) {
  return path.join(TEMPLATES_DIR, rel);
}

export class CursorPlatform extends Platform {
  constructor() {
    super('cursor', 'Cursor');
  }

  /** @param {Record<string, unknown>} config */
  async getFiles(config) {
    const pairs = [
      ['cursor/cursorrules.tmpl', '.cursorrules'],
      ['cursor/rules/core-rules.mdc.tmpl', '.cursor/rules/core-rules.mdc'],
      ['cursor/rules/routing.mdc.tmpl', '.cursor/rules/routing.mdc'],
      ['cursor/rules/workflow.mdc.tmpl', '.cursor/rules/workflow.mdc'],
      ['cursor/rules/review.mdc.tmpl', '.cursor/rules/review.mdc'],
      ['cursor/rules/agents.mdc.tmpl', '.cursor/rules/agents.mdc'],
    ];
    const out = [];
    for (const [rel, dest] of pairs) {
      const content = await renderFile(tpl(rel), config);
      out.push({ path: dest, content });
    }
    return out;
  }
}

register(new CursorPlatform());
