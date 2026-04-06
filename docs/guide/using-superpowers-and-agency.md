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
