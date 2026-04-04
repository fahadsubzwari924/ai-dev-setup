import process from 'node:process';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { bold, dim, green } from './logger.js';

function restoreTerminal() {
  output.write('\x1b[?25h');
  if (input.isTTY) {
    input.setRawMode(false);
    input.pause();
  }
}

function canUseInteractiveMode() {
  return Boolean(input.isTTY && output.isTTY);
}

function itemLabel(item) {
  if (typeof item === 'string') return item;
  return item.desc ? `${item.label} ${dim(item.desc)}` : item.label;
}

/** @param {string} question */
export async function textPrompt(question, defaultValue = '') {
  if (!canUseInteractiveMode()) {
    return defaultValue;
  }
  const rl = readline.createInterface({ input, output });
  try {
    const hint = defaultValue ? dim(` [${defaultValue}]`) : '';
    const line = await rl.question(`${question}${hint}: `);
    const trimmed = line.trim();
    return trimmed === '' ? defaultValue : trimmed;
  } finally {
    rl.close();
  }
}

/** @param {string} question */
export async function confirm(question, defaultYes = true) {
  if (!canUseInteractiveMode()) {
    return defaultYes;
  }
  const suffix = defaultYes ? 'Y/n' : 'y/N';
  const rl = readline.createInterface({ input, output });
  try {
    const line = await rl.question(`${question} (${suffix}): `);
    const t = line.trim().toLowerCase();
    if (t === '') return defaultYes;
    if (t === 'y' || t === 'yes') return true;
    if (t === 'n' || t === 'no') return false;
    return defaultYes;
  } finally {
    rl.close();
  }
}

/** Single-select: ↑/↓ to navigate, Enter to confirm. */
export async function selectOne(question, items, defaultIdx = 0) {
  if (!canUseInteractiveMode()) {
    if (items.length === 0) {
      throw new Error('Interactive prompt requires a TTY. Re-run with --yes in non-interactive environments.');
    }
    const safeIdx = Math.min(Math.max(defaultIdx, 0), items.length - 1);
    return items[safeIdx];
  }

  let idx = defaultIdx;

  const render = () => {
    output.write('\x1b[?25l');
    output.write(`\n ${bold(question)}\n`);
    for (let i = 0; i < items.length; i++) {
      const pointer = i === idx ? green('❯') : ' ';
      const label = i === idx ? bold(itemLabel(items[i])) : itemLabel(items[i]);
      output.write(` ${pointer} ${label}\n`);
    }
  };

  const clear = () => {
    const lines = items.length + 2;
    output.write(`\x1b[${lines}A`);
    for (let i = 0; i < lines; i++) {
      output.write('\x1b[2K\n');
    }
    output.write(`\x1b[${lines}A`);
  };

  render();

  return new Promise((resolve, reject) => {
    input.setRawMode(true);
    input.resume();

    const onData = (data) => {
      try {
        const bytes = [...data];
        const key = data.toString();

        const isUp =
          key === '\x1b[A' ||
          (bytes.length === 2 && (bytes[0] === 0xe0 || bytes[0] === 0x00) && bytes[1] === 0x48);
        const isDown =
          key === '\x1b[B' ||
          (bytes.length === 2 && (bytes[0] === 0xe0 || bytes[0] === 0x00) && bytes[1] === 0x50);
        const isEnter = key === '\r' || key === '\n';
        const isCtrlC = key === '\x03';

        if (isCtrlC) {
          restoreTerminal();
          process.exit(130);
        }

        if (isUp) {
          idx = (idx - 1 + items.length) % items.length;
          clear();
          render();
        } else if (isDown) {
          idx = (idx + 1) % items.length;
          clear();
          render();
        } else if (isEnter) {
          restoreTerminal();
          input.removeListener('data', onData);
          clear();
          const item = items[idx];
          const label = typeof item === 'string' ? item : item.label;
          output.write(` ${bold(question)} ${green(label)}\n`);
          resolve(items[idx]);
        }
      } catch (err) {
        restoreTerminal();
        input.removeListener('data', onData);
        reject(err);
      }
    };

    input.on('data', onData);
  });
}

/**
 * Multi-select: ↑/↓ navigate, Space toggle, A toggle all, Enter confirm.
 * @param {number[]|null} defaultSelected
 */
export async function selectMulti(question, items, defaultSelected = null) {
  if (!canUseInteractiveMode()) {
    if (items.length === 0) {
      throw new Error('Interactive prompt requires a TTY. Re-run with --yes in non-interactive environments.');
    }
    if (defaultSelected !== null) {
      const indices = defaultSelected.filter((i) => i >= 0 && i < items.length);
      return indices.map((i) => items[i]);
    }
    if (items.length >= 2) {
      return [items[0], items[1]];
    }
    return [items[0]];
  }

  let idx = 0;
  const selected = new Set();
  if (defaultSelected !== null) {
    for (const i of defaultSelected) selected.add(i);
  } else if (items.length >= 2) {
    selected.add(0);
    selected.add(1);
  } else if (items.length === 1) {
    selected.add(0);
  }

  const render = () => {
    output.write('\x1b[?25l');
    output.write(`\n ${bold(question)} ${dim('(Space=toggle, A=all, Enter=confirm)')}\n`);
    for (let i = 0; i < items.length; i++) {
      const pointer = i === idx ? green('❯') : ' ';
      const check = selected.has(i) ? green('◉') : dim('○');
      const label = i === idx ? bold(itemLabel(items[i])) : itemLabel(items[i]);
      output.write(` ${pointer} ${check} ${label}\n`);
    }
    if (selected.size === 0) {
      output.write(dim(' ↑ Select at least one, then press Enter\n'));
    }
  };

  const clear = () => {
    const extra = selected.size === 0 ? 1 : 0;
    const lines = items.length + 2 + extra;
    output.write(`\x1b[${lines}A`);
    for (let i = 0; i < lines; i++) {
      output.write('\x1b[2K\n');
    }
    output.write(`\x1b[${lines}A`);
  };

  render();

  return new Promise((resolve, reject) => {
    input.setRawMode(true);
    input.resume();

    const onData = (data) => {
      try {
        const bytes = [...data];
        const key = data.toString();

        const isUp =
          key === '\x1b[A' ||
          (bytes.length === 2 && (bytes[0] === 0xe0 || bytes[0] === 0x00) && bytes[1] === 0x48);
        const isDown =
          key === '\x1b[B' ||
          (bytes.length === 2 && (bytes[0] === 0xe0 || bytes[0] === 0x00) && bytes[1] === 0x50);
        const isSpace = key === ' ';
        const isEnter = key === '\r' || key === '\n';
        const isCtrlC = key === '\x03';
        const isA = key === 'a' || key === 'A';

        if (isCtrlC) {
          restoreTerminal();
          process.exit(130);
        }

        if (isUp) {
          idx = (idx - 1 + items.length) % items.length;
          clear();
          render();
        } else if (isDown) {
          idx = (idx + 1) % items.length;
          clear();
          render();
        } else if (isSpace) {
          if (selected.has(idx)) selected.delete(idx);
          else selected.add(idx);
          clear();
          render();
        } else if (isA) {
          if (selected.size === items.length) {
            selected.clear();
          } else {
            for (let i = 0; i < items.length; i++) selected.add(i);
          }
          clear();
          render();
        } else if (isEnter && selected.size > 0) {
          restoreTerminal();
          input.removeListener('data', onData);
          clear();
          const labels = [...selected]
            .sort((a, b) => a - b)
            .map((i) => {
              const it = items[i];
              return typeof it === 'string' ? it : it.label;
            })
            .join(', ');
          output.write(` ${bold(question)} ${green(labels)}\n`);
          resolve([...selected].sort((a, b) => a - b).map((i) => items[i]));
        }
      } catch (err) {
        restoreTerminal();
        input.removeListener('data', onData);
        reject(err);
      }
    };

    input.on('data', onData);
  });
}
