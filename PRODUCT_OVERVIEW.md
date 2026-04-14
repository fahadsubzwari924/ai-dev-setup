# ai-dev-setup — Product Overview

## What it is

`ai-dev-setup` is an npm CLI that scaffolds a structured AI-assisted development workflow into any existing project in a single command. It wires together two upstream tools — **[Superpowers](https://github.com/obra/superpowers)** (a phase-gated workflow engine) and **[Agency Agents](https://github.com/msitarzewski/agency-agents)** (specialist role definitions) — for Claude Code and Cursor, and generates a project memory layer that persists across every session.

```bash
npx ai-dev-setup init
```

---

## Problem it solves

Every AI coding session starts from zero. The developer re-explains the stack, pastes test commands, describes architecture, and corrects the AI when it behaves as a generic assistant rather than a domain specialist. Teammates get different behavior from different sessions. Subagents in the same workflow don't share context.

`ai-dev-setup` installs three persistent layers that survive session restarts, teammate clones, and subagent dispatch:

1. **Workflow engine** — Superpowers provides phase-gated slash commands (`/kickoff → /implement → /review → /ship`). The AI cannot skip planning or jump straight to code; it scopes goals, lists risks, and produces an ordered task plan first.
2. **Specialist roles** — Agency Agents binds a named role (`backend-architect`, `qa-tester`, `security-engineer`) to each task. The AI prioritizes that role's concerns instead of defaulting to generic behavior.
3. **Project memory** — Generated files (`.ai/`, `docs/`) hold your stack, conventions, and architecture. Every session — yours, your teammate's, a subagent's — reads the same source of truth.

---

## Target users

### Solo power-user
Uses Claude Code or Cursor daily. Runs `npx ai-dev-setup init` once per project. Expects structured, reproducible AI behavior without per-session setup. Primary need: the AI should remember the stack and behave as a specialist, not a generalist.

### Team maintainer
Runs `ai-dev-setup init` in a shared repo, commits the scaffold, and controls vendor refs (Superpowers/Agency versions) and platform configuration. Responsible for keeping project memory files (`docs/`, `.ai/`) up to date as the project evolves.

### Teammate / consumer
Joins a project that already has the scaffold committed. Runs `npx ai-dev-setup init --vendor-only` (or a `npm run vendor:ai` alias) after `git clone`. Gets identical AI behavior to the maintainer with zero additional configuration.

---

## Core value propositions

| Value | Outcome |
|---|---|
| Structured workflow | AI cannot skip planning; phase gates enforce quality before code |
| Specialist identity | Each task gets the right specialist role, not a generic assistant default |
| Shared project memory | One source of truth for every session, every teammate, every subagent |
| One command, repeatable | `init` scaffolds everything; teammates restore engines with `--vendor-only` |

---

## Product scope

### In scope

- CLI scaffold generation for Claude Code and Cursor IDE platforms
- Vendor cloning of Superpowers and Agency Agents from upstream Git repositories
- Project stack auto-detection from lockfiles and config files
- Template rendering and file writing for `.ai/`, `docs/`, and all platform-specific files
- Managed `.gitignore` block for `vendor/` to prevent accidental commits
- Agency rules conversion for Cursor (via upstream `convert.sh`)
- Agency agent index generation for Claude Code (`_index.json` — authoritative `subagent_type` map)
- Git ref pinning for reproducible vendor installs (`--superpowers-ref`, `--agency-ref`)

### Explicitly out of scope

- Runtime AI session behavior (Superpowers and Agency govern this; `ai-dev-setup` only installs them)
- AI model integration or API key management
- Content of `docs/ARCHITECTURE.md` (generated as a placeholder; the maintainer fills it in)
- Hosting, versioning, or publishing of Superpowers or Agency Agents (those are upstream repos)
- `postinstall` scripts — the vendor step is always explicit, never auto-runs on `npm install`
- Linting, formatting, CI pipeline setup, or any other tooling for consumer projects

---

## Integration boundary

```
ai-dev-setup (this package)
  ↓ clones
vendor/superpowers/           ← Superpowers (upstream: obra/superpowers)
vendor/agency-agents/         ← Agency Agents (upstream: msitarzewski/agency-agents)
  ↓ writes wiring files into
.claude/skills/               ← Claude Code: Superpowers skills
.claude/agents/               ← Claude Code: Agency agent definitions
.claude/agents/_index.json    ← Claude Code: authoritative subagent_type manifest
.cursor-plugin/plugin.json    ← Cursor: Superpowers plugin path wiring
.cursor/rules/agency-*.mdc    ← Cursor: Agency specialist rules
```

`ai-dev-setup` is responsible for the **scaffold and wiring step only**. Everything that happens during an AI session — skill invocation, phase gating, role dispatch — is governed by Superpowers and Agency. This boundary must not be crossed when developing this package.

---

## Supported platforms

| Key | What is scaffolded |
|---|---|
| `claude` | `CLAUDE.md`, `.claude/settings.json`, `.claude/commands/*.md`, `.claudeignore` + vendor: skills + agents |
| `cursor` | `.cursorrules`, `.cursor/rules/*.mdc`, `.cursorignore` + vendor: `agency-*.mdc`, `.cursor-plugin/plugin.json` |

---

## Supported stacks (auto-detected)

| Key | Detected from |
|---|---|
| `ts` | `tsconfig.json` |
| `react` | `react` in deps |
| `nextjs` | `next` dep or `next.config.*` |
| `nestjs` | `@nestjs/core` dep or `nest-cli.json` |
| `node` | `express`, `fastify`, `koa`, or `hapi` dep |
| `python` | `pyproject.toml` or `requirements.txt` |
| `go` | `go.mod` |
| `flutter` | `pubspec.yaml` |

All keys can also be passed explicitly via `--stack=ts,react` and merged with auto-detected values.

---

## Success signals

- A developer runs `npx ai-dev-setup init` in any project and gets structured AI behavior in Claude Code or Cursor with zero per-session configuration
- Teammates restore vendor engines with a single command after `git clone`
- Any AI session in the project reads the same source of truth as any other session
- Vendor installs are reproducible via `--superpowers-ref` and `--agency-ref` pins
- The AI treats every task with the correct specialist role, never a generic assistant default

---

## Key references

| Topic | File |
|---|---|
| Feature specifications | `specs/README.md` |
| Architecture and module layout | `CLAUDE.md` (see also `src/` structure) |
| Engineering rules | `.ai/rules.md` |
| Workflow lifecycle | `.ai/workflow.md` |
| Agent roles | `.ai/agents.md` |
