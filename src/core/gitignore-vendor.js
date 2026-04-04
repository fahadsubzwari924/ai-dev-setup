import fs from 'node:fs/promises';
import path from 'node:path';

/** @see ensureVendorDirGitignored — stable section for merges */
export const GITIGNORE_VENDOR_BEGIN = '# --- ai-dev-setup: vendor (managed) ---';
export const GITIGNORE_VENDOR_END = '# --- end ai-dev-setup vendor ---';
const VENDOR_LINE = '/vendor/';

const HEADER =
  '# ai-dev-setup: ignore cloned Superpowers + Agency (remove this block if you commit vendor/)\n';

/**
 * True if the line is a gitignore rule that ignores a root `vendor/` directory
 * (or any path segment `vendor`, which is stronger).
 * @param {string} line
 */
export function lineIgnoresRootVendor(line) {
  const t = line.trim();
  if (!t || t.startsWith('#')) return false;
  const core = t.startsWith('!') ? t.slice(1).trim() : t;
  // Root-only style: vendor, vendor/, /vendor, /vendor/, **/vendor, **/vendor/
  if (/^(?:\*\*\/)?\/?vendor\/?$/.test(core)) return true;
  return false;
}

/**
 * @param {string} content
 */
export function fileAlreadyIgnoresVendorDir(content) {
  const lines = content.split(/\r?\n/);
  return lines.some((line) => lineIgnoresRootVendor(line));
}

function managedBlockPresent(content) {
  return content.includes(GITIGNORE_VENDOR_BEGIN) && content.includes(GITIGNORE_VENDOR_END);
}

function blockInnerHasVendorLine(inner) {
  return inner.split(/\r?\n/).some((l) => l.trim() === VENDOR_LINE);
}

function buildManagedBlock() {
  return `${GITIGNORE_VENDOR_BEGIN}\n${VENDOR_LINE}\n${GITIGNORE_VENDOR_END}\n`;
}

/**
 * @param {string} content normalized with \n
 */
function repairManagedBlock(content) {
  const start = content.indexOf(GITIGNORE_VENDOR_BEGIN);
  const end = content.indexOf(GITIGNORE_VENDOR_END, start);
  if (start === -1 || end === -1) return null;
  const afterBegin = start + GITIGNORE_VENDOR_BEGIN.length;
  const inner = content.slice(afterBegin, end);
  if (blockInnerHasVendorLine(inner)) return null;
  return content.slice(0, afterBegin) + `\n${VENDOR_LINE}` + content.slice(afterBegin);
}

/**
 * Ensure `.gitignore` ignores repo-root `vendor/` without clobbering user rules.
 *
 * @param {string} cwd
 * @param {{ onWarn?: (msg: string) => void }} [opts]
 * @returns {Promise<{ action: 'created' | 'appended_block' | 'repaired_block' | 'noop_already_ignored' | 'noop_managed_ok' | 'error', error?: string }>}
 */
export async function ensureVendorDirGitignored(cwd, opts = {}) {
  const { onWarn } = opts;
  const target = path.join(cwd, '.gitignore');

  let raw = '';
  try {
    raw = await fs.readFile(target, 'utf8');
  } catch (e) {
    if (e && typeof e === 'object' && 'code' in e && e.code === 'ENOENT') {
      raw = '';
    } else {
      const msg = e instanceof Error ? e.message : String(e);
      onWarn?.(`.gitignore: could not read (${msg})`);
      return { action: 'error', error: msg };
    }
  }

  const content = raw.replace(/\r\n/g, '\n');

  if (managedBlockPresent(content)) {
    const repaired = repairManagedBlock(content);
    if (repaired != null) {
      try {
        await fs.writeFile(target, ensureTrailingNewline(repaired), 'utf8');
        return { action: 'repaired_block' };
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        onWarn?.(`.gitignore: could not write (${msg})`);
        return { action: 'error', error: msg };
      }
    }
    return { action: 'noop_managed_ok' };
  }

  if (fileAlreadyIgnoresVendorDir(content)) {
    return { action: 'noop_already_ignored' };
  }

  const block = buildManagedBlock();
  let next;
  if (content.length === 0) {
    next = HEADER + block;
  } else {
    const sep = content.endsWith('\n') ? '\n' : '\n\n';
    next = content + sep + block;
  }

  try {
    await fs.writeFile(target, ensureTrailingNewline(next), 'utf8');
    return { action: content.length === 0 ? 'created' : 'appended_block' };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    onWarn?.(`.gitignore: could not write (${msg})`);
    return { action: 'error', error: msg };
  }
}

/** @param {string} s */
function ensureTrailingNewline(s) {
  return s.endsWith('\n') ? s : `${s}\n`;
}
