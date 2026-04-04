import { VERSION, PLATFORMS, STACKS } from '../constants.js';
import { initCommand } from '../commands/init.js';
import { updateCommand } from '../commands/update.js';
import { bold, dim, green } from './logger.js';

function printHelp() {
  const lines = [
    bold('ai-dev-setup') + ' — scaffold AI assistant config (Claude Code, Cursor)',
    '',
    dim('Usage:'),
    '  npx ai-dev-setup [init] [options]',
    '  npx ai-dev-setup update   (placeholder)',
    '',
    dim('Options:'),
    '  -y, --yes              Non-interactive: detect project + defaults, no prompts',
    '  -f, --force            Overwrite existing generated files',
    '  --stack=a,b            Merge stack keys (' +
      STACKS.map((s) => s.key).join(', ') +
      ')',
    '  --platforms=a,b        Platforms: claude, cursor (non-interactive)',
    '  --skip-vendor          Skip git clone + Agency convert (templates only)',
    '  --vendor-only          Only run vendor step (no template writes; for teammates / vendor in .gitignore)',
    '  --superpowers-ref=REF  Git branch/tag for obra/superpowers (default: main)',
    '  --agency-ref=REF       Git branch/tag for agency-agents (default: main)',
    '  -h, --help             Show help',
    '  -v, --version          Show version',
    '',
    dim('Platforms:'),
    ...PLATFORMS.map((p) => `  ${green(p.key.padEnd(8))} ${p.label} — ${p.desc}`),
    '',
    dim('Examples:'),
    '  npx ai-dev-setup init',
    '  npx ai-dev-setup init --yes --platforms=claude,cursor',
    '  npx ai-dev-setup init --yes --skip-vendor    # templates only; commit without vendor/',
    '  npx ai-dev-setup init --vendor-only --platforms=claude,cursor',
    '',
  ];
  console.log(lines.join('\n'));
}

/**
 * @param {string[]} argv
 */
export function parseArgv(argv) {
  const flags = {
    yes: false,
    force: false,
    skipVendor: false,
    vendorOnly: false,
    help: false,
    version: false,
    stack: null,
    platforms: null,
    superpowersRef: null,
    agencyRef: null,
  };
  const positional = [];

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--yes' || a === '-y') {
      flags.yes = true;
      continue;
    }
    if (a === '--force' || a === '-f') {
      flags.force = true;
      continue;
    }
    if (a === '--skip-vendor') {
      flags.skipVendor = true;
      continue;
    }
    if (a === '--vendor-only') {
      flags.vendorOnly = true;
      continue;
    }
    if (a === '--help' || a === '-h') {
      flags.help = true;
      continue;
    }
    if (a === '--version' || a === '-v') {
      flags.version = true;
      continue;
    }
    if (a.startsWith('--stack=')) {
      flags.stack = a.slice('--stack='.length);
      continue;
    }
    if (a.startsWith('--platforms=')) {
      flags.platforms = a.slice('--platforms='.length);
      continue;
    }
    if (a.startsWith('--superpowers-ref=')) {
      flags.superpowersRef = a.slice('--superpowers-ref='.length);
      continue;
    }
    if (a.startsWith('--agency-ref=')) {
      flags.agencyRef = a.slice('--agency-ref='.length);
      continue;
    }
    if (a.startsWith('-')) {
      throw new Error(`Unknown flag: ${a}`);
    }
    positional.push(a);
  }

  return { flags, positional };
}

/**
 * @param {string[]} argv
 */
export async function run(argv) {
  const { flags, positional } = parseArgv(argv);

  if (flags.help) {
    printHelp();
    return;
  }
  if (flags.version) {
    console.log(VERSION);
    return;
  }

  const cmd = positional[0] ?? 'init';
  const rest = positional.slice(1);

  if (rest.length > 0) {
    throw new Error(`Unexpected arguments: ${rest.join(' ')}`);
  }

  if (cmd === 'init') {
    await initCommand(flags);
    return;
  }
  if (cmd === 'update') {
    await updateCommand(flags);
    return;
  }

  throw new Error(`Unknown command: ${cmd}. Try --help`);
}
