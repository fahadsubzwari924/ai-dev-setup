import process from 'node:process';
import { DEFAULTS, PLATFORMS, STACKS } from '../constants.js';
import { detectProject } from '../core/detector.js';
import { writeFiles } from '../core/writer.js';
import { getSharedFiles, getPlatform } from '../platforms/registry.js';
import '../platforms/claude-code.js';
import '../platforms/cursor.js';
import { bold, dim, green, red, yellow } from '../cli/logger.js';
import { selectMulti, textPrompt } from '../cli/prompts.js';
import { installVendors } from '../core/vendors.js';
import { ensureVendorDirGitignored } from '../core/gitignore-vendor.js';

const STACK_KEYS = new Set(STACKS.map((s) => s.key));
const PLATFORM_KEYS = new Set(PLATFORMS.map((p) => p.key));

/** @param {string|null|undefined} s */
function parseList(s) {
  if (s == null || s === '') return [];
  return s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
}

/** @param {string|null|undefined} flag */
function parseStacksFlag(flag) {
  return parseList(flag).filter((k) => {
    if (!STACK_KEYS.has(k)) {
      throw new Error(`Unknown stack key: ${k}. Valid: ${[...STACK_KEYS].join(', ')}`);
    }
    return true;
  });
}

/** @param {string|null|undefined} flag */
function parsePlatformsFlag(flag) {
  const keys = parseList(flag);
  if (keys.length === 0) return ['claude', 'cursor'];
  for (const k of keys) {
    if (!PLATFORM_KEYS.has(k)) {
      throw new Error(`Unknown platform: ${k}. Valid: ${[...PLATFORM_KEYS].join(', ')}`);
    }
  }
  return keys;
}

/** @param {string|null} language */
function fallbackStacks(language) {
  if (language === 'TypeScript' || language === 'JavaScript') return ['ts'];
  if (language === 'Python') return ['python'];
  if (language === 'Go') return ['go'];
  if (language === 'Dart') return ['flutter'];
  return ['ts'];
}

/** @param {Awaited<ReturnType<typeof detectProject>>} detected */
function buildConfig(detected, stacks) {
  return {
    projectName: detected.name ?? DEFAULTS.projectName,
    language: detected.language ?? DEFAULTS.language,
    framework: detected.framework ?? DEFAULTS.framework,
    testCmd: detected.testCmd ?? DEFAULTS.testCmd,
    lintCmd: detected.lintCmd ?? DEFAULTS.lintCmd,
    buildCmd: detected.buildCmd ?? DEFAULTS.buildCmd,
    database: detected.database ?? DEFAULTS.database,
    stacks,
  };
}

function formatDetectedLine(detected) {
  const stackStr =
    detected.detectedStack.length > 0 ? detected.detectedStack.join(' + ') : 'unknown stack';
  const name = detected.name ?? DEFAULTS.projectName;
  return `${stackStr} project "${name}"`;
}

/**
 * @typedef {object} InitFlags
 * @property {boolean} [yes]
 * @property {boolean} [force]
 * @property {boolean} [skipVendor]
 * @property {boolean} [vendorOnly]
 * @property {string|null} [stack]
 * @property {string|null} [platforms]
 * @property {string|null} [superpowersRef]
 * @property {string|null} [agencyRef]
 */

/**
 * @param {InitFlags & Record<string, unknown>} flags
 */
function resolveVendorRefs(flags) {
  return {
    superpowersRef:
      flags.superpowersRef != null && flags.superpowersRef !== ''
        ? String(flags.superpowersRef)
        : 'main',
    agencyRef:
      flags.agencyRef != null && flags.agencyRef !== '' ? String(flags.agencyRef) : 'main',
  };
}

/**
 * @param {string} cwd
 * @param {string[]} platformKeys
 * @param {InitFlags & Record<string, unknown>} flags
 */
async function executeVendorInstall(cwd, platformKeys, flags) {
  const { superpowersRef, agencyRef } = resolveVendorRefs(flags);
  const vendorLog = await installVendors(cwd, {
    platformKeys,
    force: Boolean(flags.force),
    superpowersRef,
    agencyRef,
  });
  for (const line of vendorLog) {
    console.log(`  ${line}`);
  }
  console.log('');
  console.log(green('✅ Vendor install complete.'));
}

function printAfterFullInit() {
  console.log('');
  console.log(bold('Next steps:'));
  console.log('  1. Review docs/ARCHITECTURE.md — fill in your system design');
  console.log('  2. Review .ai/rules.md — adjust coding preferences if needed');
  console.log('  3. Commit scaffold files to your repo (see README for team workflow and vendor/ options)');
  console.log('  4. Open in Claude Code or Cursor — Superpowers + Agency are wired in-project');
  console.log('');
}

function printAfterVendorOnly() {
  console.log('');
  console.log(bold('Next steps:'));
  console.log('  1. Confirm vendor/superpowers and vendor/agency-agents exist');
  console.log('  2. Open in Claude Code or Cursor');
  console.log('  3. Pin refs in your npm script for reproducible clones (see README)');
  console.log('');
}

/**
 * @param {string} cwd
 */
async function syncVendorGitignore(cwd) {
  const r = await ensureVendorDirGitignored(cwd, {
    onWarn: (msg) => console.log(`  ${yellow('!')} ${msg}`),
  });
  if (r.action === 'error') return;
  if (r.action === 'noop_already_ignored' || r.action === 'noop_managed_ok') {
    console.log(`  ${dim('o')} .gitignore (already ignores vendor/)`);
    return;
  }
  console.log(`  ${green('+')} .gitignore (vendor/ ignored)`);
}

/** @param {InitFlags & Record<string, unknown>} flags */
export async function initCommand(flags) {
  const cwd = process.cwd();

  if (flags.vendorOnly && flags.skipVendor) {
    throw new Error('Cannot use --skip-vendor together with --vendor-only');
  }

  if (flags.vendorOnly) {
    console.log('');
    console.log(bold('🚀 AI Dev Setup — vendor only'));
    console.log('');
    const platformKeys = parsePlatformsFlag(flags.platforms ?? null);
    console.log(dim('📦 Vendoring Superpowers + Agency Agents (git + bash required)...'));
    try {
      await executeVendorInstall(cwd, platformKeys, flags);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.log('');
      console.log(red(`Vendor install failed: ${msg}`));
      console.log(dim('  Fix git/bash/network, or clone manually (see README).'));
      throw e;
    }
    console.log('');
    console.log(dim('📌 .gitignore'));
    await syncVendorGitignore(cwd);
    printAfterVendorOnly();
    return;
  }

  const detected = await detectProject(cwd);
  const fromFlag = parseStacksFlag(flags.stack ?? null);
  let stacks = [...new Set([...detected.detectedStack, ...fromFlag])];
  if (stacks.length === 0) {
    stacks = fallbackStacks(detected.language ?? DEFAULTS.language);
  }

  console.log('');
  console.log(bold('🚀 AI Dev Setup — Universal Configuration'));
  console.log('');

  /** @type {Record<string, unknown>} */
  let config;

  if (flags.yes) {
    const platformKeys = parsePlatformsFlag(flags.platforms ?? null);
    config = { ...buildConfig(detected, stacks) };
    await runGenerate(cwd, config, platformKeys, flags);
    return;
  }

  console.log(dim(`Detected: ${formatDetectedLine(detected)}`));
  console.log('');

  const projectName = await textPrompt('? Project name', detected.name ?? DEFAULTS.projectName);
  const language = await textPrompt('? Language', detected.language ?? DEFAULTS.language);
  const framework = await textPrompt('? Framework', detected.framework ?? DEFAULTS.framework);
  const testCmd = await textPrompt('? Test command', detected.testCmd ?? DEFAULTS.testCmd);
  const lintCmd = await textPrompt('? Lint command', detected.lintCmd ?? DEFAULTS.lintCmd);
  const buildCmd = await textPrompt('? Build command', detected.buildCmd ?? DEFAULTS.buildCmd);
  const database = await textPrompt('? Database', detected.database ?? DEFAULTS.database);

  const selected = await selectMulti(
    '? Select platforms',
    PLATFORMS,
    PLATFORMS.length >= 2 ? [0, 1] : [0],
  );
  const platformKeys = selected.map((p) => p.key);

  const interactiveStacks =
    stacks.length > 0 ? stacks : fallbackStacks(language || DEFAULTS.language);

  config = {
    projectName,
    language,
    framework,
    testCmd,
    lintCmd,
    buildCmd,
    database,
    stacks: interactiveStacks,
  };

  await runGenerate(cwd, config, platformKeys, flags);
}

/**
 * @param {string} cwd
 * @param {Record<string, unknown>} config
 * @param {string[]} platformKeys
 * @param {InitFlags & Record<string, unknown>} flags
 */
async function runGenerate(cwd, config, platformKeys, flags) {
  const force = Boolean(flags.force);
  const skipVendor = Boolean(flags.skipVendor);

  console.log('');
  console.log(dim('📝 Generating files...'));

  const files = await collectFiles(config, platformKeys);
  const results = await writeFiles(files, { cwd, force });

  for (const r of results) {
    if (r.status === 'written') {
      console.log(`  ${green('+')} ${r.path}`);
    } else if (r.status === 'skipped') {
      console.log(`  ${dim('o')} ${r.path} (skipped)`);
    } else {
      console.log(`  ! ${r.path} — ${r.error ?? 'error'}`);
    }
  }

  const written = results.filter((r) => r.status === 'written').length;
  const skipped = results.filter((r) => r.status === 'skipped').length;
  const errors = results.filter((r) => r.status === 'error').length;

  console.log('');
  if (errors === 0) {
    console.log(green(`✅ Templates: ${written} files written, ${skipped} skipped.`));
  } else {
    console.log(`Templates completed with errors: ${written} written, ${skipped} skipped, ${errors} failed.`);
  }

  console.log('');
  console.log(dim('📌 .gitignore'));
  await syncVendorGitignore(cwd);

  if (!skipVendor && errors === 0) {
    console.log('');
    console.log(dim('📦 Vendoring Superpowers + Agency Agents (git + bash required)...'));
    try {
      await executeVendorInstall(cwd, platformKeys, flags);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.log('');
      console.log(red(`Vendor install failed: ${msg}`));
      console.log(dim('  Fix git/bash/network, or re-run with --skip-vendor and clone manually (see README).'));
      throw e;
    }
  } else if (skipVendor) {
    console.log('');
    console.log(dim('⏭️  Skipped vendor install (--skip-vendor). Run `npx ai-dev-setup init --vendor-only` after clone, or clone manually (see README).'));
  }

  printAfterFullInit();
}

/**
 * @param {Record<string, unknown>} config
 * @param {string[]} platformKeys
 */
async function collectFiles(config, platformKeys) {
  /** @type {Array<{ path: string, content: string }>} */
  const all = [];
  all.push(...(await getSharedFiles(config)));

  for (const key of platformKeys) {
    const p = getPlatform(key);
    if (!p) {
      throw new Error(`Platform not registered: ${key}`);
    }
    all.push(...(await p.getFiles(config)));
  }
  return all;
}
