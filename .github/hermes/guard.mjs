// Hermes PreToolUse guard — deterministic enforcement for the autonomous agent.
//
// This is the Agent-SDK port of the repo's Claude Code guard hooks
// (.claude/hooks/guard-bash.sh + guard-write.sh) plus the protected paths from
// docs/ai-pipeline.md §5 and docs/ai-dev-prompt-template.md rule 7.
//
// The engineer runs with settingSources:[] (project settings are NOT loaded), so
// none of the repo's own hooks fire during a Hermes run — this file is the single
// enforcement point. It blocks writes to generated/secret/workflow files and
// blocks destructive / publishing / wrong-package-manager shell commands. Commit,
// push and PR creation are done by the workflow shell, never by the agent, so the
// agent is denied `git push` and every publish path here.
//
// A PreToolUse "deny" is authoritative: per the SDK, deny wins over every other
// hook result, and the reason is fed back to the model so it adjusts course.

/** Files the agent must never create or edit. Checked against Write/Edit/MultiEdit/NotebookEdit. */
export function writeBlockReason(filePath) {
  if (!filePath) return null;
  // Normalise to POSIX and strip a trailing slash; keep it relative-ish for matching.
  const p = String(filePath).replace(/\\/g, "/").replace(/\/+$/, "");
  const base = p.split("/").pop() ?? "";
  const has = (seg) => p.split("/").includes(seg);

  if (
    base === "pnpm-lock.yaml" ||
    base === "package-lock.json" ||
    base === "yarn.lock"
  )
    return "lockfiles are generated — run 'pnpm install' / 'pnpm add' instead of editing them";
  if (has("dist") || has("coverage") || has(".turbo") || has("node_modules"))
    return "generated / build output — edit the source and rebuild, don't touch build artifacts";
  if (base.endsWith(".tsbuildinfo")) return "generated TypeScript build info";
  if (/\.github\/workflows\/(cd|ai-dev|hermes)\.yml$/.test(p))
    return "release / AI-pipeline workflows are protected — changing them is out of scope for an AI run";
  if (base === ".env" || base.startsWith('.env.') || /\.(pem|key|p12)$/.test(base))
    return "secret-bearing file — never create or modify credentials";
  if (base === "secrets.yml" || base === "secrets.yaml")
    return "secret-bearing file";
  if (base === ".npmrc" || base === ".npmignore")
    return "registry / publish config is protected";
  return null;
}

/** Shell commands the agent must never run. Checked against Bash. */
export function bashBlockReason(command) {
  if (!command) return null;
  const c = String(command);

  if (/\brm\s+-[rf]{1,2}\s+(\/(\s|$|\*)|~)/.test(c))
    return "destructive recursive delete of a root / home path";
  if (c.includes(":(){ :|:& };:")) return "fork bomb";
  if (
    /\b(npm\s+(install|i)\b|yarn\s+(add|install)\b|bun\s+(add|install)\b)/.test(
      c
    )
  )
    return "this repo uses pnpm — use 'pnpm install' / 'pnpm add'";
  if (/>\s*(pnpm-lock\.yaml|package-lock\.json|yarn\.lock)/.test(c))
    return "do not overwrite lockfiles — let the package manager regenerate them";
  // Publishing is impossible for this workflow (no NPM_TOKEN) and out of scope regardless.
  if (
    /\b(pnpm|npm|yarn)\s+publish\b/.test(c) ||
    /\bchangeset\s+publish\b/.test(c)
  )
    return "publishing is out of scope for an AI run and this workflow cannot publish";
  // Commit / push / PR are the workflow's job, not the agent's.
  if (/\bgit\s+push\b/.test(c))
    return "the workflow handles commit and push — the agent must not push";
  return null;
}

/**
 * Build the PreToolUse hook callback. Registered with no matcher so it inspects
 * every tool call; it only acts on Bash / Write-family tools and allows the rest.
 */
export function makeGuard() {
  return async (input) => {
    if (input?.hook_event_name !== "PreToolUse") return {};
    const tool = input.tool_name;
    const args = input.tool_input ?? {};

    let reason = null;
    if (tool === "Bash") {
      reason = bashBlockReason(args.command);
    } else if (
      tool === "Write" ||
      tool === "Edit" ||
      tool === "MultiEdit" ||
      tool === "NotebookEdit"
    ) {
      reason = writeBlockReason(args.file_path ?? args.notebook_path);
    }

    if (reason) {
      return {
        systemMessage: `Hermes guard blocked ${tool}: ${reason}`,
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          permissionDecision: "deny",
          permissionDecisionReason: `Blocked by Hermes guard: ${reason}`,
        },
      };
    }
    return {};
  };
}

// --- self-test: `node guard.mjs --self-test` ---------------------------------
if (process.argv.includes("--self-test")) {
  const cases = [
    // [kind, value, shouldBlock]
    ["write", "packages/core/pnpm-lock.yaml", true],
    ["write", "packages/react/dist/index.js", true],
    ["write", ".github/workflows/hermes.yml", true],
    ["write", ".github/workflows/ai-dev.yml", true],
    ["write", ".github/workflows/ci.yml", false],
    ["write", "packages/core/.env", true],
    ["write", "deploy.pem", true],
    ["write", ".npmrc", true],
    ["write", "packages/core/src/virtualizer.ts", false],
    ["write", "packages/core/CLAUDE.md", false],
    ["bash", "rm -rf /", true],
    ["bash", "rm -rf ~", true],
    ["bash", "npm install lodash", true],
    ["bash", "yarn add foo", true],
    ["bash", "echo x > pnpm-lock.yaml", true],
    ["bash", "pnpm publish", true],
    ["bash", "changeset publish", true],
    ["bash", "git push origin ai/issue-1", true],
    ["bash", "pnpm test", false],
    ["bash", "pnpm --filter @scrolloop/core typecheck", false],
    ["bash", "git diff origin/develop", false],
  ];
  let failed = 0;
  for (const [kind, value, shouldBlock] of cases) {
    const reason =
      kind === "write" ? writeBlockReason(value) : bashBlockReason(value);
    const blocked = reason !== null;
    const ok = blocked === shouldBlock;
    if (!ok) failed++;
    console.log(
      `${ok ? "ok  " : "FAIL"} ${kind} ${shouldBlock ? "block" : "allow"} :: ${value}${reason ? `  (${reason})` : ""}`
    );
  }
  if (failed) {
    console.error(`\n${failed} guard self-test case(s) failed`);
    process.exit(1);
  }
  console.log("\nall guard self-tests passed");
}
