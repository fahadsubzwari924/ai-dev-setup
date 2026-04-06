# ai-dev-setup

**One command** scaffolds a **token-aware** AI assistant setup for **Claude Code** and **Cursor**: shared rules (`.ai/`, `docs/`), tool-specific entrypoints, plus **vendored [Superpowers](https://github.com/obra/superpowers)** (workflow engine) and **[Agency Agents](https://github.com/msitarzewski/agency-agents)** (specialists) in your project.

```bash
npx ai-dev-setup init
```

**npm package dependencies:** none. **Your machine:** Node.js **18+**, and (when running the vendor step) **`git`** + **`bash`** on PATH.

---

## Recommended team workflow (no `vendor/` in git)

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

---

## Security and trust

- **This package** does not register a `postinstall` script. Running the vendor step is **always explicit** (`init` or your own script).
- **Git refs** passed to `git clone -b` are validated (alphanumeric branch/tag style only) to reduce misuse.
- **Advanced (optional):** if your team adds a **consumer** `postinstall` that runs `vendor:ai`, document it, skip when `CI=true`, and expect some environments to use `npm install --ignore-scripts`.

---

## Who this is for

- Teams who want **one repeatable setup** per project instead of hand-writing `CLAUDE.md`, Cursor rules, and workflow docs.
- Teams who want **Superpowers + Agency** available **locally** under `vendor/`, either **committed** or **materialized after clone** via `--vendor-only`.

---

## What to expect

| Mode | What happens |
|------|----------------|
| **Interactive** (default) | Prompts for project name, language, framework, test/lint/build, database, and platforms. Uses **auto-detected** defaults when possible. |
| **`--yes`** | No prompts: detection + defaults; both platforms unless `--platforms=`. |
| **`--vendor-only`** | **No template writes.** Only clones/copies Superpowers + Agency (same as the vendor phase of a full `init`). Uses `--platforms=` or defaults to both. |

**Full `init` (without `--skip-vendor`)** writes templates, updates **`.gitignore`** (managed `/vendor/` block), then vendors upstream (unless template writes failed). **First vendor run** may take **1–2 minutes** (network + `git clone`; with **Cursor**, `convert.sh` is slow). **Disk:** `vendor/` is large.

**Failure** (no `git`, `bash`, or network): the process **exits with an error**.

---

## Prerequisites

| Tool | Why |
|------|-----|
| Node.js 18+ | Runs the CLI |
| `git` | Shallow-clones `vendor/superpowers` and `vendor/agency-agents` |
| `bash` | Runs `vendor/agency-agents/scripts/convert.sh` when **Cursor** is selected |

**Windows:** use **Git Bash** or **WSL** so `bash` is available.

---

## Quick start

**1.** `cd` to your project root.

**2.** Run:

```bash
npx ai-dev-setup init
```

Or non-interactive full setup (templates + vendor):

```bash
npx ai-dev-setup init --yes
```

**3.** Follow **Recommended team workflow** above if you are **not** committing `vendor/`.

**4.** Open the project in Claude Code or Cursor.

---

## First-time usage: Superpowers + Agency

After **`init`** has finished (full run **or** **`init --vendor-only`** so `vendor/` exists), you can start using the setup in plain language. **Superpowers + Agency are the default** for both tools once vendored content exists—**Cursor** also ships **`routing.mdc`** so that default applies without you naming plugin paths each chat. Exact UI (slash menus, rules picker) depends on your **Claude Code** or **Cursor** version; the ideas below always apply.

### Example 1 — Claude Code: `/kickoff` on a small feature

1. Open the **project root** in Claude Code.
2. Let the session load **`CLAUDE.md`** (stack, commands, and where **Superpowers** / **Agency** live under `vendor/`).
3. Run **`/kickoff`** and describe one feature, e.g. *“Add a `/health` JSON route and tests.”*
4. That command is aligned with **`.ai/workflow.md`**: you get scoped goals, risks, and a task list tied to your repo’s **test/lint/build** commands—your first practical use of the **Superpowers-style** planning loop without naming individual skills.

### Example 2 — Cursor: one chat, workflow + Superpowers

1. Open the project in Cursor.
2. If needed, enable the workspace **Superpowers** plugin (see **After `init`: checklist** later in this README).
3. In chat, ask something specific, e.g. *“Read `.cursorrules` and `.ai/workflow.md`. I need to fix a bug in `[path/to/file]`. Propose a short plan, then implement.”*
4. **`.cursor/rules/`** (workflow, review, agents) plus **Superpowers** (via **`.cursor-plugin`** → `vendor/superpowers/`) keep the assistant in a structured flow; you do not need to hand-edit those paths each time.

### Example 3 — Agency: pick a specialist from `.ai/agents.md`

1. Open **`.ai/agents.md`** and skim the **Engineering** and **Quality** tables (e.g. tests, review, security).
2. Ask the assistant to work in that role, e.g. *“Using the testing specialist from `.ai/agents.md`, review tests for `[module]` and list missing cases.”*
3. **Claude Code** maps this to **`.claude/agents/`**. **Cursor** maps to **`agency-*.mdc`** under **`.cursor/rules/`** when the task matches that specialist.

---

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

---

## After `init`: checklist

1. Fill in **`docs/ARCHITECTURE.md`** (and other `docs/*` as needed).
2. Skim **`.ai/rules.md`** and adjust for your team.
3. **Commit** scaffold files (including **`.gitignore`**). If you use **templates-only** flow, **do not commit** `vendor/`; **`.gitignore`** should already list **`/vendor/`** from `init`. Ensure teammates run **`--vendor-only`** (or your `vendor:ai` script) after clone.
4. In **Cursor**, enable the workspace **Superpowers** plugin if your Cursor version requires it.
5. **`.cursorignore`** lists **`vendor/superpowers/`** and **`vendor/agency-agents/`** so Cursor indexes less of the vendored trees (fewer noisy imports and search hits). If that hides files your workflow or the Superpowers plugin needs in the UI, remove or narrow those lines.
6. **Updates:** re-run `init --yes --force` or `init --vendor-only --force` with pinned refs, or `git pull` inside `vendor/*` manually.

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
.claudeignore
.cursorignore
```

**`.gitignore`:** each **`init`** merges in a managed **`/vendor/`** block (safe with existing rules); not listed above as a static template file.

**Claude Code** (when `claude` is selected): `CLAUDE.md`, `.claude/settings.json`, `.claude/commands/*`.

**Cursor** (when `cursor` is selected): `.cursorrules`, `.cursor/rules/core-rules.mdc`, `routing.mdc` (defaults to Superpowers + Agency), `workflow.mdc`, `review.mdc`, `agents.mdc`.

### Vendor step (`--vendor-only` or full `init` without `--skip-vendor`)

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

---

## Escape hatch: manual clone

If you used `--skip-vendor` or `--vendor-only` is not an option:

```bash
git clone --depth 1 --branch main https://github.com/obra/superpowers.git vendor/superpowers
git clone --depth 1 --branch main https://github.com/msitarzewski/agency-agents.git vendor/agency-agents
```

For Cursor Agency rules, run `bash scripts/convert.sh` in `vendor/agency-agents`, then copy `integrations/cursor/rules/*.mdc` to `.cursor/rules/` with an `agency-` prefix — or use **`init --vendor-only`** when you can.

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

Commands: `init` (default), `update` (placeholder).

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

Detection uses `package.json`, `tsconfig.json`, `next.config.*`, `nest-cli.json`, `go.mod`, `pyproject.toml` / `requirements.txt`, `pubspec.yaml`, and common dependencies.

---

## Superpowers + Agency (core behavior)

- **Superpowers** — workflow engine under `vendor/superpowers`, `.claude/skills/`, `.cursor-plugin`.
- **Agency** — specialists: `agency-*.mdc`, `.claude/agents/`.
- Generated docs treat both as **required** for this scaffold.

---

## Token optimization

| File | Role |
|------|------|
| `CLAUDE.md` / `.cursorrules` | Short index |
| `.ai/*.md` | Shared standards |
| `docs/*.md` | Deeper references |
| `core-rules.mdc` | Small **alwaysApply** surface |

---

## Troubleshooting

| Problem | What to do |
|---------|------------|
| Scaffold committed; need `vendor/` only | `npx ai-dev-setup init --vendor-only --platforms=claude,cursor` |
| `git is required` / clone errors | Install Git; network; valid refs |
| `bash is required` | Git Bash / WSL, or `--platforms=claude` |
| `Invalid git ref` | Use only safe branch/tag characters (see `--superpowers-ref` / `--agency-ref`) |
| `Cannot use --skip-vendor with --vendor-only` | Pick one mode |
| `npm install` did not create `vendor/` | Expected. Run `init --vendor-only` or `npm run vendor:ai` |
| Huge repo if committing `vendor/` | Use **Recommended team workflow** instead |

---

## Risk register

- Upstream layout may change. Pin with `--superpowers-ref` / `--agency-ref`.
- Cursor plugin behavior may vary by version.
- Vendor failures are **loud** (non-zero exit).

---

## Contributing: add a platform

1. Subclass `Platform` in `src/platforms/your-platform.js` and implement `async getFiles(config)`.
2. `register(new YourPlatform())` in that file.
3. Import from `src/commands/init.js` and add to `PLATFORMS` in `src/constants.js`.
4. Add templates under `src/templates/your-platform/`.
5. Extend `tests/platforms.test.js`.

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
