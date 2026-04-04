import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
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

  const sp = await gitShallowClone(projectRoot, spRel, SUPERPOWERS_GIT_URL, superpowersRef, force);
  lines.push(sp.skipped ? `${sp.path} (already present, skipped clone — use --force to refresh)` : `+ ${sp.path} (cloned)`);

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
  }

  return lines;
}
