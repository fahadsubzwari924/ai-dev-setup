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
