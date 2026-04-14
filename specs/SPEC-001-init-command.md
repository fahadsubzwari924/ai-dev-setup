# SPEC-001 — init command

**Status:** Implemented
**Module:** `src/commands/init.js`
**Invoked by:** `src/cli/index.js` → `initCommand(flags)`

---

## Goal

Orchestrate the full scaffold flow: detect the consumer project, resolve configuration, write template files, manage `.gitignore`, and optionally run the vendor install step. Supports three distinct modes controlled by flags.

---

## Modes

| Mode | Triggering condition | Behaviour |
|---|---|---|
| `vendor-only` | `--vendor-only` flag | Skip templates; run vendor step only |
| `skip-vendor` | `--skip-vendor` flag | Write templates; skip vendor step |
| `full` (default) | Neither flag present | Write templates then run vendor step |

`--vendor-only` and `--skip-vendor` are mutually exclusive. Passing both throws immediately before any I/O.

---

## Non-goals

- Does not perform git clones itself (delegates to `installVendors` in `src/core/vendors.js`)
- Does not render templates itself (delegates to `collectFiles` → `src/core/renderer.js`)
- Does not write files itself (delegates to `writeFiles` in `src/core/writer.js`)
- Does not mutate `.gitignore` itself (delegates to `ensureVendorDirGitignored`)

---

## Inputs

| Input | Source | Notes |
|---|---|---|
| `flags.yes` | CLI | If `true`, skip interactive prompts; use detected values + defaults |
| `flags.force` | CLI | Overwrite existing files and re-clone vendor |
| `flags.skipVendor` | CLI | Boolean |
| `flags.vendorOnly` | CLI | Boolean |
| `flags.stack` | CLI | Comma-separated stack keys; validated against `STACKS` constant |
| `flags.platforms` | CLI | Comma-separated platform keys; defaults to `['claude', 'cursor']` |
| `flags.superpowersRef` | CLI | Git branch/tag string; defaults to `'main'` |
| `flags.agencyRef` | CLI | Git branch/tag string; defaults to `'main'` |

---

## Stack resolution (non-vendor-only mode)

1. Auto-detect stack from `cwd` via `detectProject(cwd)` → `detectedStack[]`
2. Merge `--stack` flag values (validated) with detected stack; deduplicate via `Set`
3. If merged stack is empty after step 2, apply language fallback:

| Language | Fallback stack |
|---|---|
| TypeScript or JavaScript | `['ts']` |
| Python | `['python']` |
| Go | `['go']` |
| Dart | `['flutter']` |
| Any other / unknown | `['ts']` |

---

## Platform resolution

- Parse `--platforms` flag; validate each key against `PLATFORM_KEYS`
- If flag is absent or empty string, default to `['claude', 'cursor']`
- Deduplicate using `Set`

---

## Interactive mode (no `--yes` flag)

Presents TTY prompts for: `projectName`, `language`, `framework`, `testCmd`, `lintCmd`, `buildCmd`, `database`, and a multi-select for platforms. Each prompt is pre-filled with the auto-detected value or the corresponding `DEFAULTS` constant.

## Non-interactive mode (`--yes` flag)

Uses detected values merged with `DEFAULTS` directly. No prompts are shown. Can be combined with `--platforms`, `--stack`, `--skip-vendor`, `--vendor-only`.

---

## Execution sequence (full mode)

1. Detect project via `detectProject(cwd)`
2. Resolve stacks and platforms from flags + detection
3. Collect project config (prompt or defaults)
4. `collectFiles(config, platformKeys)` — gather rendered template outputs from shared + platform adapters
5. `writeFiles(files, { cwd, force })` — write to disk
6. Log per-file results (`+` written, `o` skipped, `!` error)
7. `syncVendorGitignore(cwd)` — ensure `vendor/` is gitignored (always runs)
8. If no template errors and `!skipVendor`: `executeVendorInstall(cwd, platformKeys, flags)`
9. Print next-steps message

## Execution sequence (vendor-only mode)

1. Resolve platform keys from `--platforms` flag
2. `executeVendorInstall(cwd, platformKeys, flags)`
3. `syncVendorGitignore(cwd)`
4. Print next-steps message

---

## Error handling

| Error condition | Behaviour |
|---|---|
| `--vendor-only` + `--skip-vendor` together | Throw before any I/O |
| Unknown `--stack` key | Throw with list of valid keys |
| Unknown `--platforms` key | Throw with list of valid keys |
| Template write error | Log error per file; continue; abort vendor step if any errors |
| Vendor install failure | Log human-readable error; throw (does not swallow) |
| Path escape in file path | `writeFiles` rejects individual file with `'Path escapes working directory'` |

---

## Acceptance criteria

- [ ] `npx ai-dev-setup init` in a clean directory completes without error
- [ ] `npx ai-dev-setup init --yes` produces the same output as interactive with all defaults accepted
- [ ] `--vendor-only --skip-vendor` exits with a clear error before any I/O
- [ ] `--stack=invalid` exits with a clear error listing valid keys
- [ ] Existing files are skipped (not overwritten) without `--force`
- [ ] With `--force`, existing files are overwritten
- [ ] `--skip-vendor` writes templates but produces no `vendor/` directory
- [ ] `--vendor-only` clones into `vendor/` but writes no template files
- [ ] Vendor install failure is surfaced with the original error; not silently swallowed
- [ ] `.gitignore` is updated to ignore `vendor/` on every `init` run regardless of mode

---

## Dependencies

- `SPEC-002` — vendor install
- `SPEC-003` — stack detection
- `SPEC-004` — template engine
- `SPEC-007` — gitignore vendor management
- `SPEC-008` — CLI interface (flag parsing)
