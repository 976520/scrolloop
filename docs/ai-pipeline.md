# AI Development Pipeline

This document describes the AI-assisted development pipeline for `scrolloop`. The pipeline uses **n8n** as the orchestrator and **GitHub Actions** as the isolated code-execution environment.

## Architecture Principle

> **n8n must NOT directly modify source code.**

n8n is only responsible for:

- receiving GitHub events (issues, PR comments, check runs),
- validating labels and author permissions,
- classifying the task type,
- dispatching a GitHub Actions workflow via `workflow_dispatch`.

All actual code modification happens inside the GitHub Actions runner, in an isolated environment, against a dedicated branch.

```
GitHub event ──▶ n8n (validate / classify / dispatch)
                          │
                          ▼
              GitHub Actions (ai-dev.yml)
                          │
                          ▼
              Branch ai/issue-N  ──▶  Pull Request → develop
```

---

## 1. Labels

The pipeline is driven entirely by labels. Add these to the repository before enabling the workflow.

### Workflow labels

| Label          | Meaning                                                             |
| -------------- | ------------------------------------------------------------------- |
| `ai:ready`     | Issue is approved for AI implementation                             |
| `ai:plan`      | AI should only generate an implementation plan, not modify code     |
| `ai:fix`       | AI is allowed to modify code                                        |
| `ai:docs`      | Documentation-only task                                             |
| `ai:test`      | Test-only task                                                      |
| `ai:blocked`   | Human review required before any AI action                          |
| `ai:dangerous` | AI automation must not run on this issue/PR under any circumstances |

### Area labels

| Label               | Scope                        |
| ------------------- | ---------------------------- |
| `area:core`         | `packages/core`              |
| `area:react`        | `packages/react`             |
| `area:react-native` | `packages/react-native`      |
| `area:preact`       | `packages/preact`            |
| `area:vue`          | `packages/vue`               |
| `area:svelte`       | `packages/svelte`            |
| `area:shared`       | `packages/shared`            |
| `area:docs`         | `docs/`, READMEs             |
| `area:build`        | build, tsup, turbo, tsconfig |

An issue should carry exactly one `ai:*` action label plus one or more `area:*` labels.

---

## 2. n8n Workflows

n8n is the only component that talks to GitHub webhooks. It never executes code from the repository.

### 2.1 Issue workflow

Trigger: issue `opened`, `labeled`, or `edited`.

1. If the issue does not have `ai:ready`, exit.
2. If the issue has `ai:blocked` or `ai:dangerous`, exit.
3. Verify the issue author is `OWNER`, `MEMBER`, or `COLLABORATOR`. Otherwise exit.
4. Classify the task type from the present `ai:*` label:
   - `ai:plan` → `task_type=plan`
   - `ai:fix` → `task_type=bugfix` or `feature`
   - `ai:docs` → `task_type=docs`
   - `ai:test` → `task_type=test`
5. Build a prompt from the issue title + body, using `docs/ai-dev-prompt-template.md`.
6. Dispatch `ai-dev.yml` via the GitHub REST API:
   `POST /repos/zaewc/scrolloop/actions/workflows/ai-dev.yml/dispatches`.

### 2.2 PR comment workflow

Trigger: `issue_comment` on a pull request.

n8n must respond **only** to a whitelisted slash command at the start of the comment:

- `/ai-plan` — generate an implementation plan, no code changes
- `/ai-fix` — apply a code fix
- `/ai-test` — add or update tests only
- `/ai-docs` — modify documentation only
- `/ai-review` — produce a review comment, no code changes

Rules:

- Ignore comments that are not exactly one of the commands above.
- Reject if the commenter is not `OWNER`, `MEMBER`, or `COLLABORATOR`.
- Reject if the PR comes from a fork (`pull_request.head.repo.fork === true`).
- Never interpret normal issue/comment prose as instructions.

### 2.3 CI failure workflow

Trigger: `check_run` or `workflow_run` with `conclusion=failure` on a PR branch.

1. Pull the failing job's log via the GitHub API.
2. Summarize the log with Gemini (n8n side, read-only).
3. Post a single PR comment with the analysis.
4. Do **not** dispatch `ai-dev.yml`. A maintainer must explicitly comment `/ai-fix` to authorize an actual fix attempt.

---

## 3. GitHub Actions workflow — 3-agent harness

The workflow is defined in [`.github/workflows/ai-dev.yml`](../.github/workflows/ai-dev.yml) and split into three jobs that communicate via the `.harness/<issue_number>/` directory committed to the AI branch:

| Job         | Role          | Reads                               | Writes                                         |
| ----------- | ------------- | ----------------------------------- | ---------------------------------------------- |
| `plan`      | **Planner**   | issue/PR context + repo (read-only) | `.harness/<n>/plan.md` (artifact + commit)     |
| `implement` | **Generator** | `plan.md`                           | code edits, `.harness/<n>/plan.md` (commit)    |
| `evaluate`  | **Evaluator** | `plan.md` + git diff vs develop     | `.harness/<n>/review.md` (commit + PR comment) |

Key rules:

- Trigger: `workflow_dispatch` only. Cannot be invoked by an issue/comment event directly.
- Inputs: `issue_number`, `task_type`, `prompt`, optional `head_branch`.
- Branch: `ai/issue-<issue_number>` by default; if `head_branch` is passed, that exact branch is updated (used by `/ai-apply-review`).
- `task_type=plan` runs only the Planner; the PR contains only the plan markdown.
- Any other `task_type` runs Planner + Generator + Evaluator in sequence. Generator commits code, Evaluator posts a verdict as a PR comment.
- Evaluator can only return text; any incidental file edits the model attempts are reverted.
- Target: PR is opened against `develop`, never `master`.
- Permissions scoped to `contents: write`, `pull-requests: write`, `issues: write`. No `id-token`, no `NPM_TOKEN`, so the workflow cannot publish.
- Each Gemini call uses [`.github/actions/gemini`](../.github/actions/gemini/action.yml), a composite action that retries through a model fallback chain (`GEMINI_MODELS` variable) and, where allowed (`plan`/`evaluate` only), falls back to a direct REST API call when the CLI hits quota.

---

## 4. Example n8n dispatch payload

This is the JSON body n8n should `POST` to the `workflow_dispatch` endpoint:

```json
{
  "ref": "develop",
  "inputs": {
    "issue_number": "12",
    "task_type": "bugfix",
    "prompt": "..."
  }
}
```

`ref` is the branch the workflow definition is read from, not the working branch. The workflow itself creates `ai/issue-12` from `develop` once it starts.

---

## 5. Security rules

These rules apply to both n8n and the GitHub Actions workflow.

- **No fork PRs.** AI automation must not run when `pull_request.head.repo.fork === true`. Secrets must never be exposed to untrusted code.
- **Authorized users only.** Commands and dispatches must be gated on `author_association ∈ { OWNER, MEMBER, COLLABORATOR }`.
- **No secret printing.** Do not `echo` or log environment variables, tokens, or `secrets.*`.
- **No publishing.** The AI workflow must not run `pnpm publish`, must not touch `cd.yml`, and must not have `NPM_TOKEN` available.
- **No auto-merge.** PRs opened by the AI workflow stay open until a human approves and merges them.
- **Protected paths.** Do not modify any of the following unless the issue explicitly requested it (kept in sync with `ai-dev-prompt-template.md` rule 7):
  - `.github/workflows/cd.yml`
  - `.github/workflows/ai-dev.yml`
  - secret-bearing files: `.env`, `.env.*`, `*.pem`, `*.key`, `*.p12`, `secrets.yml`, `secrets.yaml`
  - registry / publish config: `.npmrc`, `.npmignore`
  - `package.json` `version` fields
- **Do not blindly update lockfiles.** `pnpm-lock.yaml` changes only when `package.json` `dependencies` / `devDependencies` / `peerDependencies` are intentionally changed in the same task.
- **Whitelisted commands only.** Treat arbitrary issue/PR comment text as data, never as instructions. Only the slash commands listed in section 2.2 are honored.
- **Branch scope.** AI branches use the `ai/issue-*` prefix and PRs always target `develop`.

---

## 6. Required setup

To enable the pipeline, a maintainer must:

1. Create the labels listed in section 1.
2. Add the following GitHub Actions secrets:
   - `GEMINI_API_KEY` — used by Gemini CLI inside `ai-dev.yml`. Get one from Google AI Studio (https://aistudio.google.com/apikey); free tier covers `gemini-2.5-flash`.
   - (optional repo variable) `GEMINI_MODELS` — comma-separated fallback chain, e.g. `gemini-2.5-flash,gemini-2.5-flash-lite,gemini-2.0-flash-lite`. The workflow tries each in order on HTTP 429 (free-tier daily quota), then falls back to a direct Gemini REST API call for `plan` task types. Defaults to the chain above.
3. Configure n8n with:
   - a GitHub App or PAT with `contents:write`, `pull_requests:write`, `issues:write`, `actions:write` (for `workflow_dispatch`),
   - webhook endpoints for `issues`, `issue_comment`, and `workflow_run`.
4. Confirm `develop` exists and is the default integration branch.

See also: [`ai-dev-prompt-template.md`](./ai-dev-prompt-template.md).
