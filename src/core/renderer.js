import { readFile } from 'node:fs/promises';

/**
 * @param {string} key
 * @param {Record<string, unknown>} config
 */
function evalConditional(key, config) {
  const stacks = Array.isArray(config.stacks) ? config.stacks : [];
  const lang = config.language;
  switch (key) {
    case 'TYPESCRIPT':
      return lang === 'TypeScript';
    case 'PYTHON':
      return lang === 'Python';
    case 'GO':
      return lang === 'Go';
    case 'JAVASCRIPT':
      return lang === 'JavaScript';
    case 'DART':
      return lang === 'Dart';
    case 'FLUTTER':
      return stacks.includes('flutter');
    case 'REACT':
      return stacks.includes('react');
    case 'NEXTJS':
      return stacks.includes('nextjs');
    case 'NESTJS':
      return stacks.includes('nestjs');
    case 'NODE':
      return stacks.includes('node');
    default:
      return false;
  }
}

/**
 * Process {{#IF_KEY}}...{{/IF_KEY}} blocks.
 * @param {string} template
 * @param {Record<string, unknown>} config
 */
function processConditionals(template, config) {
  const re = /\{\{#IF_([A-Z0-9_]+)\}\}([\s\S]*?)\{\{\/IF_\1\}\}/g;
  return template.replace(re, (_, key, inner) => {
    return evalConditional(key, config) ? inner : '';
  });
}

const PLACEHOLDER_KEYS = [
  'PROJECT_NAME',
  'LANGUAGE',
  'FRAMEWORK',
  'TEST_CMD',
  'LINT_CMD',
  'BUILD_CMD',
  'DATABASE',
];

/**
 * @param {Record<string, unknown>} config
 */
function placeholderValue(key, config) {
  const map = {
    PROJECT_NAME: config.projectName,
    LANGUAGE: config.language,
    FRAMEWORK: config.framework,
    TEST_CMD: config.testCmd,
    LINT_CMD: config.lintCmd,
    BUILD_CMD: config.buildCmd,
    DATABASE: config.database,
  };
  const v = map[key];
  return v == null ? '' : String(v);
}

/**
 * Replaces {{PLACEHOLDER}} tokens; unknown tokens stay unchanged.
 * @param {string} template
 * @param {Record<string, unknown>} config
 */
export function render(template, config) {
  let out = processConditionals(template, config);
  for (const key of PLACEHOLDER_KEYS) {
    const token = `{{${key}}}`;
    const val = placeholderValue(key, config);
    out = out.split(token).join(val);
  }
  return out;
}

/**
 * @param {string} templatePath
 * @param {Record<string, unknown>} config
 */
export async function renderFile(templatePath, config) {
  const raw = await readFile(templatePath, 'utf8');
  return render(raw, config);
}
