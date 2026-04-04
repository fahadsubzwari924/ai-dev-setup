import process from 'node:process';

function noAnsi() {
  return !process.stdout.isTTY || process.env.NO_COLOR != null;
}

function ansi(code) {
  return (s) => (noAnsi() ? s : `\x1b[${code}m${s}\x1b[0m`);
}

export function bold(s) {
  return ansi('1')(s);
}

export function green(s) {
  return ansi('32')(s);
}

export function yellow(s) {
  return ansi('33')(s);
}

export function dim(s) {
  return ansi('2')(s);
}

export function red(s) {
  return ansi('31')(s);
}
