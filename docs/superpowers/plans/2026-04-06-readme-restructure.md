# README Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure root `README.md` to be action-first and concise per [the design spec](../specs/2026-04-06-readme-restructure-design.md), moving deep content into linked docs under `docs/` with no CLI or template behavior changes.

**Architecture:** Split the monolithic README into one short landing page (value prop, decision table, 3-step quickstart, expectations, small command + troubleshooting tables, doc index) and five focused markdown files under `docs/guide/` and `docs/reference/`. Preserve factual accuracy by migrating text from the current README rather than paraphrasing flags or paths.

**Tech Stack:** Markdown only; repository tests remain `npm test` (`node --test`). No `src/` changes.

**Note on TDD:** This work is documentation-only. Verification is `npm test` (expect unchanged PASS) plus manual link and acceptance checklist review against the spec.

---

## File map

| File | Role |
|------|------|
| `README.md` | Short landing: paths, quickstart, expectations, core commands, troubleshooting teaser, links |
| `docs/guide/team-adoption.md` | Maintainer / teammate workflow, `package.json` script example, `npm install` vs vendor clarification |
| `docs/reference/cli.md` | Full flag table, commands, usage recipe table |
| `docs/reference/generated-output.md` | Template and vendor output trees, `.gitignore` behavior, committing `vendor/`, escape hatch, `convert.sh` |
| `docs/reference/platforms-and-stacks.md` | Platform keys, stack keys, detection summary |
| `docs/guide/using-superpowers-and-agency.md` | Post-init usage, examples, token layout, risk register, extended checklist |

---

### Task 1: Add team adoption guide

**Files:**
- Create: `docs/guide/team-adoption.md`
- Test: `npm test` (after all tasks; no doc tests in repo)

- [ ] **Step 1: Create `docs/guide/team-adoption.md` with this exact content**

````markdown
# Team adoption (no `vendor/` in git)

This is the **default adoption path** we recommend: small git history, explicit security posture, one non-interactive command for teammates.

1. **Maintainer** generates the **scaffold** without vendored trees (or removes `vendor/` after a local full run), then commits everything **except** `vendor/`:

   ```bash
   npx ai-dev-setup init --yes --skip-vendor
   ```

   Every **`init`** (including **`--skip-vendor`** and **`--vendor-only`**) **merges** a small managed section into **`.gitignore`** so **`/vendor/`** is ignored by default—reducing the chance of accidentally committing large vendored trees. If you use an older CLI or deleted that block, add **`/vendor/`** yourself.

2. **Commit** the scaffold: `.ai/`, `docs/`, `CLAUDE.md`, `.claude/`, `.cursorrules`, `.cursor/rules/*.mdc`, `.cursor-plugin/` (if present from a prior run), `.claudeignore`, `.cursorignore`.

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
````

- [ ] **Step 2: Commit**

```bash
git add docs/guide/team-adoption.md
git commit -m "docs: add team adoption guide for README split"
```

---

### Task 2: Add CLI reference doc

**Files:**
- Create: `docs/reference/cli.md`

- [ ] **Step 1: Create `docs/reference/cli.md` with this exact content**

```markdown
# CLI reference — ai-dev-setup

## Commands

| Command | Notes |
|---------|--------|
| `init` | Default when you run `npx ai-dev-setup` |
| `update` | Placeholder |

## Flags

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

## Usage examples

| Goal | Command |
|------|---------|
| Full setup, both tools, no questions | `npx ai-dev-setup init --yes` |
| **Templates only** (commit scaffold; ignore `vendor/`) | `npx ai-dev-setup init --yes --skip-vendor` |
| **Vendor only** (after clone; do not overwrite templates) | `npx ai-dev-setup init --vendor-only --platforms=claude,cursor` |
| **Claude Code only** | `npx ai-dev-setup init --yes --platforms=claude` |
| **Cursor only** | `npx ai-dev-setup init --yes --platforms=cursor` |
| Overwrite templates + refresh `vendor/` | `npx ai-dev-setup init --yes --force` |
| Pin upstream branches/tags | `npx ai-dev-setup init --yes --superpowers-ref=v5.0.7 --agency-ref=main` |
| Help | `npx ai-dev-setup --help` |

**Note:** `npx ai-dev-setup` defaults to `init`.
```

- [ ] **Step 2: Commit**

```bash
git add docs/reference/cli.md
git commit -m "docs: add CLI reference extracted from README"
```

---

### Task 3: Add generated output and vendors reference

**Files:**
- Create: `docs/reference/generated-output.md`

- [ ] **Step 1: Create `docs/reference/generated-output.md` with this exact content**

````markdown
# Generated files and vendor layout

## Templates (full `init`; skipped with `--vendor-only`)

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
.claudeignore
.cursorignore
```

**`.gitignore`:** each **`init`** merges in a managed **`/vendor/`** block (safe with existing rules); not listed above as a static template file.

**Claude Code** (when `claude` is selected): `CLAUDE.md`, `.claude/settings.json`, `.claude/commands/*`.

**Cursor** (when `cursor` is selected): `.cursorrules`, `.cursor/rules/core-rules.mdc`, `routing.mdc` (defaults to Superpowers + Agency), `workflow.mdc`, `review.mdc`, `agents.mdc`.

## Vendor step (`--vendor-only` or full `init` without `--skip-vendor`)

| Path | Purpose |
|------|---------|
| `vendor/superpowers/` | Superpowers (shallow clone) |
| `vendor/agency-agents/` | Agency Agents (shallow clone) |
| `.cursor-plugin/plugin.json` | Points at `vendor/superpowers/` (Cursor) |
| `.claude/skills/` | Superpowers skills (Claude) |
| `.claude/agents/` | Agency agents, project-local |
| `.cursor/rules/agency-*.mdc` | Agency Cursor rules |

`convert.sh` runs **only when Cursor is selected**.

**Alternative:** commit `vendor/` so clones need no second step — at the cost of a large repo. **To do that**, remove the **ai-dev-setup** managed block from **`.gitignore`** (from `# --- ai-dev-setup: vendor (managed) ---` through `# --- end ai-dev-setup vendor ---`) or otherwise stop ignoring **`vendor/`**, then commit the `vendor/` directory as usual.

## Escape hatch: manual clone

If you used `--skip-vendor` or `--vendor-only` is not an option:

```bash
git clone --depth 1 --branch main https://github.com/obra/superpowers.git vendor/superpowers
git clone --depth 1 --branch main https://github.com/msitarzewski/agency-agents.git vendor/agency-agents
```

For Cursor Agency rules, run `bash scripts/convert.sh` in `vendor/agency-agents`, then copy `integrations/cursor/rules/*.mdc` to `.cursor/rules/` with an `agency-` prefix — or use **`init --vendor-only`** when you can.

## Token optimization

| File | Role |
|------|------|
| `CLAUDE.md` / `.cursorrules` | Short index |
| `.ai/*.md` | Shared standards |
| `docs/*.md` | Deeper references |
| `core-rules.mdc` | Small **alwaysApply** surface |
````

- [ ] **Step 2: Commit**

```bash
git add docs/reference/generated-output.md
git commit -m "docs: add generated output and vendor reference"
```

---

### Task 4: Add platforms and stacks reference

**Files:**
- Create: `docs/reference/platforms-and-stacks.md`

- [ ] **Step 1: Create `docs/reference/platforms-and-stacks.md` with this exact content**

```markdown
# Supported platforms and stacks

## Platforms

| Key | What you get |
|-----|----------------|
| `claude` | `CLAUDE.md`, `.claude/`, skills + Agency agents when vendor runs |
| `cursor` | `.cursorrules`, `.cursor/rules/`, `.cursor-plugin`, `agency-*.mdc` when vendor runs |

## Stacks (auto-detect + `--stack`)

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

Detection uses `package.json`, `tsconfig.json`, `next.config.*`, `nest-cli.json`, `go.mod`, `pyproject.toml` / `requirements.txt`, `pubspec.yaml`, and common dependencies.
```

- [ ] **Step 2: Commit**

```bash
git add docs/reference/platforms-and-stacks.md
git commit -m "docs: add platforms and stacks reference"
```

---

### Task 5: Add Superpowers / Agency usage guide

**Files:**
- Create: `docs/guide/using-superpowers-and-agency.md`

- [ ] **Step 1: Create `docs/guide/using-superpowers-and-agency.md` with this exact content**

```markdown
# Using Superpowers and Agency after `init`

After **`init`** has finished (full run **or** **`init --vendor-only`** so `vendor/` exists), you can start using the setup in plain language. **Superpowers + Agency are the default** for both tools once vendored content exists—**Cursor** also ships **`routing.mdc`** so that default applies without you naming plugin paths each chat. Exact UI (slash menus, rules picker) depends on your **Claude Code** or **Cursor** version; the ideas below always apply.

## Example — Claude Code: `/kickoff` on a small feature

1. Open the **project root** in Claude Code.
2. Let the session load **`CLAUDE.md`** (stack, commands, and where **Superpowers** / **Agency** live under `vendor/`).
3. Run **`/kickoff`** and describe one feature, e.g. *“Add a `/health` JSON route and tests.”*
4. That command is aligned with **`.ai/workflow.md`**: you get scoped goals, risks, and a task list tied to your repo’s **test/lint/build** commands—your first practical use of the **Superpowers-style** planning loop without naming individual skills.

## Example — Cursor: one chat, workflow + Superpowers

1. Open the project in Cursor.
2. If needed, enable the workspace **Superpowers** plugin (see checklist below).
3. In chat, ask something specific, e.g. *“Read `.cursorrules` and `.ai/workflow.md`. I need to fix a bug in `[path/to/file]`. Propose a short plan, then implement.”*
4. **`.cursor/rules/`** (workflow, review, agents) plus **Superpowers** (via **`.cursor-plugin`** → `vendor/superpowers/`) keep the assistant in a structured flow; you do not need to hand-edit those paths each time.

## More examples — Agency specialists

1. Open **`.ai/agents.md`** and skim the **Engineering** and **Quality** tables (e.g. tests, review, security).
2. Ask the assistant to work in that role, e.g. *“Using the testing specialist from `.ai/agents.md`, review tests for `[module]` and list missing cases.”*
3. **Claude Code** maps this to **`.claude/agents/`**. **Cursor** maps to **`agency-*.mdc`** under **`.cursor/rules/`** when the task matches that specialist.

## Superpowers + Agency (core behavior)

- **Superpowers** — workflow engine under `vendor/superpowers`, `.claude/skills/`, `.cursor-plugin`.
- **Agency** — specialists: `agency-*.mdc`, `.claude/agents/`.
- Generated docs treat both as **required** for this scaffold.

## After `init`: checklist

1. Fill in **`docs/ARCHITECTURE.md`** (and other `docs/*` as needed).
2. Skim **`.ai/rules.md`** and adjust for your team.
3. **Commit** scaffold files (including **`.gitignore`**). If you use **templates-only** flow, **do not commit** `vendor/`; **`.gitignore`** should already list **`/vendor/`** from `init`. Ensure teammates run **`--vendor-only`** (or your `vendor:ai` script) after clone.
4. In **Cursor**, enable the workspace **Superpowers** plugin if your Cursor version requires it.
5. **`.cursorignore`** lists **`vendor/superpowers/`** and **`vendor/agency-agents/`** so Cursor indexes less of the vendored trees (fewer noisy imports and search hits). If that hides files your workflow or the Superpowers plugin needs in the UI, remove or narrow those lines.
6. **Updates:** re-run `init --yes --force` or `init --vendor-only --force` with pinned refs, or `git pull` inside `vendor/*` manually.

## Risk register

- Upstream layout may change. Pin with `--superpowers-ref` / `--agency-ref`.
- Cursor plugin behavior may vary by version.
- Vendor failures are **loud** (non-zero exit).
```

- [ ] **Step 2: Commit**

```bash
git add docs/guide/using-superpowers-and-agency.md
git commit -m "docs: add Superpowers and Agency usage guide"
```

---

### Task 6: Replace root README with concise landing page

**Files:**
- Modify: `README.md` (full replacement)

- [ ] **Step 1: Replace `README.md` entirely with this exact content**

````markdown
# ai-dev-setup

**One command** scaffolds a **token-aware** AI assistant setup for **Claude Code** and **Cursor**: shared rules (`.ai/`, `docs/`), tool-specific entrypoints, plus **vendored [Superpowers](https://github.com/obra/superpowers)** (workflow engine) and **[Agency Agents](https://github.com/msitarzewski/agency-agents)** (specialists) in your project.

**This package** has no npm dependencies. **Your machine:** Node.js **18+**; for the vendor step you also need **`git`** and **`bash`** on PATH.

## Choose your path

| You want… | Run |
|-----------|-----|
| Interactive first run | `npx ai-dev-setup init` |
| Full setup, no prompts (templates + vendor) | `npx ai-dev-setup init --yes` |
| Scaffold only; do **not** put `vendor/` in git (team default) | `npx ai-dev-setup init --yes --skip-vendor` → then see [Team adoption](docs/guide/team-adoption.md) |
| Vendors only after clone (no template overwrite) | `npx ai-dev-setup init --vendor-only --platforms=claude,cursor` |

## Quick start

1. `cd` to your project root.
2. Run one command from **Choose your path** (most teams: [team adoption](docs/guide/team-adoption.md)).
3. Open the project in **Claude Code** or **Cursor**. For what to do next, see [Using Superpowers and Agency](docs/guide/using-superpowers-and-agency.md).

## What to expect

| Mode | What happens |
|------|----------------|
| **Interactive** (default) | Prompts for project name, language, framework, test/lint/build, database, and platforms. Uses **auto-detected** defaults when possible. |
| **`--yes`** | No prompts: detection + defaults; both platforms unless `--platforms=`. |
| **`--vendor-only`** | **No template writes.** Only clones/copies Superpowers + Agency (same as the vendor phase of a full `init`). Uses `--platforms=` or defaults to both. |

**Full `init` (without `--skip-vendor`)** writes templates, updates **`.gitignore`** (managed `/vendor/` block), then vendors upstream (unless template writes failed). **First vendor run** may take **1–2 minutes** (network + `git clone`; with **Cursor**, `convert.sh` is slow). **Disk:** `vendor/` is large.

**Failure** (no `git`, `bash`, or network): the process **exits with an error**.

## Prerequisites

| Tool | Why |
|------|-----|
| Node.js 18+ | Runs the CLI |
| `git` | Shallow-clones `vendor/superpowers` and `vendor/agency-agents` |
| `bash` | Runs `vendor/agency-agents/scripts/convert.sh` when **Cursor** is selected |

**Windows:** use **Git Bash** or **WSL** so `bash` is available.

## Security and trust

- **This package** does not register a `postinstall` script. Running the vendor step is **always explicit** (`init` or your own script).
- **Git refs** passed to `git clone -b` are validated (alphanumeric branch/tag style only) to reduce misuse.
- **Advanced (optional):** if your team adds a **consumer** `postinstall` that runs `vendor:ai`, document it, skip when `CI=true`, and expect some environments to use `npm install --ignore-scripts`.

## Who this is for

- Teams who want **one repeatable setup** per project instead of hand-writing `CLAUDE.md`, Cursor rules, and workflow docs.
- Teams who want **Superpowers + Agency** available **locally** under `vendor/`, either **committed** or **materialized after clone** via `--vendor-only`.

## Core commands

| Goal | Command |
|------|---------|
| Full setup, both tools, no questions | `npx ai-dev-setup init --yes` |
| Templates only | `npx ai-dev-setup init --yes --skip-vendor` |
| Vendor only | `npx ai-dev-setup init --vendor-only --platforms=claude,cursor` |
| Claude only | `npx ai-dev-setup init --yes --platforms=claude` |
| Cursor only | `npx ai-dev-setup init --yes --platforms=cursor` |
| Refresh everything | `npx ai-dev-setup init --yes --force` |
| Help | `npx ai-dev-setup --help` |

More recipes and every flag: [CLI reference](docs/reference/cli.md).

## Troubleshooting

| Problem | What to do |
|---------|------------|
| Scaffold committed; need `vendor/` only | `npx ai-dev-setup init --vendor-only --platforms=claude,cursor` |
| `git is required` / clone errors | Install Git; network; valid refs |
| `bash is required` | Git Bash / WSL, or `--platforms=claude` |
| `Invalid git ref` | Use only safe branch/tag characters (see [CLI reference](docs/reference/cli.md)) |
| `Cannot use --skip-vendor with --vendor-only` | Pick one mode |
| `npm install` did not create `vendor/` | Expected. Run `init --vendor-only` or `npm run vendor:ai` |
| Huge repo if committing `vendor/` | Use [Team adoption](docs/guide/team-adoption.md) instead |

## More documentation

- [Team adoption (maintainers & teammates)](docs/guide/team-adoption.md)
- [Using Superpowers and Agency](docs/guide/using-superpowers-and-agency.md)
- [CLI reference](docs/reference/cli.md)
- [Generated files and vendors](docs/reference/generated-output.md)
- [Platforms and stacks](docs/reference/platforms-and-stacks.md)

## Contributing: add a platform

1. Subclass `Platform` in `src/platforms/your-platform.js` and implement `async getFiles(config)`.
2. `register(new YourPlatform())` in that file.
3. Import from `src/commands/init.js` and add to `PLATFORMS` in `src/constants.js`.
4. Add templates under `src/templates/your-platform/`.
5. Extend `tests/platforms.test.js`.

## Development (this package)

```bash
git clone <repo> && cd ai-dev-setup
npm test
node bin/ai-dev-setup.js --help
```

## License

MIT — see [LICENSE](./LICENSE).
````

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: shorten README and link deep docs"
```

---

### Task 7: Verify tests and spec acceptance

**Files:**
- None (verification only)

- [ ] **Step 1: Run tests**

Run:

```bash
npm test
```

Expected: all tests **PASS** (same as pre-change).

- [ ] **Step 2: Acceptance checklist**

Confirm [design spec](../specs/2026-04-06-readme-restructure-design.md) items:

- [ ] Top section contains a workflow decision table (**Choose your path**).
- [ ] Quickstart is 3 steps or fewer.
- [ ] README does not repeat full CLI flag tables (they live in `docs/reference/cli.md`).
- [ ] README states expectations (time, disk, failure, prerequisites).
- [ ] README contains at most **two** worked examples; additional examples live in `docs/guide/using-superpowers-and-agency.md`.
- [ ] README links to deep docs (**More documentation**).

- [ ] **Step 3: Commit (if only checklist doc updates)**

If you adjusted README troubleshooting or links in Step 2, amend or add a commit.

---

### Task 8: Optional — commit design spec if still uncommitted

**Files:**
- `docs/superpowers/specs/2026-04-06-readme-restructure-design.md`

- [ ] **Step 1: If `git status` shows the spec as untracked or modified, commit it**

```bash
git add docs/superpowers/specs/2026-04-06-readme-restructure-design.md
git commit -m "docs: add README restructure design spec"
```

---

## Plan self-review

**Spec coverage:** Decision table, short quickstart, expectations, core commands, troubleshooting teaser, deep links, 1–2 examples in README (plan uses one composite flow in quickstart + optional single example—enforce max two short examples in final README if you add any), contributing, dev, license—all mapped. Keep/move strategy satisfied by new `docs/` files.

**Placeholder scan:** No TBD steps; README troubleshooting table in Task 6 includes full parity with the original README.

**Consistency:** All internal links use paths relative to repo root (`docs/...`). Package name and commands match current `README.md`.

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-06-readme-restructure.md`. Two execution options:

**1. Subagent-Driven (recommended)** — Dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach do you want?
