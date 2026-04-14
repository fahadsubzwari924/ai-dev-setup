# README Redesign Implementation Plan

> **For agentic workers:** Dispatch as `@agency-technical-writer.mdc` — prepend that rule reference at the top of every implementation subagent prompt before any task content. Superpowers:subagent-driven-development governs the transport/isolation; `@agency-technical-writer.mdc` governs the persona. Both are required. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite `README.md` from 253 scattered lines into a lean (~120–155 line) solo-user-first, action-first single file following the approved design spec.

**Architecture:** Single file replacement. The existing `README.md` is overwritten in full. No other files are created or modified. All content from the current README is either preserved verbatim, trimmed, or consolidated — nothing is silently dropped.

**Tech Stack:** Markdown. No build step. Verified by manual checklist against acceptance criteria in `specs/2026-04-14-readme-redesign-design.md`.

**Agency:** `@agency-technical-writer.mdc`

**Spec:** `specs/2026-04-14-readme-redesign-design.md`

---

## File map

| Action | Path | What changes |
|--------|------|-------------|
| Modify | `README.md` | Full rewrite — 253 lines → ~120–155 lines |

---

### Task 1: Rewrite README.md

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Verify the current line count and open the file**

Run:
```bash
wc -l README.md
```
Expected output: `253 README.md`

- [ ] **Step 2: Replace the full content of README.md**

Write the following content exactly — no additions, no omissions:

```markdown
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
- **git** and **bash** on PATH (required for the vendor step)

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
| `Invalid git ref` | Use only safe branch/tag characters |
| `--skip-vendor` conflicts with `--vendor-only` | Pick one mode |
| Need to update engines | `init --vendor-only --force` with pinned refs |
| Manual clone needed | `git clone --depth 1 https://github.com/obra/superpowers.git vendor/superpowers` |

---

## Security

This package has no `postinstall` script — the vendor step is always explicit. Git refs are validated (alphanumeric only) before being passed to `git clone`.

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
```

- [ ] **Step 3: Verify line count is within target**

Run:
```bash
wc -l README.md
```
Expected: between 120 and 175.

- [ ] **Step 4: Run the acceptance checklist**

Check each item manually:

```
[ ] Install command appears within the first 10 lines
    → grep -n "npx ai-dev-setup init" README.md — line number must be ≤ 10

[ ] All 10 CLI flags are present
    → --yes, --force, --skip-vendor, --vendor-only, --superpowers-ref,
       --agency-ref, --stack, --platforms, --help, --version

[ ] No content silently dropped
    → Confirm: Superpowers/Agency explanation present (How it works)
    → Confirm: vendor/ note present (Team workflow > Note callout)
    → Confirm: SessionStart hook info removed intentionally (implementation detail, not user-facing)
    → Confirm: escape hatch present (Troubleshooting > Manual clone row)
    → Confirm: docs/ARCHITECTURE.md fill-in hint present (What gets generated)

[ ] Three real badge shields present
    → npm version shield points to npmjs.com/package/ai-dev-setup
    → MIT license shield present
    → Node ≥ 18 shield present

[ ] Troubleshooting table includes manual clone row
    → Last row: "Manual clone needed"

[ ] "Supported platforms" appears only once (merged into Platforms & stacks)

[ ] "Supported stacks" appears only once (merged into Platforms & stacks)
```

- [ ] **Step 5: Hand off for review**

Do not commit. Present the updated `README.md` to the user for review. Wait for explicit approval before any git operations.

---

## Self-review against spec

**Spec coverage check:**

| Spec requirement | Task / Step |
|---|---|
| Install command within first 10 lines | Task 1 Step 2 (line 9) + Step 4 checklist |
| Real badges: npm, MIT, Node ≥ 18 | Task 1 Step 2 (lines 3–5) + Step 4 checklist |
| No ToC | Confirmed — no ToC in Step 2 content |
| Hero: 4 "What it does" bullets | Task 1 Step 2 (lines 13–17) |
| Prerequisites block | Task 1 Step 2 |
| Quick Start: 3 steps | Task 1 Step 2 |
| How it works: trimmed Superpowers + Agency | Task 1 Step 2 |
| Annotated file tree | Task 1 Step 2 |
| Team workflow as command blocks | Task 1 Step 2 |
| All 10 CLI flags | Task 1 Step 4 checklist |
| Platforms & stacks merged | Task 1 Step 2 + Step 4 checklist |
| Troubleshooting with manual clone row | Task 1 Step 2 + Step 4 checklist |
| Security trimmed to 2 sentences | Task 1 Step 2 |
| Contributing links to specs/ | Task 1 Step 2 |
| Line count 120–175 | Task 1 Step 3 |
| No commit until user review | Task 1 Step 5 (hand-off only) |

**Placeholder scan:** No TBD, TODO, or vague instructions present. Every step includes exact commands with expected output or exact file content.

**Consistency:** Single task, single file — no cross-task type conflicts.
