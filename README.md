# ai-dev-setup

One command wires your project for structured AI-assisted development: project rules, a workflow engine ([Superpowers](https://github.com/obra/superpowers)), and specialist roles ([Agency Agents](https://github.com/msitarzewski/agency-agents)) — ready in Claude Code or Cursor.

```bash
npx ai-dev-setup init
```

**npm package dependencies:** none. **Your machine:** Node.js **18+**, and (for the vendor step) **`git`** + **`bash`** on PATH.

---

## Why

Without a shared setup, every AI session starts from scratch: re-explain the stack, paste test commands, describe the architecture. Your teammate's session drifts in a different direction.

`ai-dev-setup` solves this once, per project:

- **Structured workflow** — Superpowers gives the AI a phase-gated work engine (`/kickoff` → Understand → Design → Plan → Implement → Review → Ship). It stops the AI from jumping straight to code.
- **Right specialist for the task** — Agency Agents binds a named role (`backend-architect`, `qa-tester`, `security-engineer`) to each task. The AI prioritizes that role's concerns, not a generic "helpful assistant" default.
- **Project memory** — Generated files (`.ai/`, `docs/`) hold your stack, conventions, and architecture. Every session — yours, your teammate's, a subagent's — reads the same source of truth.
- **One command, repeatable** — `npx ai-dev-setup init` scaffolds everything. Teammates restore vendored engines with `--vendor-only` after clone.

---

## Superpowers + Agency

**[Superpowers](https://github.com/obra/superpowers)** is a workflow engine. It provides slash commands and skills that break work into structured phases. When you run `/kickoff` on a feature, you get scoped goals, a risk list, and an ordered task plan tied to your repo's actual `test`/`lint`/`build` commands — not a generic outline.

**[Agency Agents](https://github.com/msitarzewski/agency-agents)** are specialist definitions. Each file (`backend-architect`, `qa-tester`, `security-engineer`, etc.) tells the AI which concerns take priority for that role. When bound to a task, the AI thinks as that specialist: a backend architect considers layer separation and DB contracts; a QA tester looks for coverage gaps and edge cases.

**They work together:** Superpowers drives the phases ("how" work flows). Agency locks the specialist role per task ("who" does it). `/implement` wires both: Superpowers orchestrates execution, Agency prepends the specialist context to each implementation step.

After `init`, both are vendored under `vendor/` and wired automatically — `CLAUDE.md` loads them in Claude Code; `routing.mdc` activates them on every Cursor session. No per-session configuration needed.

---

## Quick start

**1.** `cd` to your project root and run:

```bash
npx ai-dev-setup init
```

Or non-interactive (no prompts, both platforms, vendor included):

```bash
npx ai-dev-setup init --yes
```

The CLI detects your stack, writes templates, then clones Superpowers + Agency into `vendor/` (requires `git` + `bash`; takes 1–2 min on first run).

**2.** Commit the scaffold — see [Recommended team workflow](#recommended-team-workflow-no-vendor-in-git) for the `.gitignore` story and how teammates restore `vendor/` after clone.

**3.** Open in your IDE:

**Claude Code** — `CLAUDE.md` auto-loads with your stack identity, Superpowers skills, and Agency agents wired in. Start with:
- `/kickoff` — scope a feature: goals, risks, and an ordered task plan with an Agency specialist assigned per task
- `/implement` — execute the plan with Agency specialists bound to each implementation step
- `/review` / `/ship` — pre-merge checklist and release readiness

**Cursor** — `routing.mdc` (always-on rule) routes every session automatically. Ask about a feature, bug, or refactor in plain language — the right Superpowers skill and Agency role activate without extra setup. Enable the workspace Superpowers plugin in Cursor settings if your version requires it.

**4.** Fill in `docs/ARCHITECTURE.md` and skim `.ai/rules.md` to adjust conventions for your project.

---

## Recommended team workflow (no `vendor/` in git)

This is the **default adoption path** we recommend: small git history, explicit security posture, one non-interactive command for teammates.

1. **Maintainer** generates the **scaffold** without vendored trees (or removes `vendor/` after a local full run), then commits everything **except** `vendor/`:

   ```bash
   npx ai-dev-setup init --yes --skip-vendor
   ```

   Every **`init`** (including **`--skip-vendor`** and **`--vendor-only`**) **merges** a small managed section into **`.gitignore`** so **`/vendor/`** is ignored by default—reducing the chance of accidentally committing large vendored trees. If you use an older CLI or deleted that block, add **`/vendor/`** yourself.

2. **Commit** the scaffold: `.ai/`, `docs/`, and whatever **`init`** generated for the platforms you chose (e.g. Claude Code: `CLAUDE.md`, `.claude/`, `.claudeignore`; Cursor: `.cursorrules`, `.cursor/rules/*.mdc`, `.cursorignore`; `.cursor-plugin/` when present from the vendor step).

3. **Teammates** (after `git clone` and `npm install`): run **vendor only** — this does **not** rewrite templates and does **not** use interactive prompts:

   ```bash
   npx ai-dev-setup init --vendor-only --platforms=claude,cursor
   ```

   **Pin upstream refs** for reproducible installs (tags preferred over floating `main`):

   ```bash
   npx ai-dev-setup init --vendor-only --platforms=claude,cursor --superpowers-ref=v5.0.7 --agency-ref=main
   ```

4. **Optional — `package.json` script** in your app (keeps pins in one place):

   ```json
   {
     "devDependencies": {
       "ai-dev-setup": "^1.0.0"
     },
     "scripts": {
       "vendor:ai": "ai-dev-setup init --vendor-only --platforms=claude,cursor --superpowers-ref=v5.0.7 --agency-ref=main"
     }
   }
   ```

   Teammates run: `npm run vendor:ai` (after `npm install`).

**Important:** `npm install` **only** installs the `ai-dev-setup` package into `node_modules`. It does **not** clone Superpowers or Agency Agents. Populating `vendor/` always requires running **`init --vendor-only`** (or a full `init` without `--skip-vendor`) explicitly.

### Claude Code: SessionStart hook and slash commands

- **`.claude/settings.json`** includes a **SessionStart** hook that runs `vendor/superpowers/hooks/session-start`, injecting Superpowers **using-superpowers** at session start (same script as upstream; paths use `$CLAUDE_PROJECT_DIR`). **Without `vendor/superpowers/`**, the hook has nothing to run—use `init --vendor-only` after clone.
- **`/kickoff`, `/implement`, `/review`, `/ship`** each start with a **Superpowers phase gate**: named skills under `.claude/skills/` (e.g. `using-superpowers`, `writing-plans`, `subagent-driven-development`, `verification-before-completion`) **plus** existing Agency rules (`subagent_type`, `_index.json`). If skills are missing, refresh with `init --vendor-only --force`.
- **Pinning** `--superpowers-ref` to a tag reduces drift if upstream renames skill folders.

---

## What gets generated

### Templates (full `init`; skipped with `--vendor-only`)

```text
.ai/
  rules.md
  workflow.md
  agents.md
docs/
  ARCHITECTURE.md
  CONVENTIONS.md
  TESTING-STRATEGY.md
  API-PATTERNS.md
  ERROR-HANDLING.md
  SECURITY.md
```

**`.gitignore`:** each **`init`** merges in a managed **`/vendor/`** block (safe with existing rules).

**Claude Code** (when `claude` is selected): `CLAUDE.md`, `.claude/settings.json` (permissions + **SessionStart** hook → vendored Superpowers), `.claude/commands/*` (`/kickoff`, `/implement`, `/review`, `/ship`), **`.claudeignore`**.

**Cursor** (when `cursor` is selected): `.cursorrules`, `.cursor/rules/core-rules.mdc`, `routing.mdc`, `workflow.mdc`, `review.mdc`, `agents.mdc`, **`.cursorignore`**.

> **Cursor:** `.cursorignore` excludes `vendor/superpowers/` and `vendor/agency-agents/` from indexing by default. Remove those lines if your workflow needs them visible in Cursor's file tree.

### Vendor step (`--vendor-only` or full `init` without `--skip-vendor`)

| Path | Purpose |
|------|---------|
| `vendor/superpowers/` | Superpowers (shallow clone) |
| `vendor/agency-agents/` | Agency Agents (shallow clone) |
| `.cursor-plugin/plugin.json` | Points at `vendor/superpowers/` (Cursor) |
| `.claude/skills/` | Superpowers skills (Claude Code) |
| `.claude/agents/` | Agency agent files, project-local |
| `.cursor/rules/agency-*.mdc` | Agency specialist rules (Cursor) |

`convert.sh` runs **only when Cursor is selected**. To commit `vendor/` instead, remove the managed block from `.gitignore` (between `# --- ai-dev-setup: vendor (managed) ---` and `# --- end ai-dev-setup vendor ---`).

---

## CLI reference

| Flag | Meaning |
|------|---------|
| `-y`, `--yes` | Non-interactive full `init` (templates + vendor unless `--skip-vendor`) |
| `-f`, `--force` | Overwrite templates **and** refresh vendor checkouts |
| `--skip-vendor` | Templates only (mutually exclusive with `--vendor-only`) |
| `--vendor-only` | Vendor step only; no template writes |
| `--superpowers-ref=REF` | Branch/tag for Superpowers (default: `main`; validated) |
| `--agency-ref=REF` | Branch/tag for Agency (default: `main`; validated) |
| `--stack=a,b` | Merge stack keys with auto-detect |
| `--platforms=a,b` | `claude`, `cursor` (default: both when omitted) |
| `-h`, `--help` | Help |
| `-v`, `--version` | Version |

---

## Supported platforms

| Key | What you get |
|-----|----------------|
| `claude` | `CLAUDE.md`, `.claude/`, skills + Agency agents when vendor runs |
| `cursor` | `.cursorrules`, `.cursor/rules/`, `.cursor-plugin`, `agency-*.mdc` when vendor runs |

---

## Supported stacks (auto-detect + `--stack`)

| Key | Meaning |
|-----|---------|
| `ts` | TypeScript |
| `react` | React |
| `nextjs` | Next.js |
| `node` | Node HTTP APIs |
| `nestjs` | NestJS |
| `python` | Python |
| `go` | Go |
| `flutter` | Flutter / Dart |

Auto-detected from `package.json`, `tsconfig.json`, `next.config.*`, `nest-cli.json`, `go.mod`, `pyproject.toml` / `requirements.txt`, and `pubspec.yaml`. Override or extend with `--stack=ts,react`.

---

## Security and trust

- **This package** does not register a `postinstall` script. Running the vendor step is **always explicit** (`init` or your own script).
- **Git refs** passed to `git clone -b` are validated (alphanumeric branch/tag style only) to reduce misuse.
- **Advanced (optional):** if your team adds a **consumer** `postinstall` that runs `vendor:ai`, document it, skip when `CI=true`, and expect some environments to use `npm install --ignore-scripts`.

---

## Escape hatch: manual clone

If you used `--skip-vendor` or `--vendor-only` is not an option:

```bash
git clone --depth 1 --branch main https://github.com/obra/superpowers.git vendor/superpowers
git clone --depth 1 --branch main https://github.com/msitarzewski/agency-agents.git vendor/agency-agents
```

For Cursor Agency rules, run `bash scripts/convert.sh` in `vendor/agency-agents`, then copy `integrations/cursor/rules/*.mdc` to `.cursor/rules/` with an `agency-` prefix — or use **`init --vendor-only`** when you can.

---

## Troubleshooting

| Problem | What to do |
|---------|------------|
| Scaffold committed; need `vendor/` only | `npx ai-dev-setup init --vendor-only --platforms=claude,cursor` |
| `git is required` / clone errors | Install Git; check network; use valid refs |
| `bash is required` | Git Bash / WSL, or `--platforms=claude` |
| `Invalid git ref` | Use only safe branch/tag characters (see `--superpowers-ref` / `--agency-ref`) |
| `Cannot use --skip-vendor with --vendor-only` | Pick one mode |
| `npm install` did not create `vendor/` | Expected. Run `init --vendor-only` or `npm run vendor:ai` |
| Huge repo if committing `vendor/` | Use **Recommended team workflow** instead |
| Updates needed | Re-run `init --yes --force` or `init --vendor-only --force` with pinned refs |

---

## Development (this package)

```bash
git clone <repo> && cd ai-dev-setup
npm test
node bin/ai-dev-setup.js --help
```

---

## License

MIT — see [LICENSE](./LICENSE).
