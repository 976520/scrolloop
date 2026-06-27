---
description: Guide a changesets-based release for scrolloop (changeset → version → build → publish).
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(pnpm changeset:*), Bash(pnpm build:*), Bash(pnpm test:*), Bash(pnpm typecheck:*)
---

Drive a scrolloop release using changesets. Base branch is `master`; `access` is public.

1. Confirm a clean tree on the right branch (`git status`) and review what changed since the last release (`git log` / `git diff`).
2. Determine affected packages and the correct semver bump (patch/minor/major) per package. Internal deps bump as `patch`.
3. Create the changeset: `pnpm changeset` — write a clear, user-facing summary line per changed package. If running non-interactively, write the changeset markdown under `.changeset/` directly with the right frontmatter.
4. Verify before versioning: `pnpm typecheck`, `pnpm test`, `pnpm build`.
5. Stop and report the plan (packages + bumps + changeset) for confirmation. Do **not** run `changeset version` or publish without explicit go-ahead — publishing is irreversible.

Reference: `RELEASING.md`. Commit style: atomic Conventional Commits, no `Co-Authored-By`.
