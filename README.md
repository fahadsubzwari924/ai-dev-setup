# ai-dev-setup

[![npm version](https://img.shields.io/npm/v/ai-dev-setup.svg)](https://www.npmjs.com/package/ai-dev-setup)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Node ≥ 18](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org)

One command wires your project for structured AI-assisted development.

```bash
npx ai-dev-setup init
```

**What it does:**
- Installs a phase-gated workflow engine (Superpowers) so the AI scopes and plans before coding
- Binds specialist roles (Agency Agents) per task — backend architect, QA tester, security engineer, and more
- Generates a project memory layer (`.ai/`, `docs/`) shared across every session, teammate, and subagent
- Works in **Claude Code** and **Cursor** — no per-session configuration after init

---

## Prerequisites

- **Node.js 18+**
- **git** on PATH (required for the vendor step)
- **bash** on PATH (required when the Cursor platform is selected for the vendor step)

---

## Quick Start

**1.** Run in your project root:

```bash
npx ai-dev-setup init
```

The CLI detects your stack, writes the scaffold, then clones Superpowers and Agency Agents into `vendor/`. Takes 1–2 min on first run.

**2.** Commit the scaffold — `vendor/` is gitignored by default:

```bash
git add . && git commit -m "chore: add ai-dev-setup scaffold"
```

**3.** Open in your IDE and start working:

- **Claude Code** — run `/kickoff` to scope a feature, `/implement` to execute with specialist roles bound, `/review` before merge
- **Cursor** — ask about any feature or bug in plain language; the right workflow skill and specialist role activate automatically

---

## How it works

**[Superpowers](https://github.com/obra/superpowers)** is a phase-gated workflow engine. It provides slash commands (`/kickoff → /implement → /review → /ship`) that stop the AI from jumping straight to code — it scopes goals, lists risks, and produces an ordered task plan first.

**[Agency Agents](https://github.com/msitarzewski/agency-agents)** are specialist role definitions. Each file (`backend-architect`, `qa-tester`, `security-engineer`, etc.) tells the AI which concerns take priority. When bound to a task, the AI thinks as that specialist rather than a generic assistant.

**They work together:** Superpowers drives the phases. Agency locks the specialist per task. Both are vendored under `vendor/` and wired automatically after `init` — no per-session setup needed.

---

## What gets generated

```text
.ai/                    # Engineering rules, workflow, agent roles
docs/                   # Architecture, conventions, API patterns, security
CLAUDE.md               # Claude Code: stack identity + wiring
.claude/                # Settings, slash commands, skills, agent definitions
.cursorrules            # Cursor: always-on routing
.cursor/rules/          # Workflow, review, agent specialist rules
.cursor-plugin/         # Cursor: Superpowers plugin path wiring
vendor/superpowers/     # Superpowers engine (gitignored)
vendor/agency-agents/   # Agency Agents (gitignored)
```

Fill in `docs/ARCHITECTURE.md` and skim `.ai/rules.md` to tune conventions for your project.

---

## Team workflow

The recommended path: commit the scaffold, keep `vendor/` out of git.

**Maintainer** (one time):
```bash
npx ai-dev-setup init --yes --skip-vendor
git add . && git commit -m "chore: add ai-dev-setup scaffold"
```

| Path | Purpose |
|------|---------|
| `vendor/superpowers/` | Superpowers (filtered copy; `skills/**/*.ts(x)` stripped to prevent consumer TS compile errors) |
| `vendor/agency-agents/` | Agency Agents (shallow clone) |
| `.cursor-plugin/plugin.json` | Points at `vendor/superpowers/` (Cursor) |
| `.claude/skills/` | Superpowers skills (Claude Code) |
| `.claude/agents/` | Agency agent files, project-local |
| `.cursor/rules/agency-*.mdc` | Agency specialist rules (Cursor) |

**Teammates** (after `git clone`):
```bash
npx ai-dev-setup init --vendor-only --platforms=claude,cursor
```

Pin upstream refs for reproducible installs:
```bash
npx ai-dev-setup init --vendor-only --superpowers-ref=v5.0.7 --agency-ref=main
```

Or add a `package.json` script to keep pins in one place:
```json
"scripts": {
  "vendor:ai": "ai-dev-setup init --vendor-only --platforms=claude,cursor --superpowers-ref=v5.0.7 --agency-ref=main"
}
```

> **Note:** `npm install` does not populate `vendor/`. Always run `init --vendor-only` (or `npm run vendor:ai`) explicitly after clone.

During vendoring, `ai-dev-setup` removes raw TypeScript files under `vendor/superpowers/skills` (for example `*.ts` / `*.tsx` examples that may reference upstream-only path aliases) so your project's `tsc` does not attempt to compile them.

---

## CLI reference

| Flag | Meaning |
|------|---------|
| `-y`, `--yes` | Non-interactive full `init` |
| `-f`, `--force` | Overwrite templates and refresh vendor |
| `--skip-vendor` | Templates only |
| `--vendor-only` | Vendor step only; no template writes |
| `--superpowers-ref=REF` | Branch/tag for Superpowers (default: `main`) |
| `--agency-ref=REF` | Branch/tag for Agency (default: `main`) |
| `--stack=a,b` | Merge stack keys with auto-detect |
| `--platforms=a,b` | `claude`, `cursor` (default: both) |
| `-h`, `--help` | Help |
| `-v`, `--version` | Version |

---

## Platforms & stacks

| Platform | What you get |
|----------|-------------|
| `claude` | `CLAUDE.md`, `.claude/` — skills, agents, slash commands |
| `cursor` | `.cursorrules`, `.cursor/rules/` — routing, agency specialist rules |

Auto-detected stacks: `ts`, `react`, `nextjs`, `node`, `nestjs`, `python`, `go`, `flutter`. Override or extend with `--stack=ts,react`.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `vendor/` missing after clone | `npx ai-dev-setup init --vendor-only` |
| `git is required` / clone errors | Install Git; check network; use valid refs |
| `bash is required` | Git Bash / WSL, or `--platforms=claude` |
| `Invalid git ref` | Use only safe branch/tag characters (see `--superpowers-ref` / `--agency-ref`) |
| `Cannot use --skip-vendor with --vendor-only` | Pick one mode |
| `npm install` did not create `vendor/` | Expected. Run `init --vendor-only` or `npm run vendor:ai` |
| TypeScript errors from `vendor/superpowers/skills/*.ts` in consumer repo | Upgrade `ai-dev-setup`, then run `npx ai-dev-setup init --vendor-only --force` |
| Stale or broken `vendor/` | `init --vendor-only --force` with pinned refs |
| Manual clone needed | `git clone --depth 1 -b main https://github.com/obra/superpowers.git vendor/superpowers` |
| Huge repo if committing `vendor/` | Use **Team workflow** above instead |
| Updates needed | Re-run `init --yes --force` or `init --vendor-only --force` with pinned refs |

---

## Security

This package has no `postinstall` script — the vendor step is always explicit. Git refs are validated (letters, digits, and `. _ / -` only — no spaces or shell metacharacters) before being passed to `git clone`.

---

## Contributing

```bash
git clone <repo> && cd ai-dev-setup
npm test
node bin/ai-dev-setup.js --help
```

Feature specs live in [`specs/`](./specs/README.md).

---

## License

MIT — see [LICENSE](./LICENSE).
