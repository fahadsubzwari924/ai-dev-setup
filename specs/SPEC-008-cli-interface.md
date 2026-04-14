# SPEC-008 — CLI interface

**Status:** Implemented
**Module:** `src/cli/index.js`
**Entry points:** `run(argv)`, `parseArgv(argv)`

---

## Goal

Parse `process.argv`, route to the correct command handler, and provide interactive TTY prompts for the `init` flow when `--yes` is not passed.

---

## Non-goals

- Does not implement command logic (delegates to `initCommand`, `updateCommand`)
- Does not validate stack or platform keys (that validation is in `init.js`)
- Does not interact with the file system

---

## Supported commands

| Positional | Handler | Notes |
|---|---|---|
| _(absent)_ | `initCommand` | Default when no positional is given |
| `init` | `initCommand` | Explicit |
| `update` | `updateCommand` | Placeholder; not yet fully implemented |

Extra positional arguments after the command name throw `Error: Unexpected arguments: <args>`.
An unrecognised command name throws `Error: Unknown command: <name>. Try --help`.

---

## Flags

| Flag | Short | Type | Default | Description |
|---|---|---|---|---|
| `--yes` | `-y` | boolean | `false` | Non-interactive; use detected values + defaults |
| `--force` | `-f` | boolean | `false` | Overwrite existing files; re-clone vendor |
| `--skip-vendor` | — | boolean | `false` | Templates only; skip vendor step |
| `--vendor-only` | — | boolean | `false` | Vendor step only; skip templates |
| `--stack=<keys>` | — | string | `null` | Comma-separated stack keys |
| `--platforms=<keys>` | — | string | `null` | Comma-separated platform keys |
| `--superpowers-ref=<ref>` | — | string | `null` | Git branch/tag for Superpowers |
| `--agency-ref=<ref>` | — | string | `null` | Git branch/tag for Agency Agents |
| `--help` | `-h` | boolean | `false` | Print help text and exit |
| `--version` | `-v` | boolean | `false` | Print version string and exit |

---

## Flag parsing rules

- Boolean flags have no value: `--yes`, not `--yes=true`
- Value flags use `=` syntax: `--stack=ts,react`, not `--stack ts`
- Unknown flags (any argument starting with `-` that is not in the list above) throw `Error: Unknown flag: <flag>`
- `--help` and `--version` short-circuit immediately; no command runs

---

## Mutual exclusions

Enforced inside `initCommand` (not in the parser):

| Combination | Error message |
|---|---|
| `--skip-vendor` + `--vendor-only` | `'Cannot use --skip-vendor together with --vendor-only'` |

---

## Interactive prompts (`src/cli/prompts.js`)

Shown only when `--yes` is not passed. Each prompt presents a default value pre-filled from auto-detection or `DEFAULTS` constant:

| Prompt label | Pre-fill source |
|---|---|
| Project name | `detected.name` → `DEFAULTS.projectName` (`'my-project'`) |
| Language | `detected.language` → `DEFAULTS.language` (`'TypeScript'`) |
| Framework | `detected.framework` → `DEFAULTS.framework` (`'Next.js'`) |
| Test command | `detected.testCmd` → `DEFAULTS.testCmd` (`'npm test'`) |
| Lint command | `detected.lintCmd` → `DEFAULTS.lintCmd` (`'npm run lint'`) |
| Build command | `detected.buildCmd` → `DEFAULTS.buildCmd` (`'npm run build'`) |
| Database | `detected.database` → `DEFAULTS.database` (`'PostgreSQL'`) |
| Platforms | Multi-select; defaults to both `claude` and `cursor` selected |

---

## Help output

Printed to stdout when `--help` / `-h` is passed. Must include:
- Usage line
- All flags with their short aliases and descriptions
- Platform list (from `CONSTANTS.PLATFORMS`)
- Example commands

---

## Version output

Prints the `version` field from `package.json` to stdout when `--version` / `-v` is passed.

---

## Acceptance criteria

- [ ] `--help` / `-h` prints help text to stdout and exits without running any command
- [ ] `--version` / `-v` prints the version string and exits
- [ ] No positional argument → `initCommand` is invoked
- [ ] `init` positional → `initCommand` is invoked
- [ ] `update` positional → `updateCommand` is invoked
- [ ] Unknown positional (e.g., `foo`) → throws with the unknown command name
- [ ] Extra positional after command → throws with `'Unexpected arguments'`
- [ ] Unknown flag (e.g., `--foo`) → throws with the flag name in the message
- [ ] `--stack=ts,react` → `flags.stack = 'ts,react'` (raw string; parsing left to `initCommand`)
- [ ] `-y` sets `flags.yes = true`
- [ ] `-f` sets `flags.force = true`
- [ ] Interactive mode: all prompts are shown with detected defaults pre-filled
- [ ] `--yes` mode: `initCommand` is called with detected values; no TTY prompts shown

---

## Dependencies

- `SPEC-001` — init command (`parseArgv` output passed directly as the `flags` argument)
- `SPEC-003` — stack detection (pre-fill values for interactive prompts)
