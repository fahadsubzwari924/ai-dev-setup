# SPEC-004 — template engine

**Status:** Implemented
**Modules:** `src/core/renderer.js`, `src/core/writer.js`

---

## Goal

Render `.tmpl` template files using a project config object (substituting tokens and evaluating conditional blocks), then write the rendered results to the consumer project's file system while respecting the `force` flag and guarding against path traversal.

---

## Non-goals

- Does not decide which files to generate (platform adapters own that — see `SPEC-005`, `SPEC-006`)
- Does not validate config values before substitution
- Does not support nested or looping template constructs

---

## Renderer (`src/core/renderer.js`)

### Placeholder substitution

Templates use `{{KEY}}` tokens. The following placeholders are replaced:

| Token | Config field | `null`/`undefined` renders as |
|---|---|---|
| `{{PROJECT_NAME}}` | `config.projectName` | `''` |
| `{{LANGUAGE}}` | `config.language` | `''` |
| `{{FRAMEWORK}}` | `config.framework` | `''` |
| `{{TEST_CMD}}` | `config.testCmd` | `''` |
| `{{LINT_CMD}}` | `config.lintCmd` | `''` |
| `{{BUILD_CMD}}` | `config.buildCmd` | `''` |
| `{{DATABASE}}` | `config.database` | `''` |

Any `{{TOKEN}}` not in the list above is left **unchanged** in the output.

### Conditional blocks

```
{{#IF_KEY}}
...content...
{{/IF_KEY}}
```

Conditional keys and their evaluation:

| Key | True when |
|---|---|
| `TYPESCRIPT` | `config.language === 'TypeScript'` |
| `PYTHON` | `config.language === 'Python'` |
| `GO` | `config.language === 'Go'` |
| `JAVASCRIPT` | `config.language === 'JavaScript'` |
| `DART` | `config.language === 'Dart'` |
| `FLUTTER` | `config.stacks.includes('flutter')` |
| `REACT` | `config.stacks.includes('react')` |
| `NEXTJS` | `config.stacks.includes('nextjs')` |
| `NESTJS` | `config.stacks.includes('nestjs')` |
| `NODE` | `config.stacks.includes('node')` |

When the condition is `false`, the entire block including the delimiters is removed from output. When `true`, the inner content is kept (delimiters are removed). Unknown keys always evaluate to `false`.

**Processing order:** conditionals are evaluated and stripped **before** placeholder substitution. Nested conditionals are not supported.

### API

```js
render(template: string, config: object): string
renderFile(templatePath: string, config: object): Promise<string>
```

`renderFile` reads the file at `templatePath` as UTF-8, then calls `render`.

---

## Writer (`src/core/writer.js`)

### API

```js
writeFiles(
  files: Array<{ path: string, content: string }>,
  options?: { cwd?: string, force?: boolean }
): Promise<WriteResult[]>
```

Where `WriteResult`:

```ts
{ path: string, status: 'written' | 'skipped' | 'error', error?: string }
```

`cwd` defaults to `process.cwd()`. `force` defaults to `false`.

### Write decision rules

| Condition | Result status |
|---|---|
| File does not exist | `'written'` |
| File exists, `force = false` | `'skipped'` |
| File exists, `force = true` | `'written'` (content replaced) |
| Destination path escapes `cwd` | `'error'` with message `'Path escapes working directory'` |
| `mkdir` for parent directory fails | `'error'` with OS error message; write not attempted |
| `writeFile` fails | `'error'` with OS error message |

### Path safety

Every destination path is resolved via `path.resolve(cwd, file.path)`. A path is accepted only if the resolved value equals `cwd` or starts with `cwd + path.sep`. Any path that would escape the working directory is rejected with `status: 'error'` and the file is not written. This check runs regardless of the `force` flag.

### Directory creation

`mkdir({ recursive: true })` is called on the parent directory before each write attempt. A `mkdir` failure marks the file as `'error'` and skips the write; subsequent files continue to be processed.

### Error isolation

A write error for one file does not halt processing of remaining files. All files are attempted, and the full results array is returned.

---

## Acceptance criteria

- [ ] `{{PROJECT_NAME}}` is replaced with `config.projectName`
- [ ] `{{UNKNOWN_TOKEN}}` is left unchanged in output (not removed, not errored)
- [ ] A `null` config value renders as empty string, not the string `"null"`
- [ ] `{{#IF_TYPESCRIPT}}...{{/IF_TYPESCRIPT}}` block is included when `language = 'TypeScript'`
- [ ] `{{#IF_TYPESCRIPT}}...{{/IF_TYPESCRIPT}}` block is fully removed when `language = 'Python'`
- [ ] An unknown conditional key block is removed from output
- [ ] Conditionals are processed before placeholder substitution (a token inside a false block is never substituted)
- [ ] Writing a file to a non-existent parent directory creates the full directory tree
- [ ] Existing file without `force` → `status = 'skipped'`; file content is unchanged
- [ ] Existing file with `force = true` → `status = 'written'`; content is replaced
- [ ] A path outside `cwd` (e.g., `../../etc/passwd`) → `status = 'error'`; no file written
- [ ] An error on one file does not prevent other files in the array from being processed
- [ ] `writeFiles` with an empty array returns an empty array without error

---

## Dependencies

- `SPEC-001` — init command (caller via `collectFiles`)
- `SPEC-005`, `SPEC-006` — platform adapters (provide the file list to write)
