# Hermes — Autonomous Claude Agent Track

Hermes is the **Claude Agent SDK** track of the AI development pipeline. It runs
alongside the Gemini track ([`ai-dev.yml`](../.github/workflows/ai-dev.yml)) and
reuses the same orchestration (n8n), labels, branch convention (`ai/issue-N` →
`develop`), and security rules described in [`ai-pipeline.md`](./ai-pipeline.md).

The difference is the runtime. The Gemini track is a **1-shot 3-agent harness**
(Planner → Generator → Evaluator). Hermes uses the
[Claude Agent SDK](https://code.claude.com/docs/en/agent-sdk) — Claude Code as a
library — so a single **autonomous agent plans, implements, runs the verification
gate, and iterates until it passes**, then a second **read-only reviewer** posts a
verdict. Planning is folded into the autonomous loop; the Evaluator role the team
relies on is preserved as the reviewer.

```
GitHub event ──▶ n8n (validate / classify / dispatch)
                     │  issue has `ai:hermes`?  ── yes ─▶ hermes.yml (this doc)
                     │                            no  ─▶ ai-dev.yml (Gemini)
                     ▼
             GitHub Actions hermes.yml   (workflow_dispatch)
                     │
        ┌────────────┴─────────────┐
        ▼                          ▼
   engineer.mjs                reviewer.mjs
  (Claude Agent SDK:          (read-only Evaluator:
   plan + implement +          diff vs develop →
   self-verify loop)           PASS/NEEDS_CHANGES/BLOCKED)
        │
        ▼
   branch ai/issue-N  ──▶  Pull Request → develop   (no auto-merge)
```

---

## Components

| Path                           | Role                                                                                                  |
| ------------------------------ | ----------------------------------------------------------------------------------------------------- |
| `.github/workflows/hermes.yml` | The workflow. `workflow_dispatch` only; single job: engineer → commit/push/PR → reviewer → comment.   |
| `.github/hermes/engineer.mjs`  | Autonomous agent: plans, edits code, runs `pnpm typecheck/lint/test/build`, iterates. Writes report.  |
| `.github/hermes/reviewer.mjs`  | Read-only agent: compares the diff to intent + repo rules, writes `# Review` with a verdict.          |
| `.github/hermes/guard.mjs`     | `PreToolUse` hook: the single enforcement point (protected paths, destructive/publish/wrong-PM cmds). |
| `.github/hermes/prompt.mjs`    | Prompt composition — mirrors `ai-dev-prompt-template.md` (security boundary, Rules, Output).          |
| `.github/hermes/package.json`  | Isolated mini-project (`@anthropic-ai/claude-agent-sdk`). **Not** in the pnpm workspace.              |

The orchestrator lives outside the pnpm workspace (`packages/*`, `apps/*`) on
purpose, so the SDK and its bundled Claude Code binary never enter contributors'
`pnpm install`. CI installs it in isolation with `pnpm install --dir .github/hermes`;
its `node_modules` and generated `pnpm-lock.yaml` are git-ignored and never land in
an AI PR.

---

## Agent configuration

Both agents run with the same safety posture (`.github/hermes/engineer.mjs`,
`reviewer.mjs`):

- **Model:** `claude-opus-4-8`.
- **`settingSources: []`** — the repo's `.claude/settings.json` is **not** loaded.
  That file has `ask` rules (`git push`, `pnpm publish`) that, under
  `bypassPermissions`, would prompt and hang headless CI. Skipping it also drops the
  dependency on the shell hook scripts. `guard.mjs` is therefore the single
  enforcement point.
- **`permissionMode: "bypassPermissions"`** + `allowDangerouslySkipPermissions` — no
  interactive prompts; `guard.mjs` denies what must not run.
- **Tools:** engineer gets `Read, Write, Edit, MultiEdit, Glob, Grep, Bash`
  (plan-only runs drop the write/Bash tools); reviewer gets `Read, Glob, Grep` only.
- **Guard hook** blocks, deterministically:
  - **Writes** to lockfiles, `dist`/`coverage`/`.turbo`/`node_modules`, `*.tsbuildinfo`,
    `.github/workflows/{cd,ai-dev,hermes}.yml`, `.env*`, `*.pem`/`*.key`/`*.p12`,
    `secrets.y*ml`, `.npmrc`, `.npmignore`.
  - **Bash** `rm -rf /|~`, fork bombs, `npm`/`yarn`/`bun install|add`, lockfile
    overwrites, `pnpm`/`npm`/`yarn publish`, `changeset publish`, and `git push`.
    These mirror `.claude/hooks/guard-bash.sh` + `guard-write.sh` and
    `ai-dev-prompt-template.md` rule 7. `guard.mjs --self-test` asserts the cases.
- **Commit / push / PR are the workflow's job, never the agent's** — the guard denies
  `git push`, and no publishing is possible (no `NPM_TOKEN`, no `id-token`).

---

## Task types

Same set as the Gemini track: `plan | bugfix | feature | docs | test`.

- **`plan`** — engineer runs read-only (`Read`/`Glob`/`Grep`), produces
  `.harness/<n>/plan.md`, opens a `[plan]` PR with no code changes. The reviewer is
  skipped.
- **anything else** — engineer implements + self-verifies, writes
  `.harness/<n>/summary.md`; the reviewer writes `.harness/<n>/review.md` and comments
  it on the PR. A `BLOCKED` verdict fails the workflow for triage.

`.harness/<n>/` is committed (part of the PR diff); `.ai/` is transient and
git-excluded at runtime.

---

## Security

All rules from [`ai-pipeline.md` §5](./ai-pipeline.md#5-security-rules) apply. Hermes
specifics:

- **`workflow_dispatch` only** — like `ai-dev.yml`, it cannot be triggered directly by
  an issue/comment event. n8n validates the author (`OWNER`/`MEMBER`/`COLLABORATOR`)
  and rejects fork PRs before dispatching, so untrusted code never reaches the runner
  with secrets.
- **Scoped permissions:** `contents`, `pull-requests`, `issues` write only. No
  `id-token`, no `NPM_TOKEN` → the workflow physically cannot publish.
- **Seed prompt is untrusted.** `prompt.mjs` frames the issue body as data, never
  instructions, and both agents are told to refuse in-band injection attempts.
- **Target is always `develop`, never `master`.** No auto-merge.
- The engineer's own actions are constrained by `guard.mjs` (above) — defense in depth
  beyond the prompt rules.

---

## Required setup

In addition to the shared setup in [`ai-pipeline.md` §6](./ai-pipeline.md#6-required-setup):

1. **Secret `ANTHROPIC_API_KEY`** — a Claude API key from the
   [Console](https://platform.claude.com/). Used only by `hermes.yml`.
2. **Label `ai:hermes`** — apply it to an issue to route it to the Claude track
   instead of Gemini.
3. **n8n branch** — when an `ai:ready` issue also has `ai:hermes`, dispatch
   `hermes.yml` (same payload shape as `ai-dev.yml`: `issue_number`, `task_type`,
   `prompt`, optional `head_branch`; `ref: develop`). Without `ai:hermes`, keep
   dispatching `ai-dev.yml`. The GitHub App / PAT already needs `actions:write` for
   `workflow_dispatch`.

## Local checks

```bash
# Syntax + guard unit tests (no install / no API key needed)
cd .github/hermes && node guard.mjs --self-test
node --check engineer.mjs && node --check reviewer.mjs
```

Full end-to-end validation: dispatch `hermes.yml` against a throwaway issue with
`task_type=plan` first (safest — no code edits), confirm a `[plan]` PR opens against
`develop`, then try a small `bugfix`/`test` issue.
