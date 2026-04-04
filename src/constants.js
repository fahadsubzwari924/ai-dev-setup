import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const pkgPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));

export const VERSION = pkg.version;

export const PLATFORMS = [
  { key: 'claude', label: 'Claude Code', desc: 'CLAUDE.md + .claude/' },
  { key: 'cursor', label: 'Cursor', desc: '.cursorrules + .cursor/rules/' },
];

export const STACKS = [
  { key: 'ts', label: 'TypeScript (generic)' },
  { key: 'react', label: 'React' },
  { key: 'nextjs', label: 'Next.js' },
  { key: 'node', label: 'Node.js API' },
  { key: 'nestjs', label: 'NestJS' },
  { key: 'python', label: 'Python' },
  { key: 'go', label: 'Go (Golang)' },
  { key: 'flutter', label: 'Flutter (Dart)' },
];

export const DEFAULTS = {
  projectName: 'my-project',
  language: 'TypeScript',
  framework: 'Next.js',
  testCmd: 'npm test',
  lintCmd: 'npm run lint',
  buildCmd: 'npm run build',
  database: 'PostgreSQL',
};
