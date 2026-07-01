import type {
  EvidenceCommand,
  PatternUsefulnessOutcomeFeedback,
  SourceClaimEdgeKind,
  SourceUsefulnessOutcomeFeedback,
  TargetEvidenceInput
} from "@krn/core";
import type {
  BrainKnowledgeSearchFilter
} from "@krn/harness";
import {
  parseBrainArgs
} from "./parseBrainArgs.js";
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
  parseHeartbeatArgs
} from "./parseHeartbeatArgs.js";
import {
  parseInitArgs
} from "./parseInitArgs.js";
import {
  parseKnowledgeArgs
} from "./parseKnowledgeArgs.js";
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
  parseRunArgs
} from "./parseRunArgs.js";
import {
  parseSourceArgs
} from "./parseSourceArgs.js";

export type CliCommand =
  | {
      kind: "brainSearchHelp";
    }
  | {
      kind: "brainSearch";
      query: string;
      catalogFiles: readonly string[];
      storeOnly: boolean;
      limit?: number;
      maxInclusions?: number;
      format: "text" | "json";
    }
  | {
      kind: "init";
      mode: "dryRun";
      repo: string;
      ownerFiles?: readonly TargetOwnerFileInput[];
    }
  | {
      kind: "init";
      mode: "connect";
      repo: string;
      persist: boolean;
      ownerFiles?: readonly TargetOwnerFileInput[];
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
      kind: "dbHelp";
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
        | "brainLoop"
        | "heartbeatWorkerAuthority"
        | "codexAdapter"
        | "workerJobs"
        | "initConnect"
        | "targetRepoHarness";
    }
  | {
      kind: "evidenceCapture";
      persist: boolean;
      runId?: string;
      intendedFiles?: readonly string[];
      commandOutcomes?: readonly EvidenceCommand[];
      targetEvidence?: TargetEvidenceInput;
      sourceUsefulnessOutcomes?: readonly SourceUsefulnessOutcomeFeedback[];
      patternUsefulnessOutcomes?: readonly PatternUsefulnessOutcomeFeedback[];
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
      kind: "runShowHelp";
    }
  | {
      kind: "runShow";
      runId: string;
      format: "text" | "json";
    }
  | {
      kind: "knowledgeCardsHelp";
    }
  | {
      kind: "knowledgeCards";
      cardFiles: readonly string[];
      patternFiles: readonly string[];
      catalogFiles: readonly string[];
      filter: BrainKnowledgeSearchFilter;
      format: "text" | "json" | "html";
      limit?: number;
    }
  | {
      kind: "heartbeatPreviewHelp";
    }
  | {
      kind: "heartbeatPreview";
      projectId?: string;
      memoryLimit?: number;
      sourceClaimLimit?: number;
      nearExpiryDays?: number;
      maxCandidates?: number;
      evidenceRef?: string;
      acquisitionReadbackFile?: string;
      candidateKinds?: readonly [
        (
          | "memory_staleness"
          | "source_relation"
          | "knowledge_acquisition"
        ),
        ...(
          | "memory_staleness"
          | "source_relation"
          | "knowledge_acquisition"
        )[]
      ];
      candidateReview?: {
        candidateId: string;
        decision:
          | "accept_for_manual_followup"
          | "defer_pending_evidence"
          | "reject_not_actionable";
        reason: string;
        evidenceRef: string;
        reviewer?: string;
      };
      format: "text" | "json";
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
      kind: "memoryAntiPromoteHelp";
    }
  | {
      kind: "memoryAntiRejectHelp";
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
      untrustedSourceReviewRef?: string;
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
      proposedBy?: string;
      confidence?: string;
      key?: string;
      candidateEvidenceRefs: string[];
      candidateEvidenceProvenance?: string;
      candidateEvidenceDoesNotProve?: string;
      metadata: Record<string, string>;
    }
  | {
      kind: "memoryAntiPromote";
      persist: boolean;
      candidateId?: string;
      reviewer?: string;
      decision?: string;
      evidenceReviewedRef?: string;
      metadata: Record<string, string>;
    }
  | {
      kind: "memoryAntiReject";
      persist: boolean;
      candidateId?: string;
      reviewer?: string;
      reason?: string;
      metadata: Record<string, string>;
    }
  | {
      kind: "sourceClaimAddHelp";
    }
  | {
      kind: "sourceClaimEdgesHelp";
    }
  | {
      kind: "sourceSearchHelp";
    }
  | {
      kind: "sourceSearch";
      query?: string;
      limit?: number;
      maxInclusions?: number;
      json?: boolean;
    }
  | {
      kind: "sourceClaimEdges";
      sourceClaimId?: string;
    }
  | {
      kind: "sourceArtifactPreviewHelp";
    }
  | {
      kind: "sourceArtifactPreview";
      persist: boolean;
      file?: string;
      json?: boolean;
      chunkLines?: number;
      limitChunks?: number;
      extractCandidates?: boolean;
      reviewedExtractionClaimCandidateId?: string;
      claim?: string;
      mechanism?: string;
      krnImplication?: string;
      doesNotProve?: string;
      supportType?: string;
      trustTier?: string;
      consumer?: string;
      falsifier?: string;
      graphEdgeToSourceClaimId?: string;
      graphEdgeKind?: SourceClaimEdgeKind;
      graphEdgeConsumer?: string;
      graphEdgeDoesNotProve?: string;
      graphEdgeEvidenceRef?: string;
      graphEdgeSourceDecisionRef?: string;
      graphEdgeScope?: string;
      graphEdgeValidFrom?: string;
      graphEdgeValidUntil?: string;
      graphEdgeInvalidatedAt?: string;
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

export interface TargetOwnerFileInput {
  path: string;
  root: string;
  kind: string;
  reason: string;
}

const usage = [
  "Usage: krn init --dry-run --repo <path> [--owner-file \"path|root|kind|reason\"]",
  "Usage: krn init --connect --repo <path> --persist [--owner-file \"path|root|kind|reason\"]",
  "Usage: krn plan [--project <project-id>] --task \"...\" [--persist]",
  "",
  "Public operator commands:",
  "krn init --dry-run --repo <path> [--owner-file \"path|root|kind|reason\"]",
  "krn init --connect --repo <path> --persist [--owner-file \"path|root|kind|reason\"]",
  "krn doctor",
  "krn evidence capture [--run-id <id>|--run <id>] [--intended-file <path>] [--target-repo <path>] [--verification \"pnpm typecheck=passed\"] [--source-usefulness \"claim:<id>=helped|reason|evidence|doesNotProve\"] [--pattern-usefulness \"pattern:<id>=helped|reason|evidence|doesNotProve\"] [--persist]",
  "  example: krn evidence capture --intended-file packages/cli/src/runEvidenceCaptureCommand.ts --verification \"pnpm typecheck=passed\" --verification \"pnpm test=passed\"",
  "  source usefulness: krn evidence capture --source-usefulness \"claim:source-claim-1=helped|Source kept proof boundaries visible|evidence-1,feedback-1|Does not prove future selector quality\"",
  "  pattern usefulness: krn evidence capture --pattern-usefulness \"pattern:ts-boundary-unknown-first-result-state=helped|Pattern selected the unknown-first parser shape|evidence-1|Does not prove future pattern recall quality\"",
  "  target: krn evidence capture --target-repo ../target --target-mode observation-only --target-dirty-before dirty --target-dirty-after dirty --target-allowed-write none --target-forbidden-write \"target source edits\" --target-changed-file \"M src/app.ts\" --target-command \"target pnpm test\" --verification \"target pnpm test=passed\"",
  "  persisted: krn evidence capture --run-id <execution-run-id> --intended-file packages/cli/src/runEvidenceCaptureCommand.ts --verification \"git diff --check=passed\" --persist",
  "  note: evidence capture records outcomes; it does not execute commands",
  "krn observe --run <id>|--run-id <id> [--project <id>] [--persist]",
  "krn reflect --scope run:<id>|project:<id>|topic:<name> [--project <id>] [--persist]",
  "krn run show --run-id <id>",
  "krn brain search --query \"...\" [--catalog-file <path>|--store-only] [--json]",
  "krn brain knowledge [--card-file <path>|--pattern-file <path>|--catalog-file <path>] [--text <query>] [--json|--html]",
  "  legacy alias: krn knowledge cards ...",
  "krn heartbeat preview [--project <project-id>] [--memory-limit <n>] [--source-claim-limit <n>] [--max-candidates <n>] [--json]",
  "krn codex brief --run-id <id>",
  "",
  "Governed admin commands:",
  "krn source claim add --title \"...\" --claim \"...\" --mechanism \"...\" --does-not-prove \"...\" --falsifier \"...\" --support-type implementation-boundary --trust-tier project-decision --consumer \"...\" [--persist]",
  "krn source claim edges --source-claim-id <id>",
  "krn source search --query \"...\" [--limit <n>] [--max-inclusions <n>] [--json]",
  "krn source artifact preview --file <path> [--chunk-lines <n>] [--limit-chunks <n>]",
  "krn source claim reject --title \"...\" --rejected-because decorative [--attempted-claim \"...\"|--reason \"...\"] [--persist]",
  "krn source decision link --source-claim-id <id> --target-type harness_run --target-id <id> --support-type implementation-boundary --confidence medium --notes \"...\" [--persist]",
  "krn memory candidate add --run-id <id> --kind <kind> --content \"...\" --confidence <low|medium|high|0-100> --application-guidance \"...\" [--source-claim-id <id>|--source-lineage <id>] [--persist]",
  "krn memory candidate promote --candidate-id <id> --reviewer <name> --decision accepted --evidence-reviewed-ref <ref> [--untrusted-source-review-ref <ref>] [--persist]",
  "krn memory candidate reject --candidate-id <id> --reviewer <name> --reason \"...\" [--persist]",
  "krn memory record apply --run-id <id> --memory-id <id> --outcome helped --notes \"...\" [--persist]",
  "krn memory anti add --run-id <id> --rejected-claim \"...\" --reason \"...\" --invalidated-by-source-claim-id <id> [--persist]",
  "krn memory anti promote --candidate-id <id> --reviewer <name> --decision accepted --evidence-reviewed-ref <ref> [--persist]",
  "krn memory anti reject --candidate-id <id> --reviewer <name> --reason \"...\" [--persist]",
  "krn review assess --evidence-bundle-id <id> --reviewer <name> --summary \"...\" [--status accepted|changes_requested|rejected|pending] [--persist]",
  "",
  "Internal/dev commands:",
  "krn db --help",
  "krn db readiness",
  "krn db smoke [harness-plan|harness-evidence|source-graph|memory-governance|retrieval-substrate|activation|brain-loop|heartbeat-worker-authority|codex-adapter|worker-jobs|init-connect|target-repo-harness]",
  "  note: DB readiness/smoke commands prove local runtime plumbing only; they are not product workflow or quality authority"
].join("\n");

export const formatUsage = (): string => `${usage}\n`;

type TopLevelCommandParser = (rest: readonly string[]) => ParseArgsResult;

const topLevelCommandParsers: Record<string, TopLevelCommandParser> = {
  brain: (rest) =>
    rest[0] === "knowledge"
      ? parseKnowledgeArgs(["cards", ...rest.slice(1)])
      : parseBrainArgs(rest),
  doctor: parseDoctorArgs,
  init: parseInitArgs,
  db: parseDbArgs,
  evidence: parseEvidenceArgs,
  review: parseReviewArgs,
  run: parseRunArgs,
  knowledge: parseKnowledgeArgs,
  heartbeat: parseHeartbeatArgs,
  observe: parseObserveArgs,
  reflect: parseReflectArgs,
  codex: parseCodexArgs,
  source: parseSourceArgs,
  memory: parseMemoryArgs,
  plan: (rest) => parsePlanArgs(rest, usage)
};

export const parseArgs = (args: readonly string[]): ParseArgsResult => {
  const [command, ...rest] = args;

  if (command === undefined || command === "--help" || command === "-h") {
    return {
      command: {
        kind: "help"
      }
    };
  }

  const parser = topLevelCommandParsers[command];

  if (parser === undefined) {
    return {
      error: `Unsupported command: ${command}\n${usage}`
    };
  }

  return parser(rest);
};
