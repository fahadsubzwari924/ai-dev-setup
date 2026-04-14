# SPEC-003 — stack detection

**Status:** Implemented
**Module:** `src/core/detector.js`
**Entry point:** `detectProject(cwd)`

---

## Goal

Infer the consumer project's language, framework, test/lint/build commands, database, and stack key list from the file system — without any user input. All detection is best-effort; a missing or unrecognised file is never an error.

---

## Non-goals

- Does not write any files
- Does not require a specific project structure to succeed
- Does not validate or enforce the detected values (the user can override via CLI flags)

---

## Inputs

| Input | Description |
|---|---|
| `cwd` | Absolute path to the consumer project root |

---

## Output shape

```js
{
  name: string | null,
  language: string | null,
  framework: string | null,
  testCmd: string | null,
  lintCmd: string | null,
  buildCmd: string | null,
  database: string | null,
  detectedStack: string[],   // deduplicated via Set before return
}
```

All fields are `null` when not detected. `detectedStack` is `[]` when nothing is recognised. The function never throws.

---

## Detection sources and rules

### `package.json`

| Field | Resolved from |
|---|---|
| `name` | `pkg.name` (trimmed string) |
| `testCmd` | First non-empty value among: `scripts.test`, `scripts.test:unit`, `scripts.test:ci` |
| `lintCmd` | First non-empty value among: `scripts.lint`, `scripts.eslint`, `scripts.check:lint` |
| `buildCmd` | First non-empty value among: `scripts.build`, `scripts.compile`, `scripts.build:prod` |

Dependencies check (`devDependencies` merged with `dependencies`; dev entries take precedence on collision):

| Dependency present | Stack key added | Framework set |
|---|---|---|
| `react` | `react` | `React` |
| `next` | `nextjs` | `Next.js` (overrides `React`) |
| `@nestjs/core` | `nestjs` | `NestJS` |
| `express`, `fastify`, `koa`, or `hapi` (and `nextjs` not in stack) | `node` | `Node.js API` |
| `prisma` | _(none)_ | From `prisma/schema.prisma`: `PostgreSQL` / `MySQL` / `SQLite`; defaults to `PostgreSQL` if schema unreadable |
| `typeorm` | _(none)_ | `SQL (TypeORM)` (only if `database` not already set) |
| `pg` or `pg-promise` | _(none)_ | `PostgreSQL` (only if `database` not already set) |
| `mysql2` | _(none)_ | `MySQL` (only if `database` not already set) |

### `tsconfig.json`

Presence → `language = 'TypeScript'`, `'ts'` pushed to `detectedStack`.

If `package.json` is present but `tsconfig.json` is absent → `language = 'JavaScript'`.

### `next.config.*` (glob prefix match on filenames in `cwd`)

Presence → `'nextjs'` pushed if not already in stack; `framework = 'Next.js'`.

### `nest-cli.json`

Presence → `'nestjs'` pushed if not already in stack; `framework = 'NestJS'`.

### `pyproject.toml` or `requirements.txt`

Either present → `'python'` pushed; `language = 'Python'`. Defaults applied if not already set from `package.json`:
- `testCmd = 'pytest'`
- `lintCmd = 'ruff check .'`
- `buildCmd = 'python -m build'`

### `go.mod`

Presence → `'go'` pushed; `language = 'Go'`. Defaults:
- `testCmd = 'go test ./...'`
- `lintCmd = 'golangci-lint run'`
- `buildCmd = 'go build ./...'`

### `pubspec.yaml`

Presence → `'flutter'` pushed; `language = 'Dart'`; `framework = 'Flutter'`. Defaults:
- `testCmd = 'flutter test'`
- `lintCmd = 'dart analyze'`
- `buildCmd = 'flutter build apk'`

---

## Deduplication

`detectedStack` is passed through `new Set(...)` before return. Insertion order (first detection wins) is preserved for set iteration in the Node.js runtime.

---

## Error handling

All file reads (`readJsonIfExists`, `fileExists`, `globFrameworkConfig`) are wrapped in try/catch. A missing file, unreadable file, or malformed JSON is treated as absent — the corresponding field remains `null` or the stack key is not pushed. `detectProject` always resolves with the result object and never rejects.

---

## Acceptance criteria

- [ ] TypeScript project (`tsconfig.json` present) → `language = 'TypeScript'`, `detectedStack` includes `'ts'`
- [ ] JavaScript project (`package.json` present, no `tsconfig.json`) → `language = 'JavaScript'`
- [ ] NestJS project (`@nestjs/core` dep + `nest-cli.json`) → `framework = 'NestJS'`, `'nestjs'` in `detectedStack`
- [ ] Next.js project (`next` dep + `next.config.*`) → `framework = 'Next.js'`, `'nextjs'` in `detectedStack`
- [ ] React-only project (`react` dep, no `next`) → `framework = 'React'`, `'react'` in `detectedStack`
- [ ] Python project (`pyproject.toml` present) → `language = 'Python'`, `testCmd = 'pytest'`
- [ ] Go project (`go.mod` present) → `language = 'Go'`, `testCmd = 'go test ./...'`
- [ ] Flutter project (`pubspec.yaml` present) → `language = 'Dart'`, `framework = 'Flutter'`
- [ ] Prisma project with `provider = "postgresql"` in schema → `database = 'PostgreSQL'`
- [ ] Project with `pg` dep → `database = 'PostgreSQL'`
- [ ] Empty directory → all fields `null`, `detectedStack = []`, no throw
- [ ] Malformed `package.json` → all package-derived fields `null`, no throw
- [ ] `detectedStack` has no duplicates even when multiple signals point to the same key

---

## Dependencies

- `SPEC-001` — init command (caller)
