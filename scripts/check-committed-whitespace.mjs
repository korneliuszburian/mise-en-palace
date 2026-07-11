import { spawnSync } from "node:child_process";
import process from "node:process";
import { forwardProcessResult } from "./forward-process-result.mjs";
import { resolveCommittedRange } from "./resolve-committed-range.mjs";

const runWhitespaceCheck = (range) => {
  const result = spawnSync("git", ["diff", "--check", range.baseSha, range.headSha], {
    encoding: "utf8",
  });
  const status = forwardProcessResult(result);
  if (status !== 0) process.exit(status);
  console.log(`Committed whitespace check passed for ${range.baseSha}..${range.headSha}`);
};

// fallow-ignore-next-line complexity -- CLI boundary preserves provider env fallback and git diagnostics
const main = () => {
  const range = resolveCommittedRange({
    env: {
      KRN_COMMIT_EVENT: process.env.KRN_WHITESPACE_EVENT ?? process.env.GITHUB_EVENT_NAME ?? "",
      KRN_COMMIT_BEFORE: process.env.KRN_WHITESPACE_BEFORE ?? "",
      KRN_COMMIT_PR_BASE: process.env.KRN_WHITESPACE_PR_BASE ?? "",
    },
  });

  if (process.argv.includes("--print-base")) {
    console.log(range.baseSha);
    return;
  }

  runWhitespaceCheck(range);
};

if (process.argv[1] === new URL(import.meta.url).pathname) {
  main();
}
