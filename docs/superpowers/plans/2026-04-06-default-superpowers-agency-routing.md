# Default Superpowers + Agency routing — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update `ai-dev-setup` templates so consumer projects instruct Cursor and Claude Code to **always** use Superpowers for workflow phases and Agency Agents for role-appropriate execution—without requiring users to name files or opt in per message—while keeping always-on context as lean as practical (UX over token minimalism, but no redundant prose across files).

**Architecture:** Add a dedicated **always-applied** Cursor rule (`routing.mdc`) that encodes mandatory defaults and a compact natural-language → phase/skill/role map. Align `.cursorrules`, `core-rules.mdc`, `workflow.mdc`, `agents.mdc`, `review.mdc`, shared `.ai/workflow.md` / `.ai/agents.md`, and `CLAUDE.md` so behavior is consistent across tools. Optionally broaden `.cursorignore` for `vendor/` to reduce IDE/tooling noise from vendored trees. Extend automated tests for new paths and content invariants.

**Tech Stack:** Node.js ESM, existing `src/platforms/cursor.js` template registration, `renderFile` placeholders (`{{PROJECT_NAME}}`, `{{LANGUAGE}}`, etc.), `node --test`.

---

## Scope split

### Shared baseline (Cursor + Claude)

- `.ai/workflow.md` and `.ai/agents.md` become the shared policy references.
- Wording across tool entrypoints is aligned so users do not need path mentions in chat.
- Token strategy: keep defaults concise in always-on surfaces and push details to shared docs.

### Cursor-specific scope

- Add always-on `routing.mdc` as the natural-language router and default policy enforcer.
- Align `.cursorrules` plus Cursor MDC files (`core/workflow/agents/review`) around that router.
- Reduce vendored indexing noise via `.cursorignore` updates and README guidance.

### Claude Code-specific scope

- Update `CLAUDE.md` so Superpowers workflow + Agency specialist execution are explicit defaults for all task types.
- Ensure Claude wording mirrors Cursor behavior at policy level (without duplicating long prose).

---

## File structure (create / modify)

| File | Responsibility |
|------|----------------|
| `src/templates/cursor/rules/routing.mdc.tmpl` | **Create.** Single always-on “default stack + routing” surface for Cursor. |
| `src/templates/cursor/rules/core-rules.mdc.tmpl` | **Modify.** Keep coding standards; one short pointer to routing for assistant behavior (avoid duplicating mandate). |
| `src/templates/cursor/rules/workflow.mdc.tmpl` | **Modify.** Align with defaults; trim duplication now covered by `routing.mdc`. |
| `src/templates/cursor/rules/agents.mdc.tmpl` | **Modify.** Specialist selection only; reference `.ai/agents.md` for full table; default mandate lives in `routing.mdc`. |
| `src/templates/cursor/rules/review.mdc.tmpl` | **Modify.** Optional line that review tasks still follow Superpowers + Agency defaults. |
| `src/templates/cursor/cursorrules.tmpl` | **Modify.** State that Superpowers + Agency are **defaults for every task**; list `routing.mdc`; stay within line budget or adjust test. |
| `src/templates/shared/workflow.md.tmpl` | **Modify.** Explicit default: all work types follow phased workflow via Superpowers skills. |
| `src/templates/shared/agents.md.tmpl` | **Modify.** Explicit default: Agency specialists for execution; mirror Claude/Cursor instructions without requiring file paths in chat. |
| `src/templates/claude-code/claude.md.tmpl` | **Modify.** Strengthen parity with Cursor (same non-optional default for all scenarios: feature, bug, idea, refactor). |
| `src/templates/ignore/cursorignore.tmpl` | **Modify.** Ignore `vendor/superpowers/` and `vendor/agency-agents/` (or entire `vendor/`) to reduce spurious analysis; document trade-off in README if plugin indexing is a concern. |
| `src/platforms/cursor.js` | **Modify.** Register `routing.mdc.tmpl` → `.cursor/rules/routing.mdc`. |
| `README.md` | **Modify.** Document `routing.mdc` and default-stack behavior. |
| `tests/platforms.test.js` | **Modify.** Expect `.cursor/rules/routing.mdc`; assert `routing` has `alwaysApply: true`; keep workflow test expectations consistent with template choices. |
| `tests/init.test.js` | **Modify.** Expect `routing.mdc` on disk; preserve `core-rules` single `alwaysApply: true` count **within that file**; revisit `.cursorrules` line cap if content grows. |

---

## Implementation order by scope

### Shared baseline tasks

1. Task 4 (shared docs alignment)

### Cursor tasks

1. Task 1 (register routing template)
2. Task 2 (add `routing.mdc.tmpl`)
3. Task 3 (tighten `core-rules` + `.cursorrules`)
4. Task 6 (cursor ignore + README note)
5. Task 7 (init test expectations + full verification)

### Claude tasks

1. Task 5 (Claude parity in `claude.md.tmpl`)

---

### Task 1: Register the new Cursor template in code

**Files:**
- Modify: `src/platforms/cursor.js`
- Test: `tests/platforms.test.js`

- [ ] **Step 1: Add template pair to `CursorPlatform.getFiles`**

Insert after `core-rules.mdc` (order: `core-rules`, `routing`, then `workflow`, `review`, `agents` for logical reading):

```javascript
['cursor/rules/routing.mdc.tmpl', '.cursor/rules/routing.mdc'],
```

- [ ] **Step 2: Update `tests/platforms.test.js` sorted paths**

Add `.cursor/rules/routing.mdc` to the expected `paths` array.

- [ ] **Step 3: Add assertions for `routing.mdc`**

After the `workflow` block, load `routing` file from `files` and assert:

```javascript
const routing = files.find((f) => f.path === '.cursor/rules/routing.mdc');
assert.ok(routing?.content.includes('alwaysApply: true'));
assert.match(routing.content, /Superpowers|superpowers/i);
assert.match(routing.content, /Agency|agency/i);
```

- [ ] **Step 4: Run tests (expect failure until template exists)**

Run: `npm test`

Expected: **FAIL** with missing template or render error until Task 2 completes.

---

### Task 2: Add `routing.mdc.tmpl` (always-on defaults + compact routing)

**Files:**
- Create: `src/templates/cursor/rules/routing.mdc.tmpl`
- Test: `npm test` (pass after this + Task 1)

- [ ] **Step 1: Create file with this structure (adjust wording for tone match; keep under ~120 lines)**

Use frontmatter:

```yaml
---
description: Default Superpowers workflow + Agency execution; natural-language routing for {{PROJECT_NAME}}
globs: "**/*"
alwaysApply: true
---
```

Body must include **all** of the following concepts (token-lean bullets/tables):

1. **Mandatory default (non-negotiable):** For **every** user message—new feature, change to existing behavior, idea exploration, bugfix, refactor, docs, review prep—the assistant **must** use **Superpowers** skills for **phase discipline** (planning, debugging, TDD, review, etc. as appropriate) and **Agency Agents** (via the matching specialist **role**) for **execution**. Do **not** wait for the user to say “use Superpowers,” “use Agency,” or to cite file paths.

2. **Superpowers:** Invoke or follow the relevant bundled skills (via Cursor plugin / `vendor/superpowers`) based on task phase—examples: brainstorming before open-ended ideas; systematic debugging before random edits; writing-plans before multi-step implementation; test-driven development when implementing behavior; verification before claiming done. Prefer the skill whose **name** matches the current phase.

3. **Agency:** Choose **one** primary specialist role aligned with the task (implementation, testing, review, security, docs, architecture, product/planning, performance, platform/CI—mirror the rows in `.ai/agents.md`). Use Agency rules/agents for **how** to execute in that role; Superpowers for **which phase** you are in.

4. **Natural-language routing (no path mentions):** Map user intent without asking for filenames—for example: “bug / broken / error / failing test” → debug skill + implementation or test specialist as needed; “idea / should we / brainstorm” → brainstorming skill + product/planning; “new feature / add / implement” → planning → implementation flow; “review / PR / ship” → review/verification skills + review specialist.

5. **Pointers only:** Details live in `.ai/workflow.md` and `.ai/agents.md`; this rule is the **default policy**, not a duplicate of those docs.

- [ ] **Step 2: Run `npm test`**

Expected: **PASS** for `platforms` and overall suite.

---

### Task 3: Tighten `core-rules.mdc.tmpl` and `cursorrules.tmpl`

**Files:**
- Modify: `src/templates/cursor/rules/core-rules.mdc.tmpl`
- Modify: `src/templates/cursor/cursorrules.tmpl`
- Test: `tests/init.test.js`

- [ ] **Step 1: `core-rules.mdc.tmpl`**

After the frontmatter `# Core rules` section, add **one** bullet:

- Assistant workflow and Agency defaults: follow `.cursor/rules/routing.mdc` (always on).

Do **not** add a second `alwaysApply`—keep exactly one `alwaysApply: true` in this file (existing `init.test.js` asserts count === 1 in `core`).

- [ ] **Step 2: `cursorrules.tmpl`**

Update the **Core stack** table and **Behavior** / **Rules layout** so they state explicitly:

- Superpowers + Agency are **defaults for all tasks**, not opt-in.
- Add a row or bullet for `routing.mdc` — always on; encodes defaults + routing.

If line count exceeds 80, **increase** the assertion in `tests/init.test.js` (e.g. to `120`) with a one-line comment in the test that the cap guards runaway growth, not fixed product copy—or trim table width in `cursorrules` to stay under 80.

- [ ] **Step 3: Run `npm test`**

Expected: **PASS.**

---

### Task 4: Align optional MDCs and shared docs (remove contradiction, avoid duplication)

**Files:**
- Modify: `src/templates/cursor/rules/workflow.mdc.tmpl`
- Modify: `src/templates/cursor/rules/agents.mdc.tmpl`
- Modify: `src/templates/cursor/rules/review.mdc.tmpl`
- Modify: `src/templates/shared/workflow.md.tmpl`
- Modify: `src/templates/shared/agents.md.tmpl`

- [ ] **Step 1: `workflow.mdc.tmpl`**

Keep `alwaysApply: false` unless you intentionally merge content into `routing` and remove duplication (recommended: **stay false**). First bullet: “Defaults: `.cursor/rules/routing.mdc` requires Superpowers phases for all task types; this file adds TDD/plan detail.” Then existing bullets pointing to `.ai/workflow.md`.

- [ ] **Step 2: `agents.mdc.tmpl`**

First bullet: routing rule already mandates Agency; this file expands specialist selection. Remove or soften any wording that sounds optional (“when using a named specialist”)—replace with “pick the specialist that fits; routing.mdc already requires Agency-aligned execution.”

- [ ] **Step 3: `review.mdc.tmpl`**

Add one line: pre-merge review still follows Superpowers verification/review skills + Agency review specialist per `.ai/agents.md`.

- [ ] **Step 4: `shared/workflow.md.tmpl`**

Add a short **Default stack** subsection: every work type uses Superpowers skills for phase control (not only “non-trivial” work). Keep commands table.

- [ ] **Step 5: `shared/agents.md.tmpl`**

Rewrite **Cursor** / **Claude** sections so they say assistants **must** apply Agency + Superpowers by default; remove instructions that imply users must load specific `.mdc` files by name in chat—replace with “follow bundled skills and specialist roles; see routing (Cursor) / CLAUDE.md (Claude).”

- [ ] **Step 6: Run `npm test`**

Expected: **PASS.**

---

### Task 5: Claude parity — `claude.md.tmpl`

**Files:**
- Modify: `src/templates/claude-code/claude.md.tmpl`
- Test: `tests/platforms.test.js` (optional: assert new phrases), `npm test`

- [ ] **Step 1: Expand “Operating rules” or “Core stack”**

Mirror Cursor `routing.mdc` intent: **all** scenarios (feature, bug, idea, refactor) → Superpowers skills + Agency agent selection by role; never wait for explicit user opt-in.

- [ ] **Step 2: Keep `CLAUDE.md` under 200 lines** (`init.test.js`)

If adding text pushes over limit, trim redundant tables or move examples to `docs/` (per existing file comment).

- [ ] **Step 3: Run `npm test`**

Expected: **PASS.**

---

### Task 6: Tooling noise — `.cursorignore.tmpl`

**Files:**
- Modify: `src/templates/ignore/cursorignore.tmpl`
- Modify: `README.md` (short “Cursor indexing” note)

- [ ] **Step 1: Add ignore rules**

Prefer:

```gitignore
vendor/superpowers/
vendor/agency-agents/
```

If whole-repo `vendor/` is safer for TS/ESLint noise, use `vendor/` instead and confirm README states that the Superpowers Cursor plugin reads paths from `plugin.json` (may still work when ignored from indexing—**consumer should verify** in Cursor).

- [ ] **Step 2: README**

Under “After init” or troubleshooting: note that `vendor/` may be cursor-ignored to avoid spurious diagnostics; if skills fail to resolve, narrow ignore pattern.

- [ ] **Step 3: Run `npm test`**

Expected: **PASS** (ignore template not covered by unit tests unless you add a snapshot test—optional).

---

### Task 7: `init.test.js` expected files + final verification

**Files:**
- Modify: `tests/init.test.js`
- Run: `npm test`

- [ ] **Step 1: Add `.cursor/rules/routing.mdc` to the `expected` array** in `generates shared and platform files with --yes`.

- [ ] **Step 2: Optional content smoke test**

After reading `routing.mdc` from tmp (or skip if platforms test suffices).

- [ ] **Step 3: Full suite**

Run: `npm test`

Expected: **All PASS.**

---

## Self-review (spec coverage)

| Requirement | Task |
|-------------|------|
| No file paths required in user chat for routing | Task 2 (routing table + synonyms) |
| Superpowers default for all scenarios | Tasks 2, 4, 5 |
| Agency default for execution / specialists | Tasks 2, 4, 5 |
| Cursor explicit instructions | Tasks 1–4 |
| Claude explicit instructions | Task 5 |
| Token awareness (avoid triple-copying same prose) | Tasks 2–4 split routing vs optional MDCs |
| Vendor import/diagnostic noise | Task 6 |
| Tests updated | Tasks 1, 3, 7 |

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-06-default-superpowers-agency-routing.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — Fresh subagent per task, review between tasks, fast iteration. **REQUIRED SUB-SKILL:** superpowers:subagent-driven-development.

2. **Inline Execution** — Execute tasks in this session using executing-plans-style checkpoints. **REQUIRED SUB-SKILL:** superpowers:executing-plans.

**Which approach?**
