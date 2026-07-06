import type {
  CliCommand,
  ParseArgsResult
} from "./parseArgs.js";

const dbUsage = [
  "Usage: krn db readiness|smoke",
  "[harness-plan|harness-evidence|source-graph|memory-governance|retrieval-substrate|activation|brain-loop|brain-search|run-show|heartbeat-worker-boundary|codex-adapter|worker-jobs|init-connect|target-repo-harness|decision-corpus-import|real-recall-advantage]",
  "",
  "Internal/dev commands:",
  "krn db readiness",
  "krn db smoke [target]",
  "",
  "Boundary: DB readiness and smoke commands prove local runtime plumbing only.",
  "They are not public operator workflow, product quality authority, or Memory Brain readiness proof."
].join("\n");

export const formatDbUsage = (): string => `${dbUsage}\n`;

type DbSmokeTarget = Extract<CliCommand, { kind: "dbSmoke" }>["target"];

const dbSmokeTargets = new Map<string, DbSmokeTarget>([
  ["harness-plan", "harnessPlan"],
  ["harness-evidence", "harnessEvidence"],
  ["source-graph", "sourceGraph"],
  ["memory-governance", "memoryGovernance"],
  ["retrieval-substrate", "retrievalSubstrate"],
  ["activation", "activation"],
  ["brain-loop", "brainLoop"],
  ["brain-search", "brainSearch"],
  ["run-show", "runShow"],
  ["heartbeat-worker-boundary", "heartbeatWorkerBoundary"],
  ["codex-adapter", "codexAdapter"],
  ["worker-jobs", "workerJobs"],
  ["init-connect", "initConnect"],
  ["target-repo-harness", "targetRepoHarness"],
  ["decision-corpus-import", "decisionCorpusImport"],
  ["real-recall-advantage", "realRecallAdvantage"]
]);

export const parseDbArgs = (rest: readonly string[]): ParseArgsResult => {
  if (rest.length === 1 && (rest[0] === "--help" || rest[0] === "-h")) {
    return {
      command: {
        kind: "dbHelp"
      }
    };
  }

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
    const requestedTarget = rest[1];
    const target = requestedTarget === undefined
      ? undefined
      : dbSmokeTargets.get(requestedTarget);

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
    error: formatDbUsage()
  };
};
