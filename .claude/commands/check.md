---
description: Run the full local verification gate (fast lint, typecheck, tests) and summarize failures.
allowed-tools: Bash(pnpm lint:fast), Bash(pnpm typecheck), Bash(pnpm test), Bash(pnpm lint:*), Bash(pnpm run:*), Bash(pnpm --filter:*)
argument-hint: "[package filter, e.g. @scrolloop/core]"
---

Run scrolloop's local verification gate and report results concisely. If `$ARGUMENTS` names a package, scope each step with `pnpm --filter $ARGUMENTS …`; otherwise run repo-wide.

Run in order and capture output:

1. `pnpm lint:fast` (oxlint)
2. `pnpm typecheck`
3. `pnpm test`

Then summarize:

- A ✓/✗ line per step.
- For any failure, the specific file:line and error, plus the minimal fix — do not dump full logs.
- If all pass: state it's ready for commit (remember: atomic Conventional Commits, no `Co-Authored-By`).

Do not commit or push. Stop after reporting unless asked to fix.
