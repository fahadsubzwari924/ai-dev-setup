# ai-dev-setup — maintainer notes

## Stack

- **Runtime:** Node.js 18+, ESM (`"type": "module"`)
- **npm deps:** none (Node built-ins only)
- **Consumer `init` also expects:** `git`, `bash` (for vendoring Superpowers + Agency Agents)
- **Tests:** `npm test` (`node --test`)

## Architecture

| Area | Role |
|------|------|
| `src/cli/` | argv, TTY prompts, logger |
| `src/commands/init.js` | orchestration: templates then `installVendors` |
| `src/core/vendors.js` | git clone, `convert.sh`, copies into `.claude/`, `.cursor-plugin`, `agency-*.mdc` |
| `src/core/*` | detect, render, write |
| `src/platforms/` | Claude / Cursor file lists |
| `src/templates/` | static template data |

## Conventions

- Keep `installVendors` side effects isolated in `vendors.js`; `init --vendor-only` reuses the same path without template writes.
- Git refs for clones are validated in `src/core/git-ref.js` (`assertSafeGitRef`).
- Template content stays token-lean; vendor trees live under `vendor/` in **consumer** repos, not in this package tarball.

## Commands

| Task | Command |
|------|---------|
| Test | `npm test` |
| CLI | `node bin/ai-dev-setup.js --help` |
