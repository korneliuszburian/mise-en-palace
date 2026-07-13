import { execFileSync } from "node:child_process";

const ZERO_SHA = "0".repeat(40);

const git = (cwd, args) => execFileSync("git", args, { cwd, encoding: "utf8" }).trim();

const nonEmpty = (value) => typeof value === "string" && value.length > 0;

const fallbackCommitRef = ({ fallback, headSha, rootSha }) => {
  if (fallback === "root") return rootSha;
  if (fallback === "head-parent") return `${headSha}^`;

  throw new Error(`Unsupported committed range fallback: ${fallback}`);
};

const resolveCommit = (cwd, ref, label) => {
  try {
    return git(cwd, ["rev-parse", "--verify", `${ref}^{commit}`]);
  } catch {
    throw new Error(`Committed range ${label} is invalid: ${ref}`);
  }
};

// fallow-ignore-next-line complexity -- provider event rules are an explicit fail-closed boundary
const selectCommitBase = ({
  eventName,
  beforeSha,
  prBaseSha,
  fallbackRef,
  explicitBase,
  explicitBaseName,
}) => {
  if (nonEmpty(explicitBase)) return explicitBase;

  if (eventName === "pull_request") {
    if (nonEmpty(prBaseSha)) return prBaseSha;
    throw new Error(`pull_request requires KRN_COMMIT_PR_BASE or ${explicitBaseName}`);
  }

  if (eventName === "push") {
    if (beforeSha === ZERO_SHA) return fallbackRef;
    if (nonEmpty(beforeSha)) return beforeSha;
    throw new Error(`push requires KRN_COMMIT_BEFORE or ${explicitBaseName}`);
  }

  if (eventName === "" || eventName === "schedule" || eventName === "workflow_dispatch") {
    return fallbackRef;
  }

  throw new Error(`Unsupported committed range event: ${eventName}`);
};

export const resolveCommittedRange = ({
  cwd = process.cwd(),
  env = process.env,
  fallback = "root",
  explicitBase,
  explicitBaseName = "an explicit base",
} = {}) => {
  const headSha = git(cwd, ["rev-parse", "HEAD"]);
  const rootSha = git(cwd, ["rev-list", "--max-parents=0", "HEAD"]).split(/\s+/u)[0];
  const fallbackRef = fallbackCommitRef({ fallback, headSha, rootSha });
  const baseSha = selectCommitBase({
    eventName: env.KRN_COMMIT_EVENT ?? "",
    beforeSha: env.KRN_COMMIT_BEFORE ?? "",
    prBaseSha: env.KRN_COMMIT_PR_BASE ?? "",
    fallbackRef,
    explicitBase,
    explicitBaseName,
  });

  const verifiedBaseSha = resolveCommit(cwd, baseSha, "base");
  const changedFiles = git(cwd, [
    "diff",
    "--name-only",
    "--diff-filter=ACMRTUXB",
    verifiedBaseSha,
    headSha,
  ]).split(/\s+/u).filter(nonEmpty);

  return { baseSha: verifiedBaseSha, headSha, changedFiles };
};
