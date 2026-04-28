import fs from 'node:fs/promises';
import path from 'node:path';

const ALWAYS_ON_FILES = [
  'src/templates/claude-code/claude.md.tmpl',
  'src/templates/claude-code/hooks/contract.sh.tmpl',
  'src/templates/cursor/rules/core-rules.mdc.tmpl',
  'src/templates/cursor/rules/dispatch-guard.mdc.tmpl',
  'src/templates/shared/contract.md.tmpl',
];

function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

/**
 * @param {string} filePath
 */
async function fileTokenEstimate(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  return {
    file: filePath,
    chars: content.length,
    tokens: estimateTokens(content),
  };
}

export async function auditTokensCommand() {
  const cwd = process.cwd();
  const rows = [];
  for (const rel of ALWAYS_ON_FILES) {
    const full = path.join(cwd, rel);
    rows.push(await fileTokenEstimate(full));
  }
  const total = rows.reduce((sum, row) => sum + row.tokens, 0);

  console.log('\nToken audit (estimated using chars/4)\n');
  console.log('File'.padEnd(64) + 'Tokens');
  console.log('-'.repeat(76));
  for (const row of rows) {
    const label = row.file.length > 62 ? `...${row.file.slice(-59)}` : row.file;
    const line = label.padEnd(64) + String(row.tokens);
    console.log(line);
    if (row.tokens > 400) {
      console.log(`  ! ${row.file} is ${row.tokens} tokens; consider splitting/trimming`);
    }
  }
  console.log('-'.repeat(76));
  console.log(`Total always-on estimate: ${total} tokens\n`);
}
