# README Restructure Design (Action-First, Concise)

Date: 2026-04-06
Project: `ai-dev-setup`
Status: Draft approved in brainstorming; ready for implementation planning

## Goal

Restructure `README.md` to be precise, scannable, and action-oriented for mixed audiences (maintainer, teammate-after-clone, first-time evaluator), with clear expectations and minimal examples.

## Problem Statement

The current README is comprehensive but too long for first-pass adoption. Key actions are present but spread across many sections, which increases time-to-decision and reduces clarity for first-time readers.

## Success Criteria

- Reader can choose the correct workflow in under 30 seconds.
- Top-half content is primarily actionable commands and expectations.
- Only 1-2 examples remain in README; deeper examples move to linked docs.
- README avoids duplicated explanations and references deep details via links.

## Non-Goals

- No behavior changes to the CLI.
- No changes to command flags, defaults, or vendor logic.
- No edits to template generation flow.

## Audience Model

- Mixed audience is the primary target:
  - Team maintainer setting repo standard.
  - Teammate materializing vendors after clone.
  - Individual exploring full setup quickly.

## Recommended Information Architecture

1. One-line value proposition + one-line scope.
2. "Choose your path" decision table (primary entry point).
3. 3-step quickstart (minimal text).
4. "What to expect" section (time, disk size, failure behavior, prerequisites).
5. Core commands table (small, high-frequency paths only).
6. Top troubleshooting issues (short list).
7. Links to deep docs and references.
8. Contributing + license.

## Section-Level Design Rules

- Every section must answer: "What action should the reader take now?"
- Prefer prescriptive wording ("Run", "Use", "Choose") over explanatory prose.
- Use short tables/checklists for scanability.
- Keep examples minimal and realistic; move extra examples to docs.
- Do not duplicate CLI details between quickstart and reference sections.
- Link to canonical docs instead of re-explaining long topics.

## Proposed Keep / Move Strategy

Keep in README:
- Core value proposition and primary usage modes.
- Decision table for workflow selection.
- Minimal quickstart and expectations.
- Most common commands and troubleshooting entries.

Move out of README (to docs files):
- Extended platform walkthroughs and multi-example tutorials.
- Full generated-file trees with detailed commentary.
- Exhaustive CLI reference and long stack/platform explanation.
- Long operational notes that are not needed for first run.

## Best-Practice Sources Applied

- GitHub README guidance:
  - README should explain what, why, how to start, where to get help, maintainers.
  - README should focus on "getting started"; longer material belongs in deeper docs.
- Google documentation guidance:
  - Minimum viable documentation: keep docs short, fresh, and accurate.
  - Prefer prescriptive, task-oriented guidance.
  - Remove dead or redundant text and avoid duplication.

## Risks and Mitigations

- Risk: Over-compression removes useful nuance.
  - Mitigation: Preserve deep details in linked docs.
- Risk: Existing users miss previously visible guidance.
  - Mitigation: Add explicit "Deep docs" index with clear labels.
- Risk: Future README drift.
  - Mitigation: Add a lightweight maintenance rule: update README and linked docs in the same PR when command behavior changes.

## Implementation Boundaries

- Target file: `README.md`.
- Optional supporting docs: new linked reference docs if needed.
- No code changes in `src/` for this design effort.

## Acceptance Checklist

- [ ] Top section contains a workflow decision table.
- [ ] Quickstart is 3 steps or fewer.
- [ ] README has no repeated command explanations.
- [ ] README includes explicit expectations (time/disk/failure/prereqs).
- [ ] README contains 1-2 examples max.
- [ ] README links to deep docs for advanced details.

