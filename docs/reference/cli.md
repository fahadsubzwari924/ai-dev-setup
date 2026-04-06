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
