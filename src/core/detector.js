import fs from 'node:fs/promises';
import path from 'node:path';

async function readJsonIfExists(cwd, name) {
  try {
    const p = path.join(cwd, name);
    const raw = await fs.readFile(p, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function fileExists(cwd, name) {
  try {
    await fs.access(path.join(cwd, name));
    return true;
  } catch {
    return false;
  }
}

async function globFrameworkConfig(cwd, prefix) {
  try {
    const entries = await fs.readdir(cwd, { withFileTypes: true });
    return entries.some((e) => e.isFile() && e.name.startsWith(prefix));
  } catch {
    return false;
  }
}

function pickScript(scripts, keys) {
  if (!scripts || typeof scripts !== 'object') return null;
  for (const k of keys) {
    if (typeof scripts[k] === 'string' && scripts[k].trim()) return scripts[k].trim();
  }
  return null;
}

function depsFromPkg(pkg) {
  const d = pkg?.dependencies ?? {};
  const dev = pkg?.devDependencies ?? {};
  return { ...dev, ...d };
}

/**
 * Auto-detect project stack from the file system.
 * @param {string} cwd
 */
export async function detectProject(cwd) {
  const result = {
    name: null,
    language: null,
    framework: null,
    testCmd: null,
    lintCmd: null,
    buildCmd: null,
    database: null,
    detectedStack: [],
  };

  const pkg = await readJsonIfExists(cwd, 'package.json');
  if (pkg) {
    if (typeof pkg.name === 'string' && pkg.name.trim()) result.name = pkg.name.trim();
    const scripts = pkg.scripts;
    result.testCmd = pickScript(scripts, ['test', 'test:unit', 'test:ci']);
    result.lintCmd = pickScript(scripts, ['lint', 'eslint', 'check:lint']);
    result.buildCmd = pickScript(scripts, ['build', 'compile', 'build:prod']);

    const deps = depsFromPkg(pkg);
    if (deps.react) {
      result.detectedStack.push('react');
      if (!result.framework) result.framework = 'React';
    }
    if (deps.next) {
      result.detectedStack.push('nextjs');
      result.framework = 'Next.js';
    }
    if (deps['@nestjs/core']) {
      result.detectedStack.push('nestjs');
      result.framework = 'NestJS';
    }
    if (deps.prisma) {
      const schemaPath = path.join(cwd, 'prisma', 'schema.prisma');
      try {
        const schema = await fs.readFile(schemaPath, 'utf8');
        if (/provider\s*=\s*"postgresql"/i.test(schema)) result.database = 'PostgreSQL';
        else if (/provider\s*=\s*"mysql"/i.test(schema)) result.database = 'MySQL';
        else if (/provider\s*=\s*"sqlite"/i.test(schema)) result.database = 'SQLite';
      } catch {
        result.database = result.database ?? 'PostgreSQL';
      }
    }
    if (deps.typeorm) {
      result.database = result.database ?? 'SQL (TypeORM)';
    }
    if (deps.pg || deps['pg-promise']) {
      result.database = result.database ?? 'PostgreSQL';
    }
    if (deps.mysql2) {
      result.database = result.database ?? 'MySQL';
    }
  }

  const hasTsConfig = await fileExists(cwd, 'tsconfig.json');
  if (hasTsConfig) {
    result.detectedStack.push('ts');
    result.language = 'TypeScript';
  }

  if (pkg && !hasTsConfig && !result.language) {
    result.language = 'JavaScript';
  }

  if (await globFrameworkConfig(cwd, 'next.config')) {
    if (!result.detectedStack.includes('nextjs')) result.detectedStack.push('nextjs');
    result.framework = 'Next.js';
  }

  if (await readJsonIfExists(cwd, 'nest-cli.json')) {
    if (!result.detectedStack.includes('nestjs')) result.detectedStack.push('nestjs');
    result.framework = 'NestJS';
  }

  if (pkg) {
    const deps = depsFromPkg(pkg);
    const isNext = result.detectedStack.includes('nextjs');
    if ((deps.express || deps.fastify || deps.koa || deps.hapi) && !isNext) {
      result.detectedStack.push('node');
      if (!result.framework || result.framework === 'React') {
        result.framework = 'Node.js API';
      }
    }
  }

  if (await fileExists(cwd, 'pyproject.toml') || (await fileExists(cwd, 'requirements.txt'))) {
    result.detectedStack.push('python');
    result.language = 'Python';
    if (!result.testCmd) result.testCmd = 'pytest';
    if (!result.lintCmd) result.lintCmd = 'ruff check .';
    if (!result.buildCmd) result.buildCmd = 'python -m build';
  }

  if (await fileExists(cwd, 'go.mod')) {
    result.detectedStack.push('go');
    result.language = 'Go';
    if (!result.testCmd) result.testCmd = 'go test ./...';
    if (!result.lintCmd) result.lintCmd = 'golangci-lint run';
    if (!result.buildCmd) result.buildCmd = 'go build ./...';
  }

  if (await fileExists(cwd, 'pubspec.yaml')) {
    result.detectedStack.push('flutter');
    result.language = 'Dart';
    result.framework = 'Flutter';
    if (!result.testCmd) result.testCmd = 'flutter test';
    if (!result.lintCmd) result.lintCmd = 'dart analyze';
    if (!result.buildCmd) result.buildCmd = 'flutter build apk';
  }

  result.detectedStack = [...new Set(result.detectedStack)];

  return result;
}
