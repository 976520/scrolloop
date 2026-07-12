// Hermes ENGINEER — the autonomous coding agent.
//
// Reads the issue context from the environment, runs the Claude Agent SDK loop
// (plan -> implement -> self-verify -> fix) inside the repo checkout, and writes
// its final report to .harness/<n>/. It does NOT commit, push, or open the PR —
// hermes.yml does that after this exits 0.
//
// Env in:  HERMES_ISSUE_NUMBER, HERMES_TASK_TYPE, HERMES_SEED_FILE, ANTHROPIC_API_KEY
// Files out: .harness/<n>/plan.md   (task_type=plan)
//            .harness/<n>/summary.md (otherwise)

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { query } from "@anthropic-ai/claude-agent-sdk";
import { makeGuard } from "./guard.mjs";
import { engineerPrompt } from "./prompt.mjs";

const issueNumber = process.env.HERMES_ISSUE_NUMBER ?? "0";
const taskType = process.env.HERMES_TASK_TYPE ?? "feature";
const seedFile = process.env.HERMES_SEED_FILE ?? ".ai/prompt-seed.txt";
const isPlan = taskType === "plan";

let seedPrompt = "";
try {
  seedPrompt = readFileSync(seedFile, "utf8");
} catch {
  console.error(
    `::warning::seed file ${seedFile} not found; running with empty seed`
  );
}

const outDir = `.harness/${issueNumber}`;
mkdirSync(outDir, { recursive: true });

/** Pull readable text out of an assistant message for CI-log visibility. */
function assistantText(message) {
  const content = message?.message?.content ?? message?.content;
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .filter((b) => b?.type === "text" && typeof b.text === "string")
    .map((b) => b.text)
    .join("");
}

const options = {
  model: "claude-opus-4-8",
  cwd: process.cwd(),
  maxTurns: isPlan ? 40 : 80,
  permissionMode: "bypassPermissions",
  allowDangerouslySkipPermissions: true,
  // Do NOT load project settings: the repo's `ask` rules (git push / publish) would
  // hang headless, and this guard is our single enforcement point.
  settingSources: [],
  systemPrompt: { type: "preset", preset: "claude_code" },
  allowedTools: isPlan
    ? ["Read", "Glob", "Grep"]
    : ["Read", "Write", "Edit", "MultiEdit", "Glob", "Grep", "Bash"],
  hooks: { PreToolUse: [{ hooks: [makeGuard()] }] },
  env: {
    ...process.env,
    API_TIMEOUT_MS: process.env.API_TIMEOUT_MS ?? "180000",
    CLAUDE_CODE_MAX_RETRIES: process.env.CLAUDE_CODE_MAX_RETRIES ?? "3",
  },
};

console.log(`::group::Hermes engineer — issue #${issueNumber} (${taskType})`);

let resultText = "";
let hadError = false;

try {
  for await (const message of query({
    prompt: engineerPrompt({ issueNumber, taskType, seedPrompt }),
    options,
  })) {
    switch (message.type) {
      case "assistant": {
        const t = assistantText(message).trim();
        if (t) console.log(t);
        break;
      }
      case "result": {
        resultText =
          typeof message.result === "string"
            ? message.result
            : JSON.stringify(message.result ?? "");
        hadError = Boolean(message.is_error) || message.subtype === "error";
        console.log(
          `\n[result] subtype=${message.subtype} turns=${message.num_turns} cost=$${(message.total_cost_usd ?? 0).toFixed(4)}`
        );
        break;
      }
      case "system":
        // init / capabilities — noise in logs, skip.
        break;
      default:
        break;
    }
  }
} catch (err) {
  console.error(`::error::Hermes engineer crashed: ${err?.stack || err}`);
  hadError = true;
}

console.log("::endgroup::");

const outFile = isPlan ? `${outDir}/plan.md` : `${outDir}/summary.md`;
const body =
  resultText.trim() ||
  `_(agent produced no final report; subtype error=${hadError})_`;
writeFileSync(outFile, `${body}\n`);
console.log(`Wrote ${outFile} (${body.length} bytes)`);

if (hadError) {
  console.error("::error::Hermes engineer finished with an error result");
  process.exit(1);
}
if (!resultText.trim()) {
  console.error("::error::Hermes engineer produced no final report");
  process.exit(1);
}
