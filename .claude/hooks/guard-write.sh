#!/usr/bin/env bash
# PreToolUse(Write|Edit|MultiEdit): protect generated & lock files from edits,
# with a teaching message so Claude does the right thing instead.
set -uo pipefail

input=$(cat)
file=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')
[ -z "${file:-}" ] && exit 0

block() { echo "BLOCKED by harness: $1 ($file)" >&2; exit 2; }

case "$file" in
  */pnpm-lock.yaml|*/package-lock.json|*/yarn.lock)
    block "lockfiles are generated — run 'pnpm install'/'pnpm add' instead of editing" ;;
  */dist/*|*/coverage/*|*/.turbo/*|*/node_modules/*)
    block "generated/build output — edit the source, then rebuild" ;;
  *.tsbuildinfo)
    block "generated TypeScript build info" ;;
esac

exit 0
