import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

function isPathInsideRoot(root, target) {
  const r = path.resolve(root);
  const t = path.resolve(target);
  const prefix = r.endsWith(path.sep) ? r : r + path.sep;
  return t === r || t.startsWith(prefix);
}

/**
 * @param {Array<{ path: string, content: string }>} files
 * @param {{ cwd?: string, force?: boolean }} [options]
 */
export async function writeFiles(files, { cwd = process.cwd(), force = false } = {}) {
  const root = path.resolve(cwd);
  /** @type {Array<{ path: string, status: 'written'|'skipped'|'error', error?: string }>} */
  const results = [];

  for (const file of files) {
    const target = path.resolve(root, file.path);
    if (!isPathInsideRoot(root, target)) {
      results.push({
        path: file.path,
        status: 'error',
        error: 'Path escapes working directory',
      });
      continue;
    }

    try {
      await fs.mkdir(path.dirname(target), { recursive: true });
    } catch (err) {
      results.push({
        path: file.path,
        status: 'error',
        error: err instanceof Error ? err.message : String(err),
      });
      continue;
    }

    try {
      let exists = false;
      try {
        await fs.access(target);
        exists = true;
      } catch {
        exists = false;
      }
      if (exists && !force) {
        results.push({ path: file.path, status: 'skipped' });
        continue;
      }
      await fs.writeFile(target, file.content, 'utf8');
      results.push({ path: file.path, status: 'written' });
    } catch (err) {
      results.push({
        path: file.path,
        status: 'error',
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return results;
}
