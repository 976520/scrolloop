# n8n workflow exports

Importable n8n workflows for the AI pipeline, committed so deployments are
reproducible (see [`../README.md`](../README.md) and
[`docs/ai-pipeline.md`](../../../docs/ai-pipeline.md)).

| File                  | Workflow                                                                                                                  | Trigger                 |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| `issue-dispatch.json` | **Issue → dispatch**. Gates on `ai:ready` / author / not-blocked, classifies `task_type`, and dispatches the right track. | GitHub `issues` webhook |

The PR-comment and CI-failure workflows from `docs/ai-pipeline.md` §2 are not yet
exported here — add them the same way once built.

## `issue-dispatch.json` — Gemini + Hermes routing

Node graph: **Webhook** → **Gate & classify** (Code) → **Dispatch** (HTTP Request).

The Code node decides the track: if the issue carries **`ai:hermes`** it dispatches
[`hermes.yml`](../../../.github/workflows/hermes.yml) (the Claude Agent SDK track);
otherwise [`ai-dev.yml`](../../../.github/workflows/ai-dev.yml) (Gemini). Everything
else — the `ai:ready` gate, the `OWNER`/`MEMBER`/`COLLABORATOR` author check, the
`ai:blocked` / `ai:dangerous` exclusions, `task_type` classification, and the
rendered seed prompt — matches `docs/ai-pipeline.md` §2.1 for both tracks.

### Import & wire up

1. In n8n: **Workflows → Import from File →** `issue-dispatch.json`.
2. Open the **Dispatch workflow_dispatch** node and set its credential to your
   **GitHub (scrolloop)** PAT credential (the exported file has a placeholder
   `credentials.githubApi.id` of `REPLACE_WITH_CREDENTIAL_ID` — n8n prompts you to
   pick the real credential on import; just select it). The PAT needs
   `actions:write` for `workflow_dispatch`, plus the usual `contents`/`pull_requests`/`issues` write scopes.
3. Activate the workflow, then register a GitHub **Issues** webhook pointing at the
   Webhook node's production URL (`https://<your-n8n-host>/webhook/github-issue`).
   Until you have a public HTTPS endpoint (see `../README.md` → _Enabling public
   webhooks_), fire the URL manually from your SSH-tunneled session to test.

### Verify

Add `ai:ready` + `ai:hermes` (+ an `area:*` label) to a throwaway issue and confirm
n8n dispatches `hermes.yml`. Removing `ai:hermes` should dispatch `ai-dev.yml`
instead. Start with an `ai:plan` issue — the safest smoke test (no code changes).

> This workflow is **read/dispatch only** — it never modifies repository source.
> All code changes happen inside GitHub Actions.

### Re-exporting

`issue-dispatch.json` is generated with correct escaping; if you edit the workflow
in the n8n UI, re-export it (**⋯ → Download**) over this file so the repo stays the
source of truth. Strip any real credential IDs before committing.
