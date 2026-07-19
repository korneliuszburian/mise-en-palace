import type {
  KnowledgeUsefulnessOutcomeFeedback,
  SourceClaimEdgeKind,
  SourceUsefulnessOutcomeFeedback,
  TargetEvidenceInput
} from "@krn/core";
import type {
  EvidenceCommandCaptureInput
} from "./evidence-command-artifacts.js";
import type {
  KnowledgeSearchFilter
} from "@krn/harness";
import {
  parseCodexArgs
} from "./parse-codex-args.js";
import {
  parseDecisionArgs
} from "./parse-decision-args.js";
import {
  parseDbArgs
} from "./parse-db-args.js";
import {
  parseDoctorArgs
} from "./parse-doctor-args.js";
import {
  parseEvidenceArgs
} from "./parse-evidence-args.js";
import {
  parseMaintenanceArgs
} from "./parse-maintenance-args.js";
import {
  parseInitArgs
} from "./parse-init-args.js";
import {
  parseMemoryArgs
} from "./parse-memory-args.js";
import {
  parseObserveArgs
} from "./parse-observe-args.js";
import {
  parsePlanArgs
} from "./parse-plan-args.js";
import {
  parseReflectArgs
} from "./parse-reflect-args.js";
import {
  parseReviewArgs
} from "./parse-review-args.js";
import {
  parseSourceArgs
} from "./parse-source-args.js";
import {
  parseRegisteredTopLevelCommand
} from "./cli-command-registry.js";

export type CliCommand =
  | {
      kind: "brainSearchHelp";
    }
  | {
      kind: "brainSearch";
      query: string;
      catalogFiles: readonly string[];
      storeOnly: boolean;
      projectId?: string;
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
      kind: "planHelp";
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
      kind: "dbMigrate";
    }
  | {
      kind: "dbSmoke";
      target:
        | "project"
        | "harnessPlan"
        | "harnessEvidence"
        | "sourceGraph"
        | "memoryGovernance"
        | "evalFeedbackPersistence"
        | "retrievalSubstrate"
        | "activation"
        | "brainLoop"
        | "brainSearch"
        | "runShow"
        | "maintenanceBoundary"
        | "codexAdapter"
        | "maintenanceQueue"
        | "initConnect"
        | "targetRepoHarness"
        | "decisionCorpusImport"
        | "realRecallAdvantage"
        | "decisionPacketReturnLoop";
    }
  | {
      kind: "evidenceCapture";
      persist: boolean;
      runId?: string;
      decisionPacketChecksum?: string;
      decisionPacketGeneratedAt?: string;
      intendedFiles?: readonly string[];
      commandOutcomes?: readonly EvidenceCommandCaptureInput[];
      targetEvidence?: TargetEvidenceInput;
      sourceUsefulnessOutcomes?: readonly SourceUsefulnessOutcomeFeedback[];
      knowledgeUsefulnessOutcomes?: readonly KnowledgeUsefulnessOutcomeFeedback[];
    }
  | {
      kind: "evidenceCaptureHelp";
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
      kind: "reviewAssessHelp";
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
      kind: "runEvalEvidence";
      projectId: string;
      runId?: string;
      scenario?: string;
      outcome?: "win" | "tie" | "loss" | "invalid" | "unknown";
      usefulnessOutcome?: "helped" | "neutral" | "hurt" | "unknown";
      limit?: number;
      format: "text" | "json";
    }
  | {
      kind: "decisionPacketHelp";
    }
  | {
      kind: "decisionPacket";
      runId: string;
    }
  | {
      kind: "brainRecallHelp";
    }
  | {
      kind: "memoryHelp";
    }
  | {
      kind: "brainRecall";
      readModelFiles: readonly string[];
      decisionFiles: readonly string[];
      catalogFiles: readonly string[];
      storeOnly: boolean;
      projectId?: string;
      filter: KnowledgeSearchFilter;
      format: "text" | "json" | "html";
      limit?: number;
    }
  | {
      kind: "maintenanceHelp";
    }
  | {
      kind: "maintenancePreview";
      projectId?: string;
      memoryLimit?: number;
      sourceClaimLimit?: number;
      nearExpiryDays?: number;
      maxCandidates?: number;
      evidenceRef?: string;
      acquisitionReadbackFile?: string;
      consensusCandidateFile?: string;
      candidateKinds?: readonly [
        (
          | "memory_staleness"
          | "source_relation"
          | "knowledge_acquisition"
          | "consensus_evaluation"
        ),
        ...(
          | "memory_staleness"
          | "source_relation"
          | "knowledge_acquisition"
          | "consensus_evaluation"
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
      kind: "maintenanceRun";
      id: string;
    }
  | {
      kind: "maintenanceRecover";
      id: string;
      lockedBefore: string;
    }
  | {
      kind: "observeRun";
      runId: string;
      projectId?: string;
      persist: boolean;
    }
  | {
      kind: "observeRunHelp";
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
      kind: "reflectHelp";
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
      kind: "memoryKnowledgeSeedHelp";
    }
  | {
      kind: "memoryKnowledgeProposeHelp";
    }
  | {
      kind: "memoryReviewedHelpedProposeHelp";
    }
  | {
      kind: "memoryAntiAddHelp";
    }
  | {
      kind: "memoryAntiProposeHelp";
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
      sourceMemoryRecordId?: string;
      reason?: string;
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
      decisionPacketChecksum?: string;
      decisionPacketGeneratedAt?: string;
      evidenceBundleId?: string;
      outcome?: string;
      notes?: string;
      expectedUse?: string;
      taskContractId?: string;
      contextAssemblyId?: string;
      metadata: Record<string, string>;
    }
  | {
      kind: "memoryKnowledgeSeed";
      persist: boolean;
      dryRun: boolean;
      catalogFile: string;
    }
  | {
      kind: "memoryKnowledgePropose";
      persist: boolean;
      projectId?: string;
      limit?: number;
    }
  | {
      kind: "memoryReviewedHelpedPropose";
      persist: boolean;
      projectId?: string;
      feedbackDeltaId?: string;
      reviewAssessmentId?: string;
      sourceDecisionId?: string;
    }
  | {
      kind: "memoryAntiAdd";
      persist: boolean;
      projectId?: string;
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
      kind: "memoryAntiPropose";
      persist: boolean;
      projectId?: string;
      limit?: number;
    }
  | {
      kind: "memoryAntiPromote";
      persist: boolean;
      projectId?: string;
      candidateId?: string;
      reviewer?: string;
      decision?: string;
      evidenceReviewedRef?: string;
      metadata: Record<string, string>;
    }
  | {
      kind: "memoryAntiReject";
      persist: boolean;
      projectId?: string;
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
      projectId?: string;
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
      sourceAuthority?: string;
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
      sourceAuthority?: string;
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
      kind: "sourceDecisionAdoptHelp";
    }
  | {
      kind: "sourceDecisionGapsHelp";
    }
  | {
      kind: "sourceDecisionReconcileHelp";
    }
  | {
      kind: "sourceQuarantineListHelp";
    }
  | {
      kind: "sourceDecisionImportHelp";
    }
  | {
      kind: "sourceDecisionLink";
      persist: boolean;
      sourceClaimId?: string;
      sourceDecisionId?: string;
      targetType?: string;
      targetId?: string;
      supportType?: string;
      confidence?: string;
      notes?: string;
      metadata: Record<string, string>;
    }
  | {
      kind: "sourceDecisionAdopt";
      persist: boolean;
      sourceClaimId?: string;
      decision?: string;
      rationale?: string;
      falsifier?: string;
      consumer?: string;
      metadata: Record<string, string>;
      // When link is true (with --persist), also create a SourceDecisionEdge in
      // the same command so a governing decision can be adopted + linked at once.
      link?: boolean;
      linkTargetType?: string;
      linkTargetId?: string;
      linkSupportType?: string;
      linkConfidence?: string;
      linkNotes?: string;
    }
  | {
      kind: "sourceDecisionGaps";
      projectId?: string;
      limit?: number;
      json?: boolean;
    }
  | {
      kind: "sourceDecisionReconcile";
      projectId?: string;
      limit?: number;
      afterImportId?: string;
      json?: boolean;
    }
  | {
      kind: "sourceQuarantineList";
      projectId?: string;
      limit?: number;
      afterId?: string;
      json?: boolean;
    }
  | {
      kind: "sourceDecisionImport";
      persist: boolean;
      file?: string;
      projectId?: string;
      json?: boolean;
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
  "krn evidence capture [--run-id <id>|--run <id>] [--intended-file <path>] [--target-repo <path>] [--verification \"pnpm typecheck=passed\"] [--source-usefulness \"claim:<id>=helped|reason|evidence|doesNotProve[|application-id[|applied-at]]\"] [--memory-usefulness \"<knowledge-id>=helped|reason|evidence|doesNotProve[|application-id[|applied-at]]\"] [--persist]",
  "  example: krn evidence capture --intended-file packages/cli/src/run-evidence-capture-command.ts --verification \"pnpm typecheck=passed\" --verification \"pnpm test=passed\"",
  "  source usefulness: krn evidence capture --source-usefulness \"claim:source-claim-1=helped|Source kept proof boundaries visible|evidence-1,feedback-1|Does not prove future selector quality\"",
  "  memory usefulness: krn evidence capture --memory-usefulness \"knowledge:ts-boundary-unknown-first-result-state=helped|Memory selected the unknown-first parser shape|evidence-1|Does not prove future memory recall quality\"",
  "  application phase 1: pass application-id alone; persisted output returns application-id|applied-at",
  "  application phase 2: run verification, then pass the returned application-id|applied-at pair",
  "  target: krn evidence capture --target-repo ../target --target-mode observation-only --target-dirty-before dirty --target-dirty-after dirty --target-allowed-write none --target-forbidden-write \"target source edits\" --target-changed-file \"M src/app.ts\" --target-command \"target pnpm test\" --verification \"target pnpm test=passed\"",
  "  persisted: krn evidence capture --run-id <execution-run-id> --intended-file packages/cli/src/run-evidence-capture-command.ts --verification \"git diff --check=passed\" --persist",
  "  note: evidence capture records outcomes; it does not execute commands",
  "krn observe --run <id>|--run-id <id> [--project <id>] [--persist]",
  "krn reflect --scope run:<id>|project:<id>|topic:<name> [--project <id>] [--persist]",
  "krn run show --run-id <id>",
  "krn run eval-evidence --project-id <project-id> [--run-id <id>] [--json]",
  "krn decision packet --run-id <id> [--json]",
  "krn memory search --query \"...\" [--project <project-id>] [--json]",
  "krn memory recall [--fixture-read-model-file <path>|--fixture-decision-file <path>|--fixture-catalog-file <path>] [--text <query>] [--json|--html]",
  "krn memory seed --file <catalog.json> [--persist] [--dry-run]",
  "krn memory propose [--project <project-id>] [--limit <n>] [--persist]",
  "krn maintenance preview [--project <project-id>] [--memory-limit <n>] [--source-claim-limit <n>] [--max-candidates <n>] [--json]",
  "krn maintenance run --id <maintenance-queue-id>",
  "krn codex brief --run-id <id>",
  "",
  "Governed admin commands:",
  "krn source claim add --title \"...\" --claim \"...\" --mechanism \"...\" --does-not-prove \"...\" --falsifier \"...\" --support-type implementation-boundary --source-authority project-decision --consumer \"...\" [--persist]",
  "krn source claim edges --source-claim-id <id>",
  "krn source search --query \"...\" [--project <project-id>] [--limit <n>] [--max-inclusions <n>] [--json]",
  "krn source artifact preview --file <path> [--chunk-lines <n>] [--limit-chunks <n>]",
  "krn source claim reject --title \"...\" --rejected-because decorative [--attempted-claim \"...\"|--reason \"...\"] [--persist]",
  "krn source decision adopt --source-claim-id <id> --decision \"...\" --rationale \"...\" --falsifier \"...\" --consumer \"...\" [--persist]",
  "krn source decision link --source-claim-id <id> --target-type harness_run --target-id <id> --support-type implementation-boundary --confidence medium --notes \"...\" [--persist]",
  "krn source decision reconcile --project <project-id> [--limit <n>] [--after <import-id>] [--json]",
  "krn source decision import --file source-decisions.json [--project <project-id>] [--persist] [--json]",
  "krn memory candidate add --run-id <id> --kind <kind> --content \"...\" --confidence <low|medium|high|0-100> --application-guidance \"...\" [--source-claim-id <id>|--source-lineage <id>] [--persist]",
  "krn memory candidate promote --candidate-id <id> --reviewer <name> --decision accepted --evidence-reviewed-ref <ref> [--untrusted-source-review-ref <ref>] [--persist]",
  "  revision: add --source-memory-id <id> --reason \"...\" to atomically supersede one active predecessor",
  "krn memory candidate reject --candidate-id <id> --reviewer <name> --reason \"...\" [--persist]",
  "krn memory record apply --run-id <id> --memory-id <id> --outcome helped --notes \"...\" [--persist]",
  "krn memory anti add --run-id <id> --rejected-claim \"...\" --reason \"...\" --invalidated-by-source-claim-id <id> [--persist]",
  "krn memory anti propose [--project <project-id>] [--limit <n>] [--persist]",
  "krn memory anti promote --candidate-id <id> --reviewer <name> --decision accepted --evidence-reviewed-ref <ref> [--persist]",
  "krn memory anti reject --candidate-id <id> --reviewer <name> --reason \"...\" [--persist]",
  "krn review assess --evidence-bundle-id <id> --reviewer <name> --summary \"...\" [--status accepted|changes_requested|rejected|pending] [--persist]",
  "",
  "Internal/dev commands:",
  "krn db --help",
  "krn db migrate",
  "krn db readiness",
  "krn db smoke [harness-plan|harness-evidence|source-graph|memory-governance|retrieval-substrate|activation|memory-loop|memory-search|run-show|maintenance-boundary|codex-adapter|maintenance-queue|init-connect|target-repo-harness|decision-corpus-import|real-recall-advantage|decision-packet-return-loop]",
  "  note: DB readiness/smoke commands prove local runtime plumbing only; they are not product workflow or quality authority"
].join("\n");

export const formatUsage = (): string => `${usage}\n`;

type TopLevelCommandParser = (rest: readonly string[]) => ParseArgsResult;

const isEvidenceHelpRequest = (rest: readonly string[]): boolean =>
  rest[0] === "--help" ||
  rest[0] === "-h" ||
  (rest[0] === "capture" && (rest[1] === "--help" || rest[1] === "-h"));

const topLevelCommandParsers: Record<string, TopLevelCommandParser> = {
  doctor: parseDoctorArgs,
  init: parseInitArgs,
  db: parseDbArgs,
  evidence: (rest) =>
    isEvidenceHelpRequest(rest)
      ? {
          command: {
            kind: "evidenceCaptureHelp"
          }
        }
      : parseEvidenceArgs(rest),
  review: parseReviewArgs,
  maintenance: parseMaintenanceArgs,
  decision: parseDecisionArgs,
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
  const registered = parseRegisteredTopLevelCommand(command, rest);

  if (registered !== undefined) {
    return registered;
  }

  if (parser === undefined) {
    return {
      error: `Unsupported command: ${command}\n${usage}`
    };
  }

  return parser(rest);
};
