---
name: code-simplifier
description: Use only when the user explicitly invokes $code-simplifier or asks to run the code simplifier sub-agent. Simplifies recently modified code for clarity, consistency, and maintainability while preserving behavior.
---

# Code Simplifier

This skill runs a focused code-simplification pass through a sub-agent. It is for recently modified code unless the user explicitly names a broader scope.

## Required Execution Model

- Start a sub-agent for the simplification work with `spawn_agent`. Use a `worker` sub-agent when code edits are needed; use an `explorer` sub-agent only for read-only review.
- Treat explicit `$code-simplifier` invocation as authorization to start that sub-agent.
- Keep the main agent responsible for scoping, reviewing the returned changes, running verification, and integrating any final fixes.
- Do not ask the sub-agent to invoke `$code-simplifier`; it should perform the simplification directly.
- Do not have the main agent independently redo the simplification pass unless the sub-agent result is incomplete or unsafe.

## Scope

Default scope:

- Files changed in the current session.
- Files shown by `git diff --name-only` if no narrower scope is provided.
- Directly adjacent code only when needed to make the touched code simpler or consistent.

Do not broaden scope across unrelated modules without explicit user instruction.

## Sub-Agent Prompt

Give the sub-agent a bounded prompt with:

- The exact files or modules it owns.
- The instruction that it is not alone in the codebase and must not revert edits made by others.
- A request to preserve behavior exactly.
- The project's relevant style constraints from `AGENTS.md`.
- A requirement to list changed files and any verification it ran.

Use this structure:

```text
Simplify the recently modified code in these files:

- <file path>

You are not alone in the codebase. Do not revert edits made by others, and adapt to any concurrent changes you see.

Simplify and refine the code for clarity, consistency, and maintainability while preserving exact behavior. Keep edits narrow. Prefer explicit, readable code over compact or clever code. Avoid nested ternaries. Remove redundant abstractions and obvious comments only when doing so improves readability.

Follow the repository's AGENTS.md instructions and local file style. After editing, report changed files, what changed, and what verification you ran.
```

## Simplification Rules

The sub-agent should:

- Preserve all user-visible behavior, APIs, outputs, and side effects.
- Reduce unnecessary nesting, branching, duplication, and incidental abstractions.
- Improve names when a clearer name reduces local ambiguity.
- Consolidate related logic only when it remains easy to debug.
- Remove comments that merely restate obvious code.
- Keep helpful comments that explain non-obvious constraints, invariants, or integration behavior.
- Prefer readable `if`/`else` or `switch` statements over nested ternary operators.
- Match local formatting, import grouping, semicolon style, naming, and component patterns.

The sub-agent should not:

- Change behavior to make code "nicer".
- Collapse readable code into dense one-liners.
- Introduce broad abstractions, large dependencies, or cross-module refactors.
- Rewrite untouched areas for stylistic consistency alone.
- Remove useful boundaries that make testing, debugging, or future changes easier.

## Review And Verification

After the sub-agent finishes:

1. Review the diff for behavior drift and excessive scope.
2. Adjust or reject changes that broaden scope or trade clarity for brevity.
3. Run the narrowest relevant verification. In this repo, prefer:
   - `pnpm typecheck`
   - `pnpm --filter admin lint` when touching `apps/admin`
   - targeted workspace builds when behavior or framework integration changed
4. Report only meaningful simplifications, touched files, and verification results.
