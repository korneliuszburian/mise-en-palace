import { execFileSync, spawnSync } from "node:child_process";
import process from "node:process";

const ZERO_SHA = "0".repeat(40);

export const selectWhitespaceBase = ({
  eventName,
  beforeSha,
  prBaseSha,
  rootSha,
}) => {
  if (eventName === "pull_request" && prBaseSha) {
    return prBaseSha;
  }

  if (eventName === "push" && beforeSha && beforeSha !== ZERO_SHA) {
    return beforeSha;
  }

  return rootSha;
};

const git = (args) => execFileSync("git", args, { encoding: "utf8" }).trim();

const main = () => {
  const headSha = git(["rev-parse", "HEAD"]);
  const rootSha = git(["rev-list", "--max-parents=0", "HEAD"]).split(/\s+/u)[0];
  const baseSha = selectWhitespaceBase({
    eventName: process.env.KRN_WHITESPACE_EVENT ?? process.env.GITHUB_EVENT_NAME ?? "",
    beforeSha: process.env.KRN_WHITESPACE_BEFORE ?? "",
    prBaseSha: process.env.KRN_WHITESPACE_PR_BASE ?? "",
    rootSha,
  });

  if (process.argv.includes("--print-base")) {
    console.log(baseSha);
    return;
  }

  const result = spawnSync("git", ["diff", "--check", baseSha, headSha], {
    encoding: "utf8",
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
  console.log(`Committed whitespace check passed for ${baseSha}..${headSha}`);
};

if (process.argv[1] === new URL(import.meta.url).pathname) {
  main();
}
