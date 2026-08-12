import type {
  CliCommand,
  ParseArgsResult
} from "./parse-args.js";
import {
  parseDatabaseOptions
} from "./parse-database-options.js";

const dbUsage = [
  "Usage: krn db migrate|readiness|smoke",
  "[harness-plan|harness-evidence|source-graph|memory-governance|eval-feedback-persistence|retrieval-substrate|activation|memory-loop|memory-search|run-show|maintenance-boundary|codex-adapter|maintenance-queue|init-connect|target-repo-harness|decision-corpus-import|real-recall-advantage|decision-packet-return-loop]",
  "",
  "Internal/dev commands:",
  "krn db migrate [--backend sqlite|postgres] [--db-path <path>]",
  "krn db readiness [--backend sqlite|postgres] [--db-path <path>]",
  "krn db smoke [target]",
  "",
  "Boundary: DB readiness and smoke commands prove local runtime plumbing only.",
  "They are not public operator workflow, product quality authority, or Memory Core readiness proof."
].join("\n");

export const formatDbUsage = (): string => `${dbUsage}\n`;

type DbSmokeTarget = Extract<CliCommand, { kind: "dbSmoke" }>["target"];

const dbSmokeTargets = new Map<string, DbSmokeTarget>([
  ["harness-plan", "harnessPlan"],
  ["harness-evidence", "harnessEvidence"],
  ["source-graph", "sourceGraph"],
  ["memory-governance", "memoryGovernance"],
  ["eval-feedback-persistence", "evalFeedbackPersistence"],
  ["retrieval-substrate", "retrievalSubstrate"],
  ["activation", "activation"],
  ["memory-loop", "brainLoop"],
  ["memory-search", "brainSearch"],
  ["run-show", "runShow"],
  ["maintenance-boundary", "maintenanceBoundary"],
  ["codex-adapter", "codexAdapter"],
  ["maintenance-queue", "maintenanceQueue"],
  ["init-connect", "initConnect"],
  ["target-repo-harness", "targetRepoHarness"],
  ["decision-corpus-import", "decisionCorpusImport"],
  ["real-recall-advantage", "realRecallAdvantage"],
  ["decision-packet-return-loop", "decisionPacketReturnLoop"]
]);

// fallow-ignore-next-line complexity -- the argv boundary exhaustively preserves help, migrate/readiness options, option-free smoke shapes, and typed smoke targets
export const parseDbArgs = (rest: readonly string[]): ParseArgsResult => {
  if (rest.length === 1 && (rest[0] === "--help" || rest[0] === "-h")) {
    return {
      command: {
        kind: "dbHelp"
      }
    };
  }

  const parsed = parseDatabaseOptions(rest);
  if (parsed.kind === "error") {
    return { error: formatDbUsage() };
  }
  const positional = parsed.positional;
  const hasDatabaseOptions = parsed.options.backend !== undefined || parsed.options.dbPath !== undefined;

  if (positional.length === 1 && positional[0] === "readiness") {
    return {
      command: {
        kind: "dbReadiness",
        ...parsed.options
      }
    };
  }

  if (positional.length === 1 && positional[0] === "migrate") {
    return {
      command: {
        kind: "dbMigrate",
        ...parsed.options
      }
    };
  }

  if (positional.length === 1 && positional[0] === "smoke" && !hasDatabaseOptions) {
    return {
      command: {
        kind: "dbSmoke",
        target: "project"
      }
    };
  }

  if (positional.length === 2 && positional[0] === "smoke" && !hasDatabaseOptions) {
    const requestedTarget = positional[1];
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
