# AI Development Prompt Template

This is the reusable prompt that n8n injects into the `prompt` input of [`ai-dev.yml`](../.github/workflows/ai-dev.yml). Keep it short, explicit, and repository-specific.

---

## Template

```
You are working in the `zaewc/scrolloop` repository on branch `ai/issue-{{ISSUE_NUMBER}}` (cut from `develop`).

Issue #{{ISSUE_NUMBER}} — {{ISSUE_TITLE}}
Task type: {{TASK_TYPE}}        # one of: plan | bugfix | feature | docs | test
Area labels: {{AREA_LABELS}}    # e.g. area:core, area:react

--- Issue body ---
{{ISSUE_BODY}}
------------------

Rules:

1. Inspect the repository structure first. This is a pnpm + turborepo monorepo with
   packages under `packages/{core,react,react-native,preact,vue,svelte,shared}`.
2. Identify the affected package(s) from the area labels and the issue body.
   Touch only those packages. Cross-package changes require an explicit instruction
   in the issue.
3. If the same behavior is implemented in multiple adapters, prefer fixing it once
   in `packages/core` (or `packages/shared`) and let adapters inherit, rather than
   patching each adapter.
4. Keep the diff minimal. Do not refactor unrelated code, do not rename symbols,
   do not reformat files you did not otherwise touch.
5. Do not change the public API (exported names, type signatures, default exports)
   unless the issue explicitly requires it. If you must, call it out in the PR body.
6. When behavior changes, add or update tests in the same package
   (`packages/<pkg>/src/**/*.test.ts(x)` or the package's existing test layout).
7. Do not modify any of the following unless the issue explicitly says so:
   - `.github/workflows/cd.yml`
   - `.github/workflows/ai-dev.yml`
   - any file matching `*token*`, `*secret*`, `.npmrc`, `.npmignore`
   - `package.json` `version` fields, `pnpm-lock.yaml` (unless `package.json` deps
     were intentionally changed in this task)
8. Run verification before declaring done. Try, in order, and skip any that are not
   defined in `package.json`:
       pnpm install --frozen-lockfile
       pnpm typecheck
       pnpm lint
       pnpm test
       pnpm build
9. If `task_type == plan`, do not modify code. Write the plan into the PR body
   only, and open the PR with `[plan]` in the title.

Output (will be used as the PR description):

- **Summary** — one paragraph, what changed and why.
- **Files changed** — bullet list of paths.
- **Verification** — exact commands run and pass/fail.
- **Public API impact** — `none` or a list of changes.
- **Follow-ups** — anything intentionally left out of scope.
```

---

## Notes for n8n

- Substitute `{{ISSUE_NUMBER}}`, `{{ISSUE_TITLE}}`, `{{ISSUE_BODY}}`, `{{TASK_TYPE}}`, and `{{AREA_LABELS}}` before dispatch.
- Do not include any other repository content inline; the workflow checks out the repo so Claude can read it directly.
- Do not include secrets, tokens, or environment values in the rendered prompt.
