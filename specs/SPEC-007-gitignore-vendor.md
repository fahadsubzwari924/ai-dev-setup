# SPEC-007 — `.gitignore` vendor block management

**Status:** Implemented
**Module:** `src/core/gitignore-vendor.js`
**Entry point:** `ensureVendorDirGitignored(cwd, opts?)`

---

## Goal

Ensure `.gitignore` at the consumer project root ignores the `vendor/` directory, without clobbering or reordering any existing user rules. The operation is idempotent and safe to run on every `init` invocation.

---

## Non-goals

- Does not manage any gitignore entry other than `vendor/`
- Does not create or validate the `vendor/` directory itself
- Does not remove the managed block (removal is a manual action by the user)
- Does not reformat or sort the existing `.gitignore` content

---

## Managed block format

```
# --- ai-dev-setup: vendor (managed) ---
/vendor/
# --- end ai-dev-setup vendor ---
```

The begin/end delimiter lines are the stable identifiers used to detect, repair, and skip the block. They must not be changed without a migration path, as existing consumer projects rely on them.

---

## Decision tree

```
Does .gitignore already contain the managed block?
  YES → Does the block contain the /vendor/ line?
    YES  → action: noop_managed_ok       (no write)
    NO   → action: repaired_block        (insert /vendor/ into existing block; write)
  NO → Does any existing line already ignore root vendor/?
    YES  → action: noop_already_ignored  (no write)
    NO   → Does .gitignore exist and have content?
      YES → action: appended_block       (append block with blank-line separator; write)
      NO  → action: created             (write header comment + managed block as new file)
```

---

## Lines counted as "already ignores vendor"

A line (trimmed, with any leading `!` stripped for this check) matches any of:

- `vendor`
- `vendor/`
- `/vendor`
- `/vendor/`
- `**/vendor`
- `**/vendor/`

Comment lines (`#`) and blank lines are never matched.

---

## Return value

```ts
{
  action: 'created' | 'appended_block' | 'repaired_block' | 'noop_already_ignored' | 'noop_managed_ok' | 'error',
  error?: string   // present only when action is 'error'
}
```

The function never throws. All errors are returned as `action: 'error'` with the message in `error`.

---

## Error handling

| Error condition | Behaviour |
|---|---|
| `.gitignore` read failure (non-ENOENT) | Returns `action: 'error'`; calls `opts.onWarn` with the message |
| `.gitignore` write failure | Returns `action: 'error'`; calls `opts.onWarn` with the message |
| `.gitignore` does not exist (ENOENT) | Treated as an empty file; proceeds to `'created'` path |

`opts.onWarn` is optional. If not provided, warnings are silently dropped.

---

## CRLF normalisation

Input content is normalised from `\r\n` to `\n` before all processing. Output is written with `\n` line endings.

---

## Trailing newline

All written files are guaranteed to end with a single `\n`.

---

## Acceptance criteria

- [ ] Project with no `.gitignore` → creates file containing header comment + managed block; `action = 'created'`
- [ ] Project with `.gitignore` that has no vendor ignore → appends managed block; `action = 'appended_block'`
- [ ] Running the operation twice on the same project → second run returns `action = 'noop_managed_ok'` with no write
- [ ] Project with existing `vendor/` line (no managed block) → `action = 'noop_already_ignored'`; managed block is not appended
- [ ] Project with managed block present but missing `/vendor/` line → inserts the line; `action = 'repaired_block'`
- [ ] All written files end with exactly one `\n`
- [ ] CRLF input is normalised to LF in output
- [ ] Read failure (non-ENOENT) → returns `action: 'error'`; `onWarn` is called; function does not throw
- [ ] Write failure → returns `action: 'error'`; `onWarn` is called; function does not throw

---

## Dependencies

- `SPEC-001` — init command (caller via `syncVendorGitignore`)
