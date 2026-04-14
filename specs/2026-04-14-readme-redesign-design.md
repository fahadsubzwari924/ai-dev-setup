# Design: README Redesign
**Date:** 2026-04-14
**Status:** Approved
**Author:** Brainstorming session

---

## Goal

Redesign the root `README.md` from 253 scattered lines into a lean (~120–150 line), well-structured single file optimised for the solo power user landing from npm or GitHub.

---

## Constraints

| Decision | Choice |
|---|---|
| Primary audience | Solo power user (Claude Code / Cursor daily user) |
| Target length | ~120–150 lines, single file |
| Install command position | Absolute top — within the first 10 lines |
| Badges | Real shields: npm version, MIT license, Node ≥ 18 |
| Navigation | No ToC — clean headers carry it at this length |
| Approach | "Act first, learn later" — install command before explanation |

---

## Section structure

### 1. Hero (lines ~1–18)

- `# ai-dev-setup` heading
- 3 real badges: npm version, MIT license, Node ≥ 18
- One-liner tagline
- Install command in a fenced bash block
- **What it does** — 4 tight bullets replacing the old "Why" + "Superpowers + Agency" sections:
  1. Phase-gated workflow engine (Superpowers) — scopes and plans before coding
  2. Specialist roles (Agency Agents) bound per task
  3. Project memory layer (`.ai/`, `docs/`) shared across sessions and teammates
  4. Works in Claude Code and Cursor — no per-session configuration after init

### 2. Prerequisites (lines ~19–23)

- Node.js 18+
- `git` and `bash` on PATH

### 3. Quick Start (lines ~24–45)

Three numbered steps:
1. `npx ai-dev-setup init` — with note on stack detection and vendor clone time
2. `git add . && git commit -m "chore: add ai-dev-setup scaffold"` — concrete and copy-pasteable
3. IDE-specific usage — Claude Code slash commands (`/kickoff`, `/implement`, `/review`) and Cursor plain-language usage

### 4. How it works (lines ~46–60)

Three short paragraphs:
- Superpowers: phase-gated engine, slash commands, what they prevent
- Agency Agents: specialist role definitions, how binding works
- Together: Superpowers = phases, Agency = specialist per task, both wired automatically after `init`

### 5. What gets generated (lines ~61–78)

Annotated file tree — each path has a one-line description:
```
.ai/                    # Engineering rules, workflow, agent roles
docs/                   # Architecture, conventions, API patterns, security
CLAUDE.md               # Claude Code: stack identity + wiring
.claude/                # Settings, slash commands, skills, agent definitions
.cursorrules            # Cursor: always-on routing
.cursor/rules/          # Workflow, review, agent specialist rules
vendor/superpowers/     # Superpowers engine (gitignored)
vendor/agency-agents/   # Agency Agents (gitignored)
```
Followed by: "Fill in `docs/ARCHITECTURE.md` and skim `.ai/rules.md` to tune conventions for your project."

### 6. Team workflow (lines ~79–103)

Two labelled command blocks (Maintainer / Teammates) replacing current prose. Includes:
- `--skip-vendor` path for maintainer
- `--vendor-only` path for teammates
- Pinning example with `--superpowers-ref` and `--agency-ref`
- `package.json` script example for keeping pins in one place
- `> Note:` callout that `npm install` does not populate `vendor/`

### 7. CLI reference (lines ~104–118)

Unchanged table. All 10 flags preserved.

### 8. Platforms & stacks (lines ~119–125)

Two duplicate sections from current README merged into:
- One 2-row platform table (claude / cursor)
- One line listing auto-detected stack keys with `--stack` override note

### 9. Troubleshooting (lines ~126–137)

Unchanged problem/fix table with one addition: manual clone folded in as the last row (replaces standalone "Escape hatch" section).

### 10. Security (lines ~138–140)

Trimmed to 2 sentences: no `postinstall` script, git refs validated.

### 11. Contributing (lines ~141–147)

3-line bash block + link to `specs/README.md`.

### 12. License (lines ~148–150)

MIT + LICENSE link.

---

## What is removed / consolidated

| Current section | Action |
|---|---|
| "Why" (standalone section) | Merged into Hero "What it does" bullets |
| "Superpowers + Agency" (standalone section) | Replaced by "How it works" (trimmed ~70%) |
| "Supported platforms" (standalone section) | Merged into "Platforms & stacks" |
| "Supported stacks" (standalone section) | Merged into "Platforms & stacks" |
| "Escape hatch: manual clone" (standalone section) | Folded into Troubleshooting table (last row) |
| "Claude Code: SessionStart hook" subsection | Removed — implementation detail, not user-facing |
| Quick Start step 4 (fill in docs) | Moved to end of "What gets generated" |

---

## Acceptance criteria

- [ ] Install command appears within the first 10 lines
- [ ] All 10 CLI flags from the current reference table are present
- [ ] No content from current README is silently dropped (only merged/trimmed)
- [ ] Line count is between 120 and 175
- [ ] Three real badge shields are present and point to correct URLs
- [ ] Troubleshooting table includes the manual clone row
- [ ] `docs/ARCHITECTURE.md` fill-in hint is present (moved to "What gets generated")
- [ ] "Supported platforms" and "Supported stacks" appear only once (merged)
