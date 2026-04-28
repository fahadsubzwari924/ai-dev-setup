import path from 'node:path';
import { renderFile } from '../core/renderer.js';
import { Platform } from './platform.js';
import { register, TEMPLATES_DIR } from './registry.js';

function tpl(rel) {
  return path.join(TEMPLATES_DIR, rel);
}

export class ClaudeCodePlatform extends Platform {
  constructor() {
    super('claude', 'Claude Code');
  }

  /** @param {Record<string, unknown>} config */
  async getFiles(config) {
    const operatingContract = await renderFile(tpl('shared/operating-contract.md.tmpl'), config);
    const superpowersPreamble = await renderFile(tpl('claude-code/commands/_preamble.md.tmpl'), config);
    const mergedConfig = { ...config, operatingContract, superpowersPreamble };
    const pairs = [
      ['claude-code/claude.md.tmpl', 'CLAUDE.md'],
      ['claude-code/settings.json.tmpl', '.claude/settings.json'],
      ['claude-code/commands/kickoff.md.tmpl', '.claude/commands/kickoff.md'],
      ['claude-code/commands/implement.md.tmpl', '.claude/commands/implement.md'],
      ['claude-code/commands/review.md.tmpl', '.claude/commands/review.md'],
      ['claude-code/commands/ship.md.tmpl', '.claude/commands/ship.md'],
      ['claude-code/hooks/contract.sh.tmpl', '.claude/hooks/contract.sh'],
      ['claude-code/hooks/task-guard.mjs.tmpl', '.claude/hooks/task-guard.mjs'],
      ['ignore/claudeignore.tmpl', '.claudeignore'],
    ];
    const out = [];
    for (const [rel, dest] of pairs) {
      const content = await renderFile(tpl(rel), mergedConfig);
      out.push({ path: dest, content });
    }
    return out;
  }
}

register(new ClaudeCodePlatform());
