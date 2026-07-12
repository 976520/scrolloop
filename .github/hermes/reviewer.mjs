// Hermes EVALUATOR — read-only reviewer.
//
// Compares the pushed branch's diff against the issue intent + repo rules and
// writes a verdict to .harness/<n>/review.md, which hermes.yml posts as a PR
// comment. Read-only: no Write/Edit/Bash tools, so it cannot change the tree.
//
// Env in:  HERMES_ISSUE_NUMBER, HERMES_TASK_TYPE, HERMES_SEED_FILE,
//          HERMES_DIFF_FILE, ANTHROPIC_API_KEY
// File out: .harness/<n>/review.md

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { query } from "@anthropic-ai/claude-agent-sdk";
import { reviewerPrompt } from "./prompt.mjs";

const issueNumber = process.env.HERMES_ISSUE_NUMBER ?? "0";
const taskType = process.env.HERMES_TASK_TYPE ?? "feature";
const seedFile = process.env.HERMES_SEED_FILE ?? ".ai/prompt-seed.txt";
const diffFile = process.env.HERMES_DIFF_FILE ?? ".ai/diff.patch";

const read = (f) => {
  try {
    return readFileSync(f, "utf8");
  } catch {
    return "";
  }
};

const seedPrompt = read(seedFile);
const summary = read(`.harness/${issueNumber}/summary.md`);
const diff = read(diffFile).slice(0, 30000);

const outDir = `.harness/${issueNumber}`;
mkdirSync(outDir, { recursive: true });

const options = {
  model: "claude-opus-4-8",
  cwd: process.cwd(),
  maxTurns: 20,
  permissionMode: "bypassPermissions",
  allowDangerouslySkipPermissions: true,
  settingSources: [],
  systemPrompt: { type: "preset", preset: "claude_code" },
  // Read-only: the diff is supplied inline; no editing or shell tools.
  allowedTools: ["Read", "Glob", "Grep"],
  env: {
    ...process.env,
    API_TIMEOUT_MS: process.env.API_TIMEOUT_MS ?? "180000",
    CLAUDE_CODE_MAX_RETRIES: process.env.CLAUDE_CODE_MAX_RETRIES ?? "3",
  },
};

console.log(`::group::Hermes reviewer — issue #${issueNumber} (${taskType})`);

let review = "";
let hadError = false;
try {
  for await (const message of query({
    prompt: reviewerPrompt({
      issueNumber,
      taskType,
      seedPrompt,
      summary,
      diff,
    }),
    options,
  })) {
    if (message.type === "result") {
      review =
        typeof message.result === "string"
          ? message.result
          : JSON.stringify(message.result ?? "");
      hadError = Boolean(message.is_error) || message.subtype === "error";
    }
  }
} catch (err) {
  console.error(`::error::Hermes reviewer crashed: ${err?.stack || err}`);
  hadError = true;
}

console.log("::endgroup::");

const body =
  review.trim() ||
  "# Review\n\n## Verdict\nNEEDS_CHANGES\n\n## Findings\nReviewer produced no output.";
writeFileSync(`${outDir}/review.md`, `${body}\n`);
console.log(`Wrote ${outDir}/review.md (${body.length} bytes)`);

// Non-fatal: a reviewer failure should not sink the run; the workflow decides what
// to do with the verdict. Exit 0 even on error so the PR comment step still runs.
if (hadError)
  console.error("::warning::Hermes reviewer finished with an error result");
