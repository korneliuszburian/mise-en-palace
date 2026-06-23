import type {
  EvidenceCommand
} from "@krn/core";
import {
  parseCodexArgs
} from "./parseCodexArgs.js";
import {
  parseDbArgs
} from "./parseDbArgs.js";
import {
  parseDoctorArgs
} from "./parseDoctorArgs.js";
import {
  parseEvidenceArgs
} from "./parseEvidenceArgs.js";
import {
  parseInitArgs
} from "./parseInitArgs.js";
import {
  parseMemoryArgs
} from "./parseMemoryArgs.js";
import {
  parseObserveArgs
} from "./parseObserveArgs.js";
import {
  parsePlanArgs
} from "./parsePlanArgs.js";
import {
  parseReflectArgs
} from "./parseReflectArgs.js";
import {
  parseReviewArgs
} from "./parseReviewArgs.js";
import {
  parseSourceArgs
} from "./parseSourceArgs.js";

export type CliCommand =
  | {
      kind: "init";
      mode: "dryRun";
      repo: string;
    }
  | {
      kind: "init";
      mode: "connect";
      repo: string;
      persist: boolean;
    }
  | {
      kind: "plan";
      task: string;
      persist: boolean;
      projectId?: string;
    }
  | {
      kind: "doctor";
    }
  | {
      kind: "dbReadiness";
    }
  | {
      kind: "dbSmoke";
      target:
        | "project"
        | "harnessPlan"
        | "harnessEvidence"
        | "sourceGraph"
        | "memoryGovernance"
        | "retrievalSubstrate"
        | "activation"
        | "codexAdapter"
        | "workerJobs"
        | "initConnect"
        | "targetRepoHarness";
    }
  | {
      kind: "evidenceCapture";
      persist: boolean;
      runId?: string;
      commandOutcomes?: readonly EvidenceCommand[];
    }
  | {
      kind: "reviewAssess";
      persist: boolean;
      evidenceBundleId?: string;
      reviewer?: string;
      status?: string;
      summary?: string;
      findings: string[];
      outcome?: string;
      reviewBurden?: string;
      diffRisk?: string;
      correctionLabels: string[];
      metadata: Record<string, string>;
    }
  | {
      kind: "observeRun";
      runId: string;
      projectId?: string;
      persist: boolean;
    }
  | {
      kind: "reflect";
      scope:
        | {
            kind: "run";
            id: string;
          }
        | {
            kind: "project";
            id: string;
          }
        | {
            kind: "topic";
            name: string;
            projectId: string;
          };
      persist: boolean;
    }
  | {
      kind: "codexBrief";
      runId: string;
    }
  | {
      kind: "memoryCandidateAddHelp";
    }
  | {
      kind: "memoryCandidatePromoteHelp";
    }
  | {
      kind: "memoryCandidateRejectHelp";
    }
  | {
      kind: "memoryRecordApplyHelp";
    }
  | {
      kind: "memoryAntiAddHelp";
    }
  | {
      kind: "memoryCandidateAdd";
      persist: boolean;
      runId?: string;
      feedbackDeltaId?: string;
      memoryKind?: string;
      content?: string;
      confidence?: string;
      applicationGuidance?: string;
      sourceClaimId?: string;
      sourceLineageIds: string[];
      candidateEvidenceRefs: string[];
      candidateEvidenceProvenance?: string;
      candidateEvidenceDoesNotProve?: string;
      invalidationRule?: string;
      owner?: string;
      proposedBy?: string;
      metadata: Record<string, string>;
    }
  | {
      kind: "memoryCandidatePromote";
      persist: boolean;
      candidateId?: string;
      reviewer?: string;
      decision?: string;
      evidenceReviewedRef?: string;
      metadata: Record<string, string>;
    }
  | {
      kind: "memoryCandidateReject";
      persist: boolean;
      candidateId?: string;
      reviewer?: string;
      reason?: string;
      metadata: Record<string, string>;
    }
  | {
      kind: "memoryRecordApply";
      persist: boolean;
      runId?: string;
      memoryId?: string;
      outcome?: string;
      notes?: string;
      expectedUse?: string;
      taskContractId?: string;
      contextAssemblyId?: string;
      metadata: Record<string, string>;
    }
  | {
      kind: "memoryAntiAdd";
      persist: boolean;
      runId?: string;
      rejectedClaim?: string;
      reason?: string;
      invalidatedBySourceClaimId?: string;
      sourceLineageIds: string[];
      appliesTo?: string;
      mayRevisitWhen?: string;
      owner?: string;
      confidence?: string;
      key?: string;
      metadata: Record<string, string>;
    }
  | {
      kind: "sourceClaimAddHelp";
    }
  | {
      kind: "sourceClaimAdd";
      persist: boolean;
      title?: string;
      claim?: string;
      mechanism?: string;
      doesNotProve?: string;
      supportType?: string;
      trustTier?: string;
      consumer?: string;
      uri?: string;
      type?: string;
      runId?: string;
      falsifier?: string;
      revisitWhen?: string;
      krnImplication?: string;
      metadata: Record<string, string>;
    }
  | {
      kind: "sourceDecisionLinkHelp";
    }
  | {
      kind: "sourceDecisionLink";
      persist: boolean;
      sourceClaimId?: string;
      targetType?: string;
      targetId?: string;
      supportType?: string;
      confidence?: string;
      notes?: string;
      metadata: Record<string, string>;
    }
  | {
      kind: "sourceClaimRejectHelp";
    }
  | {
      kind: "sourceClaimReject";
      persist: boolean;
      title?: string;
      attemptedClaim?: string;
      rejectedBecause?: string;
      reason?: string;
      doesNotProve?: string;
      consumer?: string;
      runId?: string;
      sourceArtifactId?: string;
      sourceClaimId?: string;
      metadata: Record<string, string>;
    }
  | {
      kind: "help";
    };

export interface ParseArgsResult {
  command?: CliCommand;
  error?: string;
}

const usage = [
  "Usage: krn init --dry-run --repo <path>",
  "Usage: krn init --connect --repo <path> --persist",
  "Usage: krn plan [--project <project-id>] --task \"...\" [--persist]",
  "",
  "Other commands:",
  "krn init --dry-run --repo <path>",
  "krn init --connect --repo <path> --persist",
  "krn doctor",
  "krn db readiness",
  "krn db smoke [harness-plan|harness-evidence|source-graph|memory-governance|retrieval-substrate|activation|codex-adapter|worker-jobs|init-connect|target-repo-harness]",
  "krn source claim add --title \"...\" --claim \"...\" --mechanism \"...\" --does-not-prove \"...\" --falsifier \"...\" --support-type implementation-boundary --trust-tier project-decision --consumer \"...\" [--persist]",
  "krn source claim reject --title \"...\" --rejected-because decorative [--attempted-claim \"...\"|--reason \"...\"] [--persist]",
  "krn source decision link --source-claim-id <id> --target-type harness_run --target-id <id> --support-type implementation-boundary --confidence medium --notes \"...\" [--persist]",
  "krn memory candidate add --run-id <id> --kind <kind> --content \"...\" --confidence <low|medium|high|0-100> --application-guidance \"...\" [--source-claim-id <id>|--source-lineage <id>] [--persist]",
  "krn memory candidate promote --candidate-id <id> --reviewer <name> --decision accepted --evidence-reviewed-ref <ref> [--persist]",
  "krn memory candidate reject --candidate-id <id> --reviewer <name> --reason \"...\" [--persist]",
  "krn memory record apply --run-id <id> --memory-id <id> --outcome helped --notes \"...\" [--persist]",
  "krn memory anti add --run-id <id> --rejected-claim \"...\" --reason \"...\" --invalidated-by-source-claim-id <id> [--persist]",
  "krn evidence capture [--run-id <id>] [--verification \"pnpm typecheck=passed\"] [--persist]",
  "  example: krn evidence capture --verification \"pnpm typecheck=passed\" --verification \"pnpm test=passed\"",
  "  persisted: krn evidence capture --run-id <execution-run-id> --verification \"git diff --check=passed\" --persist",
  "  note: evidence capture records outcomes; it does not execute commands",
  "krn review assess --evidence-bundle-id <id> --reviewer <name> --summary \"...\" [--status accepted|changes_requested|rejected|pending] [--persist]",
  "krn observe --run <id> [--project <id>] [--persist]",
  "krn reflect --scope run:<id>|project:<id>|topic:<name> [--project <id>] [--persist]",
  "krn codex brief --run-id <id>"
].join("\n");

export const formatUsage = (): string => `${usage}\n`;

export const parseArgs = (args: readonly string[]): ParseArgsResult => {
  const [command, ...rest] = args;

  if (command === undefined || command === "--help" || command === "-h") {
    return {
      command: {
        kind: "help"
      }
    };
  }

  if (command === "doctor") {
    return parseDoctorArgs(rest);
  }

  if (command === "init") {
    return parseInitArgs(rest);
  }

  if (command === "db") {
    return parseDbArgs(rest);
  }

  if (command === "evidence") {
    return parseEvidenceArgs(rest);
  }

  if (command === "review") {
    return parseReviewArgs(rest);
  }

  if (command === "observe") {
    return parseObserveArgs(rest);
  }

  if (command === "reflect") {
    return parseReflectArgs(rest);
  }

  if (command === "codex") {
    return parseCodexArgs(rest);
  }

  if (command === "source") {
    return parseSourceArgs(rest);
  }

  if (command === "memory") {
    return parseMemoryArgs(rest);
  }

  if (command !== "plan") {
    return {
      error: `Unsupported command: ${command}\n${usage}`
    };
  }

  return parsePlanArgs(rest, usage);
};
