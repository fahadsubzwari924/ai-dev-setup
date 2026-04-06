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
