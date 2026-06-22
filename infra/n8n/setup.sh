#!/usr/bin/env bash
# Idempotent setup script for the n8n orchestrator host.
# Run on the target Ubuntu server (Phase 1 + 2 of docs/ai-pipeline.md setup).
#
#   curl -fsSL https://raw.githubusercontent.com/zaewc/scrolloop/develop/infra/n8n/setup.sh | bash
# or, if you've already cloned the repo:
#   cd infra/n8n && ./setup.sh

set -euo pipefail

cd "$(dirname "$0")"

log()  { printf '\033[1;34m[setup]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[warn]\033[0m  %s\n' "$*"; }
die()  { printf '\033[1;31m[fail]\033[0m  %s\n' "$*" >&2; exit 1; }

# --- 1. sanity checks ---------------------------------------------------------
[ "$(uname -s)" = "Linux" ] || die "This script is meant to run on the Linux host, not on macOS."

# --- 2. Docker + Compose plugin ----------------------------------------------
if ! command -v docker >/dev/null 2>&1; then
  log "Docker not found; installing from get.docker.com"
  curl -fsSL https://get.docker.com | sudo sh
  sudo usermod -aG docker "$USER"
  warn "Added $USER to the 'docker' group. The new group is not active in this shell yet; this script will use sudo for docker commands until you re-login."
else
  log "Docker present: $(sudo -n docker --version 2>/dev/null || docker --version)"
fi

# Pick a docker invocation that works whether or not the current shell has the
# docker group activated yet (right after a fresh install it won't).
if docker info >/dev/null 2>&1; then
  DOCKER="docker"
elif sudo -n docker info >/dev/null 2>&1; then
  DOCKER="sudo docker"
  warn "Using 'sudo docker' for this run; log out and back in to use plain 'docker'."
else
  die "Cannot reach Docker daemon (neither as $USER nor via sudo). Is the daemon running?"
fi

if ! $DOCKER compose version >/dev/null 2>&1; then
  die "docker compose plugin is missing. Install 'docker-compose-plugin' (Ubuntu: apt install docker-compose-plugin)."
else
  log "Compose present: $($DOCKER compose version)"
fi

# --- 3. .env ------------------------------------------------------------------
if [ ! -f .env ]; then
  log ".env not found; creating from .env.example with generated secrets"
  cp .env.example .env
  chmod 600 .env

  enc_key=$(openssl rand -hex 32)
  basic_pw=$(openssl rand -base64 24 | tr -d '/+=' | cut -c1-24)

  # Portable in-place sed (BSD/GNU): write to tmp then mv.
  tmp=$(mktemp)
  sed \
    -e "s|CHANGE_ME_64_HEX_CHARS|${enc_key}|" \
    -e "s|CHANGE_ME_STRONG_PASSWORD|${basic_pw}|" \
    .env > "$tmp"
  mv "$tmp" .env
  chmod 600 .env

  log "Generated .env. Basic Auth credentials:"
  printf '    user: admin\n    pass: %s\n' "$basic_pw"
  warn "Save this password somewhere safe. Also back up N8N_ENCRYPTION_KEY from .env."
else
  log ".env already exists; leaving it untouched"
fi

# --- 4. boot ------------------------------------------------------------------
log "Pulling images"
$DOCKER compose pull

log "Starting n8n"
$DOCKER compose up -d

log "Waiting for healthcheck..."
for i in $(seq 1 30); do
  status=$($DOCKER inspect -f '{{.State.Health.Status}}' n8n 2>/dev/null || echo "starting")
  if [ "$status" = "healthy" ]; then
    log "n8n is healthy"
    break
  fi
  sleep 2
done

log "Done."
cat <<EOF

Next steps:
  1. From your workstation, open an SSH tunnel:
       ssh -L 5678:127.0.0.1:5678 -p 27113 ubuntu@<host>
  2. In your browser go to http://localhost:5678 and finish the n8n owner setup.
  3. Inside n8n -> Credentials, add:
       - GitHub PAT (contents:write, pull_requests:write, issues:write, actions:write)
       - Anthropic API key (only if you call Claude from inside n8n)
  4. Build the three workflows described in ../../docs/ai-pipeline.md section 2.
  5. When you have a domain, enable the Caddy block in docker-compose.yml.

EOF
