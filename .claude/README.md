# scrolloop AI harness

This directory configures Claude Code for scrolloop. The guiding principle from harness engineering: **enforce quality with mechanisms, not prompts**, and push every check to the fastest feedback layer.

```
PostToolUse hook (ms)  →  pre-commit / husky (s)  →  CI (min)  →  human review (h)
```

## What's here

| Path                                         | Role                                                                                                                                                              |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `../CLAUDE.md`, `../packages/core/CLAUDE.md` | Short, pointer-style context loaded at session start. Root persists through compaction; the nested one loads when you touch `core`.                               |
| `settings.json`                              | Team-shared permissions + hooks. `settings.local.json` is personal (git-ignored), keep it minimal.                                                                |
| `hooks/format.sh`                            | **PostToolUse** — prettier-writes and `oxlint --fix`es every file Claude edits; reports unfixable lint back so Claude self-corrects. You never hand-run prettier. |
| `hooks/guard-bash.sh`                        | **PreToolUse(Bash)** — blocks `rm -rf /`, fork bombs, npm/yarn (pnpm-only), lockfile overwrites, force-push to master/main.                                       |
| `hooks/guard-write.sh`                       | **PreToolUse(Write/Edit)** — blocks edits to lockfiles, `dist/`, `coverage/`, `.turbo/`, build info.                                                              |
| `agents/adapter-parity-reviewer.md`          | Subagent: audits public-API parity across framework adapters in an isolated context.                                                                              |
| `commands/check.md`                          | `/check` — full local gate (oxlint + typecheck + test).                                                                                                           |
| `commands/release.md`                        | `/release` — changesets release flow (stops before publish).                                                                                                      |

## Layering rationale

- **CLAUDE.md** = always-on, so it's deliberately tiny (the model's compliance drops as instructions pile up). Anything procedural moved to `commands/`; anything "always do X" moved to hooks.
- **Hooks** = deterministic. They can't be ignored, hallucinated, or argued with, and cost little context.
- **Permissions** in `settings.json` are defense-in-depth alongside the guard hooks: `allow` skips prompts for safe commands, `deny` hard-blocks, `ask` gates irreversible ones (push/publish).
- **Subagent** keeps a noisy cross-package audit out of the main context.

## Maintenance

Review this harness **every 3–6 months and after every major model release.** Newer models need fewer hand-holding rules — a constraint that helped an old model becomes friction on a new one. When Claude repeatedly makes the same mistake, don't add a CLAUDE.md sentence — add a lint rule, a test, or a hook (the durable fix). When it reliably does the right thing without a rule, delete the rule.

Test a hook manually:

```bash
echo '{"tool_input":{"file_path":"packages/core/src/index.ts"}}' | bash .claude/hooks/format.sh
echo '{"tool_input":{"command":"npm install lodash"}}' | bash .claude/hooks/guard-bash.sh   # should print BLOCKED, exit 2
```
