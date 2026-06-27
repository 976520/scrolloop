#!/usr/bin/env bash
# PreToolUse(Bash): block clearly destructive / wrong-tool commands before they run.
# Deterministic enforcement — not a suggestion in CLAUDE.md.
set -uo pipefail

input=$(cat)
cmd=$(printf '%s' "$input" | jq -r '.tool_input.command // empty')
[ -z "${cmd:-}" ] && exit 0

block() { echo "BLOCKED by harness: $1" >&2; exit 2; }

case "$cmd" in
  *"rm -rf /"*|*"rm -fr /"*|*"rm -rf ~"*|*"rm -rf /*"*)
    block "destructive recursive delete of a root/home path" ;;
  *":(){ :|:& };:"*)
    block "fork bomb" ;;
  *"npm install"*|*"npm i "*|*"yarn add"*|*"yarn install"*|*"bun install"*|*"bun add"*)
    block "this repo uses pnpm — use 'pnpm install' / 'pnpm add'" ;;
  *"> pnpm-lock.yaml"*|*"> package-lock.json"*)
    block "do not overwrite lockfiles — let the package manager regenerate them" ;;
esac

case "$cmd" in
  *"git push"*--force*|*"git push"*" -f"*)
    case "$cmd" in
      *master*|*main*) block "force-push to a protected branch (master/main)" ;;
    esac ;;
esac

exit 0
