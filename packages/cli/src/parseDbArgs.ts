import type {
  ParseArgsResult
} from "./parseArgs.js";

const dbUsage = [
  "Usage: krn db readiness|smoke",
  "[harness-plan|harness-evidence|source-graph|memory-governance|retrieval-substrate|activation|codex-adapter|worker-jobs|init-connect|target-repo-harness]"
].join(" ");

const dbSmokeTargets = {
  "harness-plan": "harnessPlan",
  "harness-evidence": "harnessEvidence",
  "source-graph": "sourceGraph",
  "memory-governance": "memoryGovernance",
  "retrieval-substrate": "retrievalSubstrate",
  activation: "activation",
  "codex-adapter": "codexAdapter",
  "worker-jobs": "workerJobs",
  "init-connect": "initConnect",
  "target-repo-harness": "targetRepoHarness"
} as const;

export const parseDbArgs = (rest: readonly string[]): ParseArgsResult => {
  if (rest.length === 1 && rest[0] === "readiness") {
    return {
      command: {
        kind: "dbReadiness"
      }
    };
  }

  if (rest.length === 1 && rest[0] === "smoke") {
    return {
      command: {
        kind: "dbSmoke",
        target: "project"
      }
    };
  }

  if (rest.length === 2 && rest[0] === "smoke") {
    const target = dbSmokeTargets[rest[1] as keyof typeof dbSmokeTargets];

    if (target !== undefined) {
      return {
        command: {
          kind: "dbSmoke",
          target
        }
      };
    }
  }

  return {
    error: dbUsage
  };
};
