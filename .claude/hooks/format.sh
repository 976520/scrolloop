#!/usr/bin/env bash
# PostToolUse(Write|Edit|MultiEdit): auto-format + fast-lint the edited file.
# Fastest feedback layer (ms). prettier writes; oxlint --fix fixes what it can and
# reports the rest back to Claude (exit 2) so it self-corrects instead of moving on.
set -uo pipefail

input=$(cat)
file=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')
[ -z "${file:-}" ] && exit 0
[ -f "$file" ] || exit 0
cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0

case "$file" in
  *.ts|*.tsx|*.js|*.jsx|*.mjs|*.cjs|*.vue|*.svelte|*.json|*.jsonc|*.md|*.css|*.scss|*.html|*.yml|*.yaml)
    pnpm exec prettier --write --log-level silent "$file" >/dev/null 2>&1 || true
    ;;
  *)
    exit 0
    ;;
esac

case "$file" in
  *.ts|*.tsx|*.js|*.jsx|*.mjs|*.cjs|*.vue|*.svelte)
    if ! out=$(pnpm exec oxlint --fix "$file" 2>&1); then
      {
        echo "oxlint reports issues in $file that need a real fix (not auto-fixable):"
        echo "$out"
      } >&2
      exit 2
    fi
    ;;
esac

exit 0
