import { execFileSync } from "node:child_process";

const ZERO_SHA = "0".repeat(40);

const git = (cwd, args) => execFileSync("git", args, { cwd, encoding: "utf8" }).trim();

const nonEmpty = (value) => typeof value === "string" && value.length > 0;

// fallow-ignore-next-line complexity -- provider event rules are an explicit fail-closed boundary
const selectCommitBase = ({ eventName, beforeSha, prBaseSha, rootSha }) =>
  eventName === "pull_request"
    ? prBaseSha || rootSha
    : eventName === "push" && nonEmpty(beforeSha) && beforeSha !== ZERO_SHA
      ? beforeSha
      : rootSha;

export const resolveCommittedRange = ({ cwd = process.cwd(), env = process.env } = {}) => {
  const headSha = git(cwd, ["rev-parse", "HEAD"]);
  const rootSha = git(cwd, ["rev-list", "--max-parents=0", "HEAD"]).split(/\s+/u)[0];
  const baseSha = selectCommitBase({
    eventName: env.KRN_COMMIT_EVENT ?? "",
    beforeSha: env.KRN_COMMIT_BEFORE ?? "",
    prBaseSha: env.KRN_COMMIT_PR_BASE ?? "",
    rootSha,
  });

  git(cwd, ["rev-parse", "--verify", `${baseSha}^{commit}`]);
  const changedFiles = git(cwd, [
    "diff",
    "--name-only",
    "--diff-filter=ACMRTUXB",
    baseSha,
    headSha,
  ]).split(/\s+/u).filter(nonEmpty);

  return { baseSha, headSha, changedFiles };
};
