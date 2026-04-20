# SPEC-002 — vendor install

**Status:** Implemented
**Module:** `src/core/vendors.js`
**Entry point:** `installVendors(projectRoot, options)`

---

## Goal

Clone Superpowers and Agency Agents from upstream Git repositories into `vendor/`, then wire their outputs into the consumer project for the selected platforms. Return a human-readable log of every operation performed.

---

## Non-goals

- Does not write template files (handled by `SPEC-004`)
- Does not manage `.gitignore` (handled by `SPEC-007`)
- Does not validate CLI flags (handled by `SPEC-008`)
- Does not generate consumer-facing docs or configuration beyond the wiring files

---

## Inputs

| Input | Type | Notes |
|---|---|---|
| `projectRoot` | `string` | Absolute path to consumer project root |
| `options.platformKeys` | `string[]` | Subset of `['claude', 'cursor']` |
| `options.force` | `boolean` | Re-clone and overwrite if `true` |
| `options.superpowersRef` | `string` | Git branch/tag; validated by `assertSafeGitRef` before use |
| `options.agencyRef` | `string` | Git branch/tag; validated by `assertSafeGitRef` before use |

## Output

`Promise<string[]>` — ordered log lines describing each operation (written, skipped, or error context).

---

## Operations

### Always (both platforms)

| Step | Description |
|---|---|
| Assert `git` on PATH | Throws `'git is required on PATH...'` if absent |
| Clone Superpowers (filtered) | Shallow clone to OS temp dir; copy only `skills/`, `hooks/`, `.cursor-plugin/`; delete temp dir |
| Clone Agency Agents | Shallow clone `vendor/agency-agents/` directly |

### Claude Code (`'claude'` in `platformKeys`)

| Step | Destination |
|---|---|
| Copy Superpowers skills | `.claude/skills/<skill-name>/` (one subdirectory per skill tree) |
| Copy Agency agent `.md` files | `.claude/agents/` (all files with valid YAML frontmatter, flattened from division subdirs) |
| Write `_index.json` | `.claude/agents/_index.json` |

### Cursor (`'cursor'` in `platformKeys`)

| Step | Destination |
|---|---|
| Assert `bash` on PATH | Throws `'bash is required on PATH...'` if absent |
| Rewrite Superpowers `plugin.json` | `.cursor-plugin/plugin.json` (all `./`-relative paths rebased to `./vendor/superpowers/`) |
| Run `vendor/agency-agents/scripts/convert.sh` | Generates `integrations/cursor/rules/*.mdc` inside the Agency repo |
| Copy `agency-*.mdc` rules | `.cursor/rules/agency-*.mdc` (each file prefixed with `agency-` if not already) |

---

## Superpowers filtered clone

Superpowers is cloned into an OS temp directory first. Only three subdirectories are copied to `vendor/superpowers/`: `skills/`, `hooks/`, `.cursor-plugin/`. All other content — TypeScript source files, example projects, test fixtures — is excluded. The temp directory is deleted after copying.

**Rationale:** Raw `.ts` source files from Superpowers would be picked up by the consumer's TypeScript compiler during their own build, causing compilation errors in the consumer project.

---

## Force mode

| `force` | Behaviour |
|---|---|
| `true` | Remove and re-clone both `vendor/superpowers/` and `vendor/agency-agents/`; overwrite all destination files (skills, agents, rules) |
| `false` | If `vendor/superpowers/` or `vendor/agency-agents/` already exist, skip the clone (logged as "already present, skipped clone — use --force to refresh"); individual skill and agent files that already exist at the destination are also skipped |

---

## Agency agent index (`_index.json`)

Written to `.claude/agents/_index.json` after all agent files are copied. Contains:

```json
{
  "generatedAt": "<ISO-8601 timestamp>",
  "source": "ai-dev-setup",
  "note": "Authoritative map of Agency agents present in .claude/agents/. `subagentType` (= frontmatter `name` field) is the exact string to pass as subagent_type to the Claude Code Task tool. `fileId` is the filename stem for reference only.",
  "count": 42,
  "agents": [
    {
      "file": "engineering-backend-architect.md",
      "fileId": "engineering-backend-architect",
      "subagentType": "Backend Architect",
      "division": "engineering",
      "name": "Backend Architect",
      "description": "..."
    }
  ]
}
```

`subagentType` is the frontmatter `name` field from the agent file — the exact string value to pass as `subagent_type` to the Claude Code `Task` tool. `fileId` is the filename stem (without `.md`) kept for reference. The index is sorted by `subagentType` alphabetically.

Only `.md` files with valid YAML frontmatter (file starts with `---`) are included. Files without frontmatter are silently skipped.

---

## Cursor plugin path rewriting

`vendor/superpowers/.cursor-plugin/plugin.json` contains paths starting with `./` relative to the Superpowers repo root. Before writing to `.cursor-plugin/plugin.json`, the following keys are rebased to `./vendor/superpowers/`:

- `skills`
- `agents`
- `commands`
- `hooks`

Any resulting double slashes are collapsed to single slashes. After rewriting, the `hooks` path is verified to exist on disk; if missing, the operation throws.

---

## Error conditions

| Condition | Behaviour |
|---|---|
| `git` not on PATH | Throws before any clone |
| `bash` not on PATH (Cursor only) | Throws before `convert.sh` |
| Invalid `superpowersRef` or `agencyRef` | `assertSafeGitRef` throws before any clone |
| Superpowers `skills/` directory missing after clone | Throws |
| Agency Cursor rules not found after `convert.sh` | Throws `'Agency Cursor rules not found after convert.sh...'` |
| Zero Agency agent files copied | Throws `'No Agency agent markdown files were copied...'` |
| Git clone network or auth error | Propagates as thrown `Error` with the clone's stderr/stdout |

---

## Acceptance criteria

- [ ] Full vendor install (both platforms) in a clean project completes without error
- [ ] `vendor/superpowers/` contains `skills/`, `hooks/`, `.cursor-plugin/` and no `.ts` source files
- [ ] `vendor/agency-agents/` exists and contains the upstream repo content
- [ ] `.claude/skills/` contains at least one skill subdirectory
- [ ] `.claude/agents/` contains agent `.md` files from multiple divisions
- [ ] `.claude/agents/_index.json` is valid JSON with `count > 0` and at least one `agents` entry
- [ ] Every entry in `_index.json` has a non-empty `subagentType` matching the frontmatter `name` field (falling back to filename stem if name is absent), and a `fileId` matching the filename without `.md`
- [ ] `.cursor-plugin/plugin.json` has all `./`-relative paths prefixed with `./vendor/superpowers/`
- [ ] `.cursor/rules/` contains at least one `agency-*.mdc` file
- [ ] Running with `--force` removes and re-clones vendor, overwrites destination files
- [ ] Running without `--force` on existing `vendor/` skips the clone; logs "already present"
- [ ] Missing `git` produces a human-readable error before any filesystem mutation

---

## Dependencies

- `SPEC-001` — init command (caller)
- `src/core/git-ref.js` — `assertSafeGitRef` (ref validation)
