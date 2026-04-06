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
