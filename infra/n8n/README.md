# n8n orchestrator deployment

This directory contains everything needed to run the n8n orchestrator that drives
the [AI dev pipeline](../../docs/ai-pipeline.md). The orchestrator is intentionally
read/dispatch only — it never modifies repository source code. Code modification
runs inside GitHub Actions via [`ai-dev.yml`](../../.github/workflows/ai-dev.yml).

```
.
├── docker-compose.yml      n8n service (+ commented Caddy block for later)
├── .env.example            template; copy to .env and fill in secrets
├── Caddyfile.example       template; copy to Caddyfile when you have a domain
├── setup.sh                idempotent installer (Docker + .env + boot)
└── README.md
```

## MVP deployment (no public domain yet)

This is the path for the current state: no DNS, no HTTPS, n8n reachable only
through an SSH tunnel from your workstation. GitHub webhooks cannot reach n8n
in this mode — see "Enabling webhooks" below.

On the target Ubuntu host:

```bash
# 1. Clone the repo (or just this directory).
git clone https://github.com/zaewc/scrolloop.git
cd scrolloop/infra/n8n

# 2. One-shot install: Docker, generated secrets, bring up n8n.
./setup.sh
```

`setup.sh` will:

- install Docker + Compose plugin if missing,
- copy `.env.example` to `.env`,
- generate a 64-hex-char `N8N_ENCRYPTION_KEY`,
- generate a random `N8N_BASIC_AUTH_PASSWORD` and print it once,
- `docker compose up -d`,
- wait for the container healthcheck.

Then from your workstation:

```bash
ssh -L 5678:127.0.0.1:5678 -p 27113 ubuntu@<host>
# leave that session open, in a browser go to:
http://localhost:5678
```

Sign in with the Basic Auth credentials printed by `setup.sh`, then create the
initial n8n owner account.

## Credentials inside n8n

Do not put workflow secrets in `.env`. Add them in the n8n UI under **Credentials**
so they are encrypted with `N8N_ENCRYPTION_KEY`:

| Name                 | Type        | Scopes                                                                            |
| -------------------- | ----------- | --------------------------------------------------------------------------------- |
| GitHub (scrolloop)   | GitHub PAT  | `contents:write`, `pull_requests:write`, `issues:write`, `actions:write`          |
| Anthropic (optional) | HTTP Header | `x-api-key: <key>` — only if n8n itself calls Claude (e.g. CI failure summarizer) |

The PAT is what n8n uses to call `POST /repos/zaewc/scrolloop/actions/workflows/ai-dev.yml/dispatches`.

## The three workflows to build

Inside n8n, build the workflows defined in
[`docs/ai-pipeline.md` §2](../../docs/ai-pipeline.md). Sketch:

1. **Issue** — `Webhook` → `IF` (label gate) → `IF` (author_association gate) → `Switch` (task_type) → `Set` (rendered prompt) → `HTTP Request` (`workflow_dispatch`).
2. **PR comment** — `Webhook` → `IF` (slash command + author + non-fork) → `Switch` (command) → `HTTP Request` (`workflow_dispatch`).
3. **CI failure** — `Webhook` → `IF` (`conclusion == failure`) → `HTTP Request` (fetch logs) → `Anthropic` (summarize) → `HTTP Request` (comment on PR). Never dispatches `ai-dev.yml`.

Export each workflow as JSON and commit to `infra/n8n/workflows/` so deployments
are reproducible. (That folder is intentionally not in this initial scaffold —
add it after you build the first workflow.)

## Enabling public webhooks (when a domain is ready)

GitHub will only deliver webhooks to HTTPS endpoints with a valid certificate.
Until then, n8n triggers must be tested by manually firing the webhook URL from
your SSH-tunneled session.

Once DNS is set up:

1. Point an A record (e.g. `n8n.example.com`) at the host.
2. Open firewall ports 80 and 443.
3. `cp Caddyfile.example Caddyfile` and replace `YOUR_DOMAIN_HERE`.
4. In `.env` switch:
   ```
   N8N_HOST=n8n.example.com
   N8N_PROTOCOL=https
   WEBHOOK_URL=https://n8n.example.com/
   ```
5. In `docker-compose.yml` remove the `127.0.0.1:` prefix from the `n8n` ports
   binding (or remove the `ports:` block entirely so n8n is only reachable via
   Caddy on the compose network).
6. Uncomment the `caddy` service and `caddy_data` / `caddy_config` volumes.
7. `docker compose up -d`.
8. In the GitHub repo, add webhooks pointing at `https://n8n.example.com/webhook/<path>`
   for each workflow (Issues, Issue comments, Workflow runs). Use a webhook
   secret and verify `X-Hub-Signature-256` in the first node of each workflow.

## Operations

- **Upgrade**: `docker compose pull && docker compose up -d`.
- **Backup**: `docker run --rm -v n8n_n8n_data:/data -v $PWD:/backup alpine tar czf /backup/n8n-$(date +%F).tgz -C /data .`. Combined with `N8N_ENCRYPTION_KEY` from `.env`, this is sufficient to restore.
- **Logs**: `docker compose logs -f n8n`.
- **Stop**: `docker compose down` (volumes persist). Add `-v` only if you want to wipe state.

## Security defaults applied here

- `127.0.0.1:5678` binding — service is not exposed publicly until Caddy is enabled.
- Basic Auth in front of the n8n UI.
- `N8N_DIAGNOSTICS_ENABLED=false`, `N8N_VERSION_NOTIFICATIONS_ENABLED=false`.
- `N8N_BLOCK_FILE_ACCESS_TO_N8N_FILES=true`.
- Workflow secrets live in n8n's encrypted credential store, not in `.env`.
- `.env` is git-ignored (see root `.gitignore`).
