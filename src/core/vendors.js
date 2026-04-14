import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { assertSafeGitRef } from './git-ref.js';
import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';

export const SUPERPOWERS_GIT_URL = 'https://github.com/obra/superpowers.git';
export const AGENCY_GIT_URL = 'https://github.com/msitarzewski/agency-agents.git';

export const VENDOR_SUPERPOWERS = path.join('vendor', 'superpowers');
export const VENDOR_AGENCY = path.join('vendor', 'agency-agents');

/** Same division roots as agency-agents `scripts/install.sh` install_claude_code */
export const AGENCY_CLAUDE_DIVISIONS = [
  'academic',
  'design',
  'engineering',
  'game-development',
  'marketing',
  'paid-media',
  'sales',
  'product',
  'project-management',
  'testing',
  'support',
  'spatial-computing',
  'specialized',
];

/**
 * @param {string} command
 * @param {string[]} args
 * @param {{ cwd?: string }} [opts]
 */
export function runProcess(command, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: opts.cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout?.on('data', (c) => {
      stdout += c;
    });
    child.stderr?.on('data', (c) => {
      stderr += c;
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(
          new Error(
            `${command} ${args.join(' ')} exited with code ${code}\n${stderr || stdout}`.trim(),
          ),
        );
      }
    });
  });
}

async function assertGitAvailable() {
  try {
    await runProcess('git', ['--version']);
  } catch {
    throw new Error('git is required on PATH to vendor Superpowers and Agency Agents.');
  }
}

async function assertBashAvailable() {
  try {
    await runProcess('bash', ['--version']);
  } catch {
    throw new Error('bash is required on PATH to run vendor/agency-agents/scripts/convert.sh.');
  }
}

/**
 * @param {string} cwd
 * @param {string} relDir
 * @param {string} url
 * @param {string} ref
 * @param {boolean} force
 */
async function gitShallowClone(cwd, relDir, url, ref, force) {
  const target = path.join(cwd, relDir);
  try {
    await fs.access(target);
    if (force) {
      await fs.rm(target, { recursive: true, force: true });
    } else {
      return { skipped: true, path: relDir };
    }
  } catch {
    /* missing */
  }
  await fs.mkdir(path.dirname(target), { recursive: true });
  await runProcess('git', ['clone', '--depth', '1', '--branch', ref, url, target], { cwd });
  return { skipped: false, path: relDir };
}

/**
 * Directories within the Superpowers repo that consumer projects actually need.
 * TypeScript source files in other directories (e.g. example .ts files with
 * internal path aliases) are intentionally excluded to avoid breaking the
 * consumer's TypeScript compiler.
 */
const SUPERPOWERS_NEEDED_DIRS = ['skills', 'hooks', '.cursor-plugin'];
const TYPESCRIPT_FILE_RE = /\.(?:[cm]?ts|tsx)$/i;

/**
 * Remove TypeScript source/example files from a tree copied from upstream
 * so consumer TypeScript compilers do not try to resolve upstream-only aliases.
 *
 * @param {string} rootDir
 */
export async function removeTypeScriptFilesRecursive(rootDir) {
  let entries;
  try {
    entries = await fs.readdir(rootDir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const ent of entries) {
    const full = path.join(rootDir, ent.name);
    if (ent.isDirectory()) {
      await removeTypeScriptFilesRecursive(full);
      continue;
    }
    if (ent.isFile() && TYPESCRIPT_FILE_RE.test(ent.name)) {
      await fs.rm(full, { force: true });
    }
  }
}

/**
 * Clone the Superpowers repo into a temp directory, copy only the directories
 * that consumer projects need, strip TypeScript source/example files from
 * vendored skills, then delete the temp clone. This ensures no raw upstream
 * TypeScript files land inside the consumer project and get picked up by the
 * consumer's TypeScript compiler.
 *
 * @param {string} cwd  project root
 * @param {string} relDir  relative destination e.g. vendor/superpowers
 * @param {string} url
 * @param {string} ref  git branch/tag
 * @param {boolean} force  overwrite if already present
 */
async function cloneSuperpowersFiltered(cwd, relDir, url, ref, force) {
  const target = path.join(cwd, relDir);
  try {
    await fs.access(target);
    if (force) {
      await fs.rm(target, { recursive: true, force: true });
    } else {
      return { skipped: true, path: relDir };
    }
  } catch {
    /* missing — proceed */
  }

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ai-dev-setup-'));
  try {
    const tmpClone = path.join(tmpDir, 'superpowers');
    await runProcess('git', ['clone', '--depth', '1', '--branch', ref, url, tmpClone]);
    await fs.mkdir(target, { recursive: true });
    for (const dir of SUPERPOWERS_NEEDED_DIRS) {
      const src = path.join(tmpClone, dir);
      try {
        await fs.access(src);
        await fs.cp(src, path.join(target, dir), { recursive: true });
      } catch {
        /* directory absent in upstream repo — skip */
      }
    }
    await removeTypeScriptFilesRecursive(path.join(target, 'skills'));
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }

  return { skipped: false, path: relDir };
}

/**
 * Rewrite Superpowers .cursor-plugin paths for workspace-root install.
 * @param {Record<string, unknown>} plugin
 * @param {string} posixPrefix e.g. ./vendor/superpowers/
 */
export function rewriteSuperpowersCursorPlugin(plugin, posixPrefix) {
  const out = { ...plugin };
  for (const key of ['skills', 'agents', 'commands', 'hooks']) {
    const v = out[key];
    if (typeof v === 'string' && v.startsWith('./')) {
      const rest = v.slice(2);
      out[key] = `${posixPrefix}${rest}`.replace(/\/{2,}/g, '/');
    }
  }
  return out;
}

/**
 * @param {string} filePath
 */
export async function markdownStartsWithFrontmatter(filePath) {
  const rl = createInterface({ input: createReadStream(filePath), crlfDelay: Infinity });
  try {
    for await (const line of rl) {
      return line.trimStart().startsWith('---');
    }
  } finally {
    rl.close();
  }
  return false;
}

/**
 * Read the YAML frontmatter block of a markdown file and return a flat key/value map.
 * Supports only `key: value` lines — no nested YAML, no multiline values.
 * Returns an empty object if the file has no frontmatter.
 * @param {string} filePath
 */
export async function readMarkdownFrontmatter(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  if (!content.startsWith('---')) return {};
  const end = content.indexOf('\n---', 3);
  if (end < 0) return {};
  const block = content.slice(3, end).replace(/^\r?\n/, '');
  /** @type {Record<string, string>} */
  const out = {};
  for (const rawLine of block.split(/\r?\n/)) {
    const line = rawLine.trimEnd();
    if (!line || line.startsWith('#')) continue;
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_-]*):\s*(.*)$/);
    if (!m) continue;
    let value = m[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[m[1]] = value;
  }
  return out;
}

/**
 * Scan `.claude/agents/` and write `_index.json` mapping each present agent file
 * to its `subagent_type` (filename minus `.md`), division, and frontmatter metadata.
 *
 * This is the **authoritative** manifest for Claude Code dispatch. Templates reference
 * it as the source of truth so that if upstream Agency renames files, the index still
 * reflects reality and templates can be matched at dispatch time.
 *
 * @param {string} projectRoot
 * @returns {Promise<number>} number of agents indexed
 */
export async function writeAgencyIndex(projectRoot) {
  const agentsDir = path.join(projectRoot, '.claude', 'agents');
  let entries;
  try {
    entries = await fs.readdir(agentsDir, { withFileTypes: true });
  } catch {
    return 0;
  }
  /** @type {Array<{ file: string, subagentType: string, division: string|null, name: string, description: string }>} */
  const agents = [];
  for (const ent of entries) {
    if (!ent.isFile() || !ent.name.endsWith('.md')) continue;
    if (ent.name === '_index.json' || ent.name.startsWith('_')) continue;
    const full = path.join(agentsDir, ent.name);
    if (!(await markdownStartsWithFrontmatter(full))) continue;
    const fm = await readMarkdownFrontmatter(full);
    const base = ent.name.slice(0, -3);
    const divMatch = base.match(/^([a-z0-9]+)-/);
    agents.push({
      file: ent.name,
      subagentType: base,
      division: divMatch ? divMatch[1] : null,
      name: fm.name || base,
      description: fm.description || '',
    });
  }
  agents.sort((a, b) => a.subagentType.localeCompare(b.subagentType));
  const manifest = {
    generatedAt: new Date().toISOString(),
    source: 'ai-dev-setup',
    note: 'Authoritative map of Agency agents present in .claude/agents/. `subagentType` is the exact string to pass to Claude Code Task tool. Regenerated by `ai-dev-setup init --vendor-only`.',
    count: agents.length,
    agents,
  };
  await fs.writeFile(
    path.join(agentsDir, '_index.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8',
  );
  return agents.length;
}

/**
 * @param {string} agencyRepoRoot vendor/agency-agents absolute
 * @param {string} projectRoot
 * @param {boolean} force
 */
export async function copyAgencyClaudeAgents(agencyRepoRoot, projectRoot, force) {
  const dest = path.join(projectRoot, '.claude', 'agents');
  await fs.mkdir(dest, { recursive: true });
  let count = 0;
  for (const division of AGENCY_CLAUDE_DIVISIONS) {
    const divPath = path.join(agencyRepoRoot, division);
    let stat;
    try {
      stat = await fs.stat(divPath);
    } catch {
      continue;
    }
    if (!stat.isDirectory()) continue;
    count += await copyMarkdownAgentsFromTree(divPath, dest, force);
  }
  return count;
}

/**
 * @param {string} dir
 * @param {string} destDir
 * @param {boolean} force
 */
async function copyMarkdownAgentsFromTree(dir, destDir, force) {
  let n = 0;
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      n += await copyMarkdownAgentsFromTree(full, destDir, force);
    } else if (ent.isFile() && ent.name.endsWith('.md')) {
      if (!(await markdownStartsWithFrontmatter(full))) continue;
      const destFile = path.join(destDir, ent.name);
      if (!force) {
        try {
          await fs.access(destFile);
          continue;
        } catch {
          /* ok */
        }
      }
      await fs.copyFile(full, destFile);
      n++;
    }
  }
  return n;
}

/**
 * @param {string} integrationsRulesDir
 * @param {string} projectRulesDir .cursor/rules
 * @param {boolean} force overwrite agency-*.mdc
 */
export async function copyAgencyCursorRules(integrationsRulesDir, projectRulesDir, force) {
  let count = 0;
  try {
    await fs.access(integrationsRulesDir);
  } catch {
    return 0;
  }
  const files = await fs.readdir(integrationsRulesDir);
  for (const name of files) {
    if (!name.endsWith('.mdc')) continue;
    const prefixed = name.startsWith('agency-') ? name : `agency-${name}`;
    const src = path.join(integrationsRulesDir, name);
    const dest = path.join(projectRulesDir, prefixed);
    if (!force) {
      try {
        await fs.access(dest);
        continue;
      } catch {
        /* copy */
      }
    }
    await fs.mkdir(projectRulesDir, { recursive: true });
    await fs.copyFile(src, dest);
    count++;
  }
  return count;
}

/**
 * @param {string} skillsRoot vendor/superpowers/skills
 * @param {string} destRoot .claude/skills
 * @param {boolean} force
 */
export async function copySuperpowersSkills(skillsRoot, destRoot, force) {
  let count = 0;
  let rootStat;
  try {
    rootStat = await fs.stat(skillsRoot);
  } catch {
    throw new Error(`Superpowers skills directory missing: ${skillsRoot}`);
  }
  if (!rootStat.isDirectory()) {
    throw new Error(`Superpowers skills path is not a directory: ${skillsRoot}`);
  }
  const skillDirs = await fs.readdir(skillsRoot, { withFileTypes: true });
  for (const ent of skillDirs) {
    if (!ent.isDirectory()) continue;
    const src = path.join(skillsRoot, ent.name);
    const dest = path.join(destRoot, ent.name);
    if (!force) {
      try {
        await fs.access(dest);
        continue;
      } catch {
        /* copy */
      }
    } else {
      await fs.rm(dest, { recursive: true, force: true });
    }
    await fs.cp(src, dest, { recursive: true });
    count++;
  }
  return count;
}

/**
 * @param {string} projectRoot
 * @param {string} superpowersRoot absolute vendor/superpowers
 */
export async function writeSuperpowersCursorPluginFile(projectRoot, superpowersRoot) {
  const pluginSrc = path.join(superpowersRoot, '.cursor-plugin', 'plugin.json');
  const raw = await fs.readFile(pluginSrc, 'utf8');
  const plugin = JSON.parse(raw);
  const rewritten = rewriteSuperpowersCursorPlugin(plugin, './vendor/superpowers/');
  const hooksRel = rewritten.hooks;
  if (typeof hooksRel === 'string') {
    const rel = hooksRel.replace(/^\.\//, '');
    const hooksAbs = path.join(projectRoot, rel);
    try {
      await fs.access(hooksAbs);
    } catch {
      throw new Error(`Superpowers Cursor hooks file missing after clone: ${hooksRel}`);
    }
  }
  const outDir = path.join(projectRoot, '.cursor-plugin');
  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(path.join(outDir, 'plugin.json'), `${JSON.stringify(rewritten, null, 2)}\n`, 'utf8');
}

/**
 * @param {object} options
 * @param {string[]} options.platformKeys
 * @param {boolean} options.force
 * @param {string} options.superpowersRef
 * @param {string} options.agencyRef
 * @returns {Promise<string[]>} log lines
 */
export async function installVendors(projectRoot, options) {
  const { platformKeys, force } = options;
  const superpowersRef = assertSafeGitRef(
    options.superpowersRef != null && options.superpowersRef !== ''
      ? String(options.superpowersRef)
      : 'main',
  );
  const agencyRef = assertSafeGitRef(
    options.agencyRef != null && options.agencyRef !== '' ? String(options.agencyRef) : 'main',
  );
  const wantClaude = platformKeys.includes('claude');
  const wantCursor = platformKeys.includes('cursor');
  const lines = [];

  await assertGitAvailable();

  const spRel = VENDOR_SUPERPOWERS;
  const agRel = VENDOR_AGENCY;

  const sp = await cloneSuperpowersFiltered(projectRoot, spRel, SUPERPOWERS_GIT_URL, superpowersRef, force);
  lines.push(sp.skipped ? `${sp.path} (already present, skipped clone — use --force to refresh)` : `+ ${sp.path} (cloned, filtered to needed directories only)`);

  const ag = await gitShallowClone(projectRoot, agRel, AGENCY_GIT_URL, agencyRef, force);
  lines.push(ag.skipped ? `${ag.path} (already present, skipped clone — use --force to refresh)` : `+ ${ag.path} (cloned)`);

  const superAbs = path.join(projectRoot, spRel);
  const agencyAbs = path.join(projectRoot, agRel);

  if (wantCursor) {
    await writeSuperpowersCursorPluginFile(projectRoot, superAbs);
    lines.push('+ .cursor-plugin/plugin.json (Superpowers paths → vendor/superpowers)');
  }

  if (wantClaude) {
    const n = await copySuperpowersSkills(path.join(superAbs, 'skills'), path.join(projectRoot, '.claude', 'skills'), force);
    lines.push(`+ .claude/skills (${n} skill trees from Superpowers)`);
  }

  if (wantCursor) {
    await assertBashAvailable();
    lines.push('… running vendor/agency-agents/scripts/convert.sh (may take a minute)');
    await runProcess('bash', ['scripts/convert.sh'], { cwd: agencyAbs });
    const rulesSrc = path.join(agencyAbs, 'integrations', 'cursor', 'rules');
    const rulesDest = path.join(projectRoot, '.cursor', 'rules');
    const n = await copyAgencyCursorRules(rulesSrc, rulesDest, force);
    if (n === 0) {
      throw new Error(
        'Agency Cursor rules not found after convert.sh. Expected integrations/cursor/rules/*.mdc',
      );
    }
    lines.push(`+ .cursor/rules (agency-*.mdc × ${n})`);
  }

  if (wantClaude) {
    const n = await copyAgencyClaudeAgents(agencyAbs, projectRoot, force);
    if (n === 0) {
      throw new Error('No Agency agent markdown files were copied to .claude/agents/. Check vendor/agency-agents layout.');
    }
    lines.push(`+ .claude/agents (${n} agent files from Agency)`);
    const indexed = await writeAgencyIndex(projectRoot);
    lines.push(`+ .claude/agents/_index.json (${indexed} agents indexed — authoritative subagent_type map)`);
  }

  return lines;
}
