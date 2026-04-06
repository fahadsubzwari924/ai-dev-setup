# Team adoption (no `vendor/` in git)

This is the **default adoption path** we recommend: small git history, explicit security posture, one non-interactive command for teammates.

**Activation model:** `--skip-vendor` creates scaffold files only. It does **not** activate Superpowers or Agency until each machine runs `init --vendor-only`.

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
