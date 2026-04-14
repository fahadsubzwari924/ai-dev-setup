# SPEC-005 — platform adapter: Claude Code

**Status:** Implemented
**Module:** `src/platforms/claude-code.js`
**Registered platform key:** `'claude'`

---

## Goal

Generate all Claude Code-specific scaffold files from templates, producing a working project-local Claude Code configuration with Superpowers workflow wiring and Agency Agents routing pre-configured.

---

## Non-goals

- Does not copy vendor files (Superpowers skills, Agency agents) — that is handled by `SPEC-002`
- Does not manage `.gitignore`
- Does not validate the config object beyond template rendering

---

## Generated files

All files are rendered via `SPEC-004` (template engine) using the project config object.

| Destination path | Template path | Purpose |
|---|---|---|
| `CLAUDE.md` | `claude-code/claude.md.tmpl` | Project identity, stack facts, Superpowers/Agency load instructions — auto-read by Claude Code at every session start |
| `.claude/settings.json` | `claude-code/settings.json.tmpl` | Claude Code permissions + SessionStart hook |
| `.claude/commands/kickoff.md` | `claude-code/commands/kickoff.md.tmpl` | `/kickoff` slash command |
| `.claude/commands/implement.md` | `claude-code/commands/implement.md.tmpl` | `/implement` slash command |
| `.claude/commands/review.md` | `claude-code/commands/review.md.tmpl` | `/review` slash command |
| `.claude/commands/ship.md` | `claude-code/commands/ship.md.tmpl` | `/ship` slash command |
| `.claudeignore` | `ignore/claudeignore.tmpl` | Files Claude Code should not read or index |

---

## File responsibilities

### `CLAUDE.md`

Auto-loaded by Claude Code at session start. Must contain:
- Project name, language, framework, test/lint/build commands
- Instruction to load the Superpowers `using-superpowers` skill at session start
- Instruction to use Agency specialist roles for every task
- References to the `docs/` files for stack conventions, architecture, and patterns

### `.claude/settings.json`

Configures:
- **SessionStart hook** — runs `vendor/superpowers/hooks/session-start` to inject the `using-superpowers` skill automatically on every session open
- **Permissions** — tool allow-lists for the project

If `vendor/superpowers/` is absent (e.g., `--skip-vendor` was used), the SessionStart hook path will not resolve. The vendor step (`SPEC-002`) must run after templates are written for the hook to function at runtime.

### `.claude/commands/*.md`

Each file wires a slash command to the corresponding Superpowers phase:

| Command | Phase |
|---|---|
| `/kickoff` | Scope goals, risks, ordered task plan with Agency roles |
| `/implement` | Execute the plan with Agency specialist context per step |
| `/review` | Pre-merge checklist |
| `/ship` | Release readiness verification |

### `.claudeignore`

Excludes files that Claude Code should not read. The default template excludes large generated or vendored directories that would pollute context without adding value.

---

## Acceptance criteria

- [ ] All 7 files are generated in a `claude`-platform run
- [ ] `CLAUDE.md` contains the interpolated project name, language, framework, and test command
- [ ] `.claude/settings.json` is valid JSON and contains a `hooks` or `SessionStart` entry referencing Superpowers
- [ ] `.claudeignore` is generated and non-empty
- [ ] `.claude/commands/` contains exactly `kickoff.md`, `implement.md`, `review.md`, `ship.md`
- [ ] All files are skipped (not overwritten) without `--force` when they already exist
- [ ] With `--force`, all files are overwritten with fresh rendered content
- [ ] Template conditionals produce language-appropriate content (e.g., TypeScript-specific blocks present for TS projects, absent for Python)

---

## Dependencies

- `SPEC-004` — template engine (renders all files)
- `SPEC-002` — vendor install (required at runtime for SessionStart hook and slash commands to function)
