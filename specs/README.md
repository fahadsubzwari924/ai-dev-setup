# Specs — ai-dev-setup

Feature specifications for every discrete capability of the `ai-dev-setup` package.
Each spec is a self-contained contract: goal, inputs/outputs, acceptance criteria, and edge cases.

## Status legend

| Status | Meaning |
|---|---|
| `Draft` | Initial capture; may be incomplete |
| `Ready` | Complete and reviewed; implementation can begin |
| `Implemented` | Behaviour exists in code and matches this spec |
| `Deprecated` | Spec no longer reflects the product; kept for history |

---

## Spec index

| ID | Feature | Module | Status |
|---|---|---|---|
| [SPEC-001](./SPEC-001-init-command.md) | `init` command orchestration | `src/commands/init.js` | Implemented |
| [SPEC-002](./SPEC-002-vendor-install.md) | Vendor install (Superpowers + Agency) | `src/core/vendors.js` | Implemented |
| [SPEC-003](./SPEC-003-stack-detection.md) | Stack auto-detection | `src/core/detector.js` | Implemented |
| [SPEC-004](./SPEC-004-template-engine.md) | Template engine (render + write) | `src/core/renderer.js`, `src/core/writer.js` | Implemented |
| [SPEC-005](./SPEC-005-platform-claude.md) | Platform adapter: Claude Code | `src/platforms/claude-code.js` | Implemented |
| [SPEC-006](./SPEC-006-platform-cursor.md) | Platform adapter: Cursor | `src/platforms/cursor.js` | Implemented |
| [SPEC-007](./SPEC-007-gitignore-vendor.md) | `.gitignore` vendor block management | `src/core/gitignore-vendor.js` | Implemented |
| [SPEC-008](./SPEC-008-cli-interface.md) | CLI flag parsing + prompts | `src/cli/index.js` | Implemented |

---

## How to use these specs

- **Before implementing a feature:** read the relevant spec to understand the contract.
- **When a spec and the code disagree:** the spec is the source of truth for intended behaviour; update the code or raise the discrepancy before proceeding.
- **When adding a new feature:** create a new spec file (`SPEC-00N-<slug>.md`) in `Draft` status, complete it, set it to `Ready`, then implement.
- **When changing behaviour:** update the spec in the same PR as the code change.
