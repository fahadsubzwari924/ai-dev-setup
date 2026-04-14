# SPEC-006 — platform adapter: Cursor

**Status:** Implemented
**Module:** `src/platforms/cursor.js`
**Registered platform key:** `'cursor'`

---

## Goal

Generate all Cursor-specific scaffold files from templates, producing a working project-local Cursor configuration with Superpowers routing and Agency specialist rules pre-wired.

---

## Non-goals

- Does not copy `agency-*.mdc` specialist rules — those are written during the vendor step (`SPEC-002`)
- Does not write `.cursor-plugin/plugin.json` — that is also written during the vendor step (`SPEC-002`)
- Does not manage `.gitignore`
- Does not validate the config object beyond template rendering

---

## Generated files

All files are rendered via `SPEC-004` (template engine) using the project config object.

| Destination path | Template path | Purpose |
|---|---|---|
| `.cursorrules` | `cursor/cursorrules.tmpl` | Project-level rules (legacy Cursor format; project identity + stack context) |
| `.cursor/rules/core-rules.mdc` | `cursor/rules/core-rules.mdc.tmpl` | Always-on: stack identity, file size limits, anti-patterns, doc load table |
| `.cursor/rules/routing.mdc` | `cursor/rules/routing.mdc.tmpl` | Always-on: routes every task through Superpowers skills and Agency specialist roles |
| `.cursor/rules/workflow.mdc` | `cursor/rules/workflow.mdc.tmpl` | Task-shaped workflow lifecycle rules (loaded on demand) |
| `.cursor/rules/review.mdc` | `cursor/rules/review.mdc.tmpl` | Pre-merge review checklist rules (loaded on demand) |
| `.cursor/rules/agents.mdc` | `cursor/rules/agents.mdc.tmpl` | Agency specialist activation and quality expectations (loaded on demand) |
| `.cursorignore` | `ignore/cursorignore.tmpl` | Files Cursor should not index |

---

## MDC rule file roles

| File | `alwaysApply` | When active |
|---|---|---|
| `core-rules.mdc` | `true` | Every session |
| `routing.mdc` | `true` | Every session |
| `workflow.mdc` | `false` | On demand or glob match |
| `review.mdc` | `false` | On demand or glob match |
| `agents.mdc` | `false` | On demand or glob match |

`alwaysApply: true` files are loaded by Cursor automatically on every session. `alwaysApply: false` files are loaded when Cursor matches them to the current context or when explicitly referenced by an always-on rule.

---

## `.cursorignore`

By default excludes `vendor/superpowers/` and `vendor/agency-agents/` from Cursor's file indexing and autocomplete. This prevents the upstream vendor trees from polluting the project's symbol index.

Users who need vendor content visible in Cursor's file tree can manually remove those lines from `.cursorignore`.

---

## `agency-*.mdc` files (vendor step — not this spec)

Agency specialist rules (e.g., `agency-backend-architect.mdc`) are **not** generated from templates. They are copied from `vendor/agency-agents/integrations/cursor/rules/` during the vendor install step (`SPEC-002`). Each file is prefixed with `agency-` if not already prefixed. These files are loaded on demand by `routing.mdc`.

---

## Acceptance criteria

- [ ] All 7 template-generated files are created in a `cursor`-platform run
- [ ] `.cursorrules` contains the interpolated project name, language, framework, and test command
- [ ] `.cursor/rules/` contains all 5 `.mdc` files: `core-rules.mdc`, `routing.mdc`, `workflow.mdc`, `review.mdc`, `agents.mdc`
- [ ] `core-rules.mdc` frontmatter contains `alwaysApply: true`
- [ ] `routing.mdc` frontmatter contains `alwaysApply: true`
- [ ] `workflow.mdc`, `review.mdc`, `agents.mdc` frontmatter contains `alwaysApply: false`
- [ ] `.cursorignore` is generated and excludes `vendor/superpowers/` and `vendor/agency-agents/`
- [ ] All files are skipped (not overwritten) without `--force` when they already exist
- [ ] With `--force`, all files are overwritten with fresh rendered content
- [ ] Template conditionals produce language-appropriate content

---

## Dependencies

- `SPEC-004` — template engine (renders all files)
- `SPEC-002` — vendor install (writes `agency-*.mdc` and `.cursor-plugin/plugin.json` after templates)
