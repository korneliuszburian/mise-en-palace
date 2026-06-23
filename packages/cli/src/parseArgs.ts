import {
  parseAuditArgs
} from "./parseAuditArgs.js";
import {
  parseCodexArgs
} from "./parseCodexArgs.js";
import {
  parseDbArgs
} from "./parseDbArgs.js";
import {
  parseEvidenceArgs
} from "./parseEvidenceArgs.js";
import {
  parseInitArgs
} from "./parseInitArgs.js";
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
  metadataEntry,
  optionValue
} from "./parseArgHelpers.js";

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
      kind: "audit";
      scope: "repo";
      repo?: string;
      format: "text" | "json";
    }
  | {
      kind: "audit";
      scope: "slice";
      repo?: string;
      since: string;
      format: "text" | "json";
      intendedFiles: string[];
      verificationCommands: AuditVerificationCommand[];
      projectId?: string;
      retrievalRunId?: string;
      auditBundleId?: string;
      failOn?: AuditFailOn;
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

type AuditVerificationCommandStatus = "passed" | "failed" | "skipped" | "missing";
type AuditFailOn = "warning";

interface AuditVerificationCommand {
  command: string;
  status: AuditVerificationCommandStatus;
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
  "krn audit repo [--repo <path>] [--json]",
  "krn audit slice --since <ref> [--repo <path>] [--project <id>] [--retrieval-run <id>] [--audit-bundle-id <id>] [--intended-file <path>] [--verification <command=status>] [--fail-on warning] [--json]",
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
  "krn evidence capture [--run-id <id>] [--persist]",
  "krn review assess --evidence-bundle-id <id> --reviewer <name> --summary \"...\" [--status accepted|changes_requested|rejected|pending] [--persist]",
  "krn observe --run <id> [--project <id>] [--persist]",
  "krn reflect --scope run:<id>|project:<id>|topic:<name> [--project <id>] [--persist]",
  "krn codex brief --run-id <id>"
].join("\n");

export const formatUsage = (): string => `${usage}\n`;

export const formatSourceClaimAddUsage = (): string =>
  [
    "Usage: krn source claim add --title \"...\" --claim \"...\" --mechanism \"...\" --does-not-prove \"...\" --falsifier \"...\" --support-type <type> --trust-tier <tier> --consumer \"...\" [--persist]",
    "",
    "Required:",
    "--title",
    "--claim",
    "--mechanism",
    "--does-not-prove",
    "--support-type",
    "--trust-tier",
    "--consumer",
    "",
    "Optional:",
    "--run-id <execution-run-id>",
    "--uri <uri>",
    "--type <artifact-kind-or-source-type>",
    "--krn-implication <text>",
    "--falsifier <text>",
    "--revisit-when <text>",
    "--metadata key=value",
    "--persist"
  ].join("\n") + "\n";

export const formatSourceDecisionLinkUsage = (): string =>
  [
    "Usage: krn source decision link --source-claim-id <id> --target-type <type> --target-id <id> --support-type <type> --confidence <low|medium|high> --notes \"...\" [--persist]",
    "",
    "Required:",
    "--source-claim-id",
    "--target-type",
    "--target-id",
    "--support-type",
    "--confidence",
    "--notes",
    "",
    "Optional:",
    "--metadata key=value",
    "--persist"
  ].join("\n") + "\n";

export const formatSourceClaimRejectUsage = (): string =>
  [
    "Usage: krn source claim reject --title \"...\" --rejected-because <reason> [--attempted-claim \"...\"|--reason \"...\"] [--persist]",
    "",
    "Required:",
    "--title",
    "--rejected-because",
    "--attempted-claim or --reason",
    "",
    "Optional:",
    "--does-not-prove <text>",
    "--consumer <text>",
    "--run-id <execution-run-id>",
    "--source-artifact-id <id>",
    "--source-claim-id <id>",
    "--metadata key=value",
    "--persist"
  ].join("\n") + "\n";

export const formatMemoryCandidateAddUsage = (): string =>
  [
    "Usage: krn memory candidate add --run-id <id>|--feedback-delta-id <id> --kind <kind> --content \"...\" --confidence <low|medium|high|0-100> --application-guidance \"...\" [--source-claim-id <id>|--source-lineage <id>] [--persist]",
    "",
    "Required:",
    "--run-id or --feedback-delta-id",
    "--kind",
    "--content",
    "--confidence",
    "--application-guidance",
    "--source-claim-id or --source-lineage",
    "--invalidation-rule",
    "",
    "Optional:",
    "--owner <owner>",
    "--proposed-by <name>",
    "--metadata key=value",
    "--persist"
  ].join("\n") + "\n";

export const formatMemoryCandidatePromoteUsage = (): string =>
  [
    "Usage: krn memory candidate promote --candidate-id <id> --reviewer <name> --decision accepted --evidence-reviewed-ref <ref> [--persist]",
    "",
    "Required:",
    "--candidate-id",
    "--reviewer",
    "--decision accepted",
    "--evidence-reviewed-ref",
    "",
    "Optional:",
    "--metadata key=value",
    "--persist"
  ].join("\n") + "\n";

export const formatMemoryCandidateRejectUsage = (): string =>
  [
    "Usage: krn memory candidate reject --candidate-id <id> --reviewer <name> --reason \"...\" [--persist]",
    "",
    "Required:",
    "--candidate-id",
    "--reviewer",
    "--reason",
    "",
    "Optional:",
    "--metadata key=value",
    "--persist"
  ].join("\n") + "\n";

export const formatMemoryRecordApplyUsage = (): string =>
  [
    "Usage: krn memory record apply --run-id <id> --memory-id <id> --outcome <helped|hurt|neutral|stale> --notes \"...\" [--persist]",
    "",
    "Required:",
    "--run-id",
    "--memory-id",
    "--outcome",
    "--notes",
    "",
    "Optional:",
    "--expected-use <text>",
    "--task-contract-id <id>",
    "--context-assembly-id <id>",
    "--metadata key=value",
    "--persist"
  ].join("\n") + "\n";

export const formatMemoryAntiAddUsage = (): string =>
  [
    "Usage: krn memory anti add --run-id <id> --rejected-claim \"...\" --reason \"...\" [--invalidated-by-source-claim-id <id>|--source-lineage <id>] [--persist]",
    "",
    "Required:",
    "--run-id",
    "--rejected-claim",
    "--reason",
    "--invalidated-by-source-claim-id or --source-lineage",
    "",
    "Optional:",
    "--applies-to <text>",
    "--may-revisit-when <text>",
    "--owner <owner>",
    "--confidence <low|medium|high|0-100>",
    "--key <key>",
    "--metadata key=value",
    "--persist"
  ].join("\n") + "\n";

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
    if (rest.length > 0) {
      return {
        error: "Usage: krn doctor"
      };
    }

    return {
      command: {
        kind: "doctor"
      }
    };
  }

  if (command === "audit") {
    return parseAuditArgs(rest);
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
    if (rest[0] === "claim" && rest[1] === "add") {
      if (rest.length === 3 && (rest[2] === "--help" || rest[2] === "-h")) {
        return {
          command: {
            kind: "sourceClaimAddHelp"
          }
        };
      }

      const sourceCommand: Extract<CliCommand, { kind: "sourceClaimAdd" }> = {
        kind: "sourceClaimAdd",
        persist: false,
        metadata: {}
      };

      for (let index = 2; index < rest.length; index += 1) {
        const arg = rest[index];

        if (arg === "--persist") {
          sourceCommand.persist = true;
          continue;
        }

        if (arg === "--help" || arg === "-h") {
          return {
            command: {
              kind: "sourceClaimAddHelp"
            }
          };
        }

        const optionMap = {
          "--title": "title",
          "--claim": "claim",
          "--mechanism": "mechanism",
          "--does-not-prove": "doesNotProve",
          "--support-type": "supportType",
          "--trust-tier": "trustTier",
          "--consumer": "consumer",
          "--uri": "uri",
          "--type": "type",
          "--run-id": "runId",
          "--falsifier": "falsifier",
          "--revisit-when": "revisitWhen",
          "--krn-implication": "krnImplication"
        } as const;
        const option = Object.keys(optionMap).find((candidate) =>
          arg === candidate || arg?.startsWith(`${candidate}=`) === true
        );

        if (option !== undefined) {
          const valueResult = optionValue(rest, index, option);

          if (valueResult.error !== undefined || valueResult.value === undefined) {
            return {
              error: valueResult.error ?? formatSourceClaimAddUsage()
            };
          }

          sourceCommand[optionMap[option as keyof typeof optionMap]] =
            valueResult.value.trim();
          index = valueResult.nextIndex;
          continue;
        }

        if (arg === "--metadata" || arg?.startsWith("--metadata=") === true) {
          const valueResult = optionValue(rest, index, "--metadata");

          if (valueResult.error !== undefined || valueResult.value === undefined) {
            return {
              error: valueResult.error ?? formatSourceClaimAddUsage()
            };
          }

          const entry = metadataEntry(valueResult.value);

          if (entry.error !== undefined || entry.key === undefined || entry.value === undefined) {
            return {
              error: entry.error ?? formatSourceClaimAddUsage()
            };
          }

          sourceCommand.metadata[entry.key] = entry.value;
          index = valueResult.nextIndex;
          continue;
        }

        return {
          error: formatSourceClaimAddUsage()
        };
      }

      return {
        command: sourceCommand
      };
    }

    if (rest[0] === "claim" && rest[1] === "reject") {
      if (rest.length === 3 && (rest[2] === "--help" || rest[2] === "-h")) {
        return {
          command: {
            kind: "sourceClaimRejectHelp"
          }
        };
      }

      const sourceCommand: Extract<CliCommand, { kind: "sourceClaimReject" }> = {
        kind: "sourceClaimReject",
        persist: false,
        metadata: {}
      };

      for (let index = 2; index < rest.length; index += 1) {
        const arg = rest[index];

        if (arg === "--persist") {
          sourceCommand.persist = true;
          continue;
        }

        if (arg === "--help" || arg === "-h") {
          return {
            command: {
              kind: "sourceClaimRejectHelp"
            }
          };
        }

        const optionMap = {
          "--title": "title",
          "--attempted-claim": "attemptedClaim",
          "--rejected-because": "rejectedBecause",
          "--reason": "reason",
          "--does-not-prove": "doesNotProve",
          "--consumer": "consumer",
          "--run-id": "runId",
          "--source-artifact-id": "sourceArtifactId",
          "--source-claim-id": "sourceClaimId"
        } as const;
        const option = Object.keys(optionMap).find((candidate) =>
          arg === candidate || arg?.startsWith(`${candidate}=`) === true
        );

        if (option !== undefined) {
          const valueResult = optionValue(rest, index, option);

          if (valueResult.error !== undefined || valueResult.value === undefined) {
            return {
              error: valueResult.error ?? formatSourceClaimRejectUsage()
            };
          }

          sourceCommand[optionMap[option as keyof typeof optionMap]] =
            valueResult.value.trim();
          index = valueResult.nextIndex;
          continue;
        }

        if (arg === "--metadata" || arg?.startsWith("--metadata=") === true) {
          const valueResult = optionValue(rest, index, "--metadata");

          if (valueResult.error !== undefined || valueResult.value === undefined) {
            return {
              error: valueResult.error ?? formatSourceClaimRejectUsage()
            };
          }

          const entry = metadataEntry(valueResult.value);

          if (entry.error !== undefined || entry.key === undefined || entry.value === undefined) {
            return {
              error: entry.error ?? formatSourceClaimRejectUsage()
            };
          }

          sourceCommand.metadata[entry.key] = entry.value;
          index = valueResult.nextIndex;
          continue;
        }

        return {
          error: formatSourceClaimRejectUsage()
        };
      }

      return {
        command: sourceCommand
      };
    }

    if (rest[0] === "decision" && rest[1] === "link") {
      if (rest.length === 3 && (rest[2] === "--help" || rest[2] === "-h")) {
        return {
          command: {
            kind: "sourceDecisionLinkHelp"
          }
        };
      }

      const sourceCommand: Extract<CliCommand, { kind: "sourceDecisionLink" }> = {
        kind: "sourceDecisionLink",
        persist: false,
        metadata: {}
      };

      for (let index = 2; index < rest.length; index += 1) {
        const arg = rest[index];

        if (arg === "--persist") {
          sourceCommand.persist = true;
          continue;
        }

        if (arg === "--help" || arg === "-h") {
          return {
            command: {
              kind: "sourceDecisionLinkHelp"
            }
          };
        }

        const optionMap = {
          "--source-claim-id": "sourceClaimId",
          "--target-type": "targetType",
          "--target-id": "targetId",
          "--support-type": "supportType",
          "--confidence": "confidence",
          "--notes": "notes"
        } as const;
        const option = Object.keys(optionMap).find((candidate) =>
          arg === candidate || arg?.startsWith(`${candidate}=`) === true
        );

        if (option !== undefined) {
          const valueResult = optionValue(rest, index, option);

          if (valueResult.error !== undefined || valueResult.value === undefined) {
            return {
              error: valueResult.error ?? formatSourceDecisionLinkUsage()
            };
          }

          sourceCommand[optionMap[option as keyof typeof optionMap]] =
            valueResult.value.trim();
          index = valueResult.nextIndex;
          continue;
        }

        if (arg === "--metadata" || arg?.startsWith("--metadata=") === true) {
          const valueResult = optionValue(rest, index, "--metadata");

          if (valueResult.error !== undefined || valueResult.value === undefined) {
            return {
              error: valueResult.error ?? formatSourceDecisionLinkUsage()
            };
          }

          const entry = metadataEntry(valueResult.value);

          if (entry.error !== undefined || entry.key === undefined || entry.value === undefined) {
            return {
              error: entry.error ?? formatSourceDecisionLinkUsage()
            };
          }

          sourceCommand.metadata[entry.key] = entry.value;
          index = valueResult.nextIndex;
          continue;
        }

        return {
          error: formatSourceDecisionLinkUsage()
        };
      }

      return {
        command: sourceCommand
      };
    }

    return {
      error: formatSourceClaimAddUsage()
    };
  }

  if (command === "memory") {
    if (rest[0] === "candidate" && rest[1] === "add") {
      if (rest.length === 3 && (rest[2] === "--help" || rest[2] === "-h")) {
        return {
          command: {
            kind: "memoryCandidateAddHelp"
          }
        };
      }

      const memoryCommand: Extract<CliCommand, { kind: "memoryCandidateAdd" }> = {
        kind: "memoryCandidateAdd",
        persist: false,
        sourceLineageIds: [],
        metadata: {}
      };

      for (let index = 2; index < rest.length; index += 1) {
        const arg = rest[index];

        if (arg === "--persist") {
          memoryCommand.persist = true;
          continue;
        }

        if (arg === "--help" || arg === "-h") {
          return {
            command: {
              kind: "memoryCandidateAddHelp"
            }
          };
        }

        const optionMap = {
          "--run-id": "runId",
          "--feedback-delta-id": "feedbackDeltaId",
          "--kind": "memoryKind",
          "--content": "content",
          "--confidence": "confidence",
          "--application-guidance": "applicationGuidance",
          "--source-claim-id": "sourceClaimId",
          "--invalidation-rule": "invalidationRule",
          "--owner": "owner",
          "--proposed-by": "proposedBy"
        } as const;
        const option = Object.keys(optionMap).find((candidate) =>
          arg === candidate || arg?.startsWith(`${candidate}=`) === true
        );

        if (option !== undefined) {
          const valueResult = optionValue(rest, index, option);

          if (valueResult.error !== undefined || valueResult.value === undefined) {
            return {
              error: valueResult.error ?? formatMemoryCandidateAddUsage()
            };
          }

          memoryCommand[optionMap[option as keyof typeof optionMap]] =
            valueResult.value.trim();
          index = valueResult.nextIndex;
          continue;
        }

        if (arg === "--source-lineage" || arg?.startsWith("--source-lineage=") === true) {
          const valueResult = optionValue(rest, index, "--source-lineage");

          if (valueResult.error !== undefined || valueResult.value === undefined) {
            return {
              error: valueResult.error ?? formatMemoryCandidateAddUsage()
            };
          }

          memoryCommand.sourceLineageIds.push(valueResult.value.trim());
          index = valueResult.nextIndex;
          continue;
        }

        if (arg === "--metadata" || arg?.startsWith("--metadata=") === true) {
          const valueResult = optionValue(rest, index, "--metadata");

          if (valueResult.error !== undefined || valueResult.value === undefined) {
            return {
              error: valueResult.error ?? formatMemoryCandidateAddUsage()
            };
          }

          const entry = metadataEntry(valueResult.value);

          if (entry.error !== undefined || entry.key === undefined || entry.value === undefined) {
            return {
              error: entry.error ?? formatMemoryCandidateAddUsage()
            };
          }

          memoryCommand.metadata[entry.key] = entry.value;
          index = valueResult.nextIndex;
          continue;
        }

        return {
          error: formatMemoryCandidateAddUsage()
        };
      }

      return {
        command: memoryCommand
      };
    }

    if (rest[0] === "candidate" && rest[1] === "promote") {
      if (rest.length === 3 && (rest[2] === "--help" || rest[2] === "-h")) {
        return {
          command: {
            kind: "memoryCandidatePromoteHelp"
          }
        };
      }

      const memoryCommand: Extract<CliCommand, { kind: "memoryCandidatePromote" }> = {
        kind: "memoryCandidatePromote",
        persist: false,
        metadata: {}
      };

      for (let index = 2; index < rest.length; index += 1) {
        const arg = rest[index];

        if (arg === "--persist") {
          memoryCommand.persist = true;
          continue;
        }

        if (arg === "--help" || arg === "-h") {
          return {
            command: {
              kind: "memoryCandidatePromoteHelp"
            }
          };
        }

        const optionMap = {
          "--candidate-id": "candidateId",
          "--reviewer": "reviewer",
          "--decision": "decision",
          "--evidence-reviewed-ref": "evidenceReviewedRef"
        } as const;
        const option = Object.keys(optionMap).find((candidate) =>
          arg === candidate || arg?.startsWith(`${candidate}=`) === true
        );

        if (option !== undefined) {
          const valueResult = optionValue(rest, index, option);

          if (valueResult.error !== undefined || valueResult.value === undefined) {
            return {
              error: valueResult.error ?? formatMemoryCandidatePromoteUsage()
            };
          }

          memoryCommand[optionMap[option as keyof typeof optionMap]] =
            valueResult.value.trim();
          index = valueResult.nextIndex;
          continue;
        }

        if (arg === "--metadata" || arg?.startsWith("--metadata=") === true) {
          const valueResult = optionValue(rest, index, "--metadata");

          if (valueResult.error !== undefined || valueResult.value === undefined) {
            return {
              error: valueResult.error ?? formatMemoryCandidatePromoteUsage()
            };
          }

          const entry = metadataEntry(valueResult.value);

          if (entry.error !== undefined || entry.key === undefined || entry.value === undefined) {
            return {
              error: entry.error ?? formatMemoryCandidatePromoteUsage()
            };
          }

          memoryCommand.metadata[entry.key] = entry.value;
          index = valueResult.nextIndex;
          continue;
        }

        return {
          error: formatMemoryCandidatePromoteUsage()
        };
      }

      return {
        command: memoryCommand
      };
    }

    if (rest[0] === "candidate" && rest[1] === "reject") {
      if (rest.length === 3 && (rest[2] === "--help" || rest[2] === "-h")) {
        return {
          command: {
            kind: "memoryCandidateRejectHelp"
          }
        };
      }

      const memoryCommand: Extract<CliCommand, { kind: "memoryCandidateReject" }> = {
        kind: "memoryCandidateReject",
        persist: false,
        metadata: {}
      };

      for (let index = 2; index < rest.length; index += 1) {
        const arg = rest[index];

        if (arg === "--persist") {
          memoryCommand.persist = true;
          continue;
        }

        if (arg === "--help" || arg === "-h") {
          return {
            command: {
              kind: "memoryCandidateRejectHelp"
            }
          };
        }

        const optionMap = {
          "--candidate-id": "candidateId",
          "--reviewer": "reviewer",
          "--reason": "reason"
        } as const;
        const option = Object.keys(optionMap).find((candidate) =>
          arg === candidate || arg?.startsWith(`${candidate}=`) === true
        );

        if (option !== undefined) {
          const valueResult = optionValue(rest, index, option);

          if (valueResult.error !== undefined || valueResult.value === undefined) {
            return {
              error: valueResult.error ?? formatMemoryCandidateRejectUsage()
            };
          }

          memoryCommand[optionMap[option as keyof typeof optionMap]] =
            valueResult.value.trim();
          index = valueResult.nextIndex;
          continue;
        }

        if (arg === "--metadata" || arg?.startsWith("--metadata=") === true) {
          const valueResult = optionValue(rest, index, "--metadata");

          if (valueResult.error !== undefined || valueResult.value === undefined) {
            return {
              error: valueResult.error ?? formatMemoryCandidateRejectUsage()
            };
          }

          const entry = metadataEntry(valueResult.value);

          if (entry.error !== undefined || entry.key === undefined || entry.value === undefined) {
            return {
              error: entry.error ?? formatMemoryCandidateRejectUsage()
            };
          }

          memoryCommand.metadata[entry.key] = entry.value;
          index = valueResult.nextIndex;
          continue;
        }

        return {
          error: formatMemoryCandidateRejectUsage()
        };
      }

      return {
        command: memoryCommand
      };
    }

    if (rest[0] === "record" && rest[1] === "apply") {
      if (rest.length === 3 && (rest[2] === "--help" || rest[2] === "-h")) {
        return {
          command: {
            kind: "memoryRecordApplyHelp"
          }
        };
      }

      const memoryCommand: Extract<CliCommand, { kind: "memoryRecordApply" }> = {
        kind: "memoryRecordApply",
        persist: false,
        metadata: {}
      };

      for (let index = 2; index < rest.length; index += 1) {
        const arg = rest[index];

        if (arg === "--persist") {
          memoryCommand.persist = true;
          continue;
        }

        if (arg === "--help" || arg === "-h") {
          return {
            command: {
              kind: "memoryRecordApplyHelp"
            }
          };
        }

        const optionMap = {
          "--run-id": "runId",
          "--memory-id": "memoryId",
          "--outcome": "outcome",
          "--notes": "notes",
          "--expected-use": "expectedUse",
          "--task-contract-id": "taskContractId",
          "--context-assembly-id": "contextAssemblyId"
        } as const;
        const option = Object.keys(optionMap).find((candidate) =>
          arg === candidate || arg?.startsWith(`${candidate}=`) === true
        );

        if (option !== undefined) {
          const valueResult = optionValue(rest, index, option);

          if (valueResult.error !== undefined || valueResult.value === undefined) {
            return {
              error: valueResult.error ?? formatMemoryRecordApplyUsage()
            };
          }

          memoryCommand[optionMap[option as keyof typeof optionMap]] =
            valueResult.value.trim();
          index = valueResult.nextIndex;
          continue;
        }

        if (arg === "--metadata" || arg?.startsWith("--metadata=") === true) {
          const valueResult = optionValue(rest, index, "--metadata");

          if (valueResult.error !== undefined || valueResult.value === undefined) {
            return {
              error: valueResult.error ?? formatMemoryRecordApplyUsage()
            };
          }

          const entry = metadataEntry(valueResult.value);

          if (entry.error !== undefined || entry.key === undefined || entry.value === undefined) {
            return {
              error: entry.error ?? formatMemoryRecordApplyUsage()
            };
          }

          memoryCommand.metadata[entry.key] = entry.value;
          index = valueResult.nextIndex;
          continue;
        }

        return {
          error: formatMemoryRecordApplyUsage()
        };
      }

      return {
        command: memoryCommand
      };
    }

    if (rest[0] === "anti" && rest[1] === "add") {
      if (rest.length === 3 && (rest[2] === "--help" || rest[2] === "-h")) {
        return {
          command: {
            kind: "memoryAntiAddHelp"
          }
        };
      }

      const memoryCommand: Extract<CliCommand, { kind: "memoryAntiAdd" }> = {
        kind: "memoryAntiAdd",
        persist: false,
        sourceLineageIds: [],
        metadata: {}
      };

      for (let index = 2; index < rest.length; index += 1) {
        const arg = rest[index];

        if (arg === "--persist") {
          memoryCommand.persist = true;
          continue;
        }

        if (arg === "--help" || arg === "-h") {
          return {
            command: {
              kind: "memoryAntiAddHelp"
            }
          };
        }

        const optionMap = {
          "--run-id": "runId",
          "--rejected-claim": "rejectedClaim",
          "--reason": "reason",
          "--invalidated-by-source-claim-id": "invalidatedBySourceClaimId",
          "--applies-to": "appliesTo",
          "--may-revisit-when": "mayRevisitWhen",
          "--owner": "owner",
          "--confidence": "confidence",
          "--key": "key"
        } as const;
        const option = Object.keys(optionMap).find((candidate) =>
          arg === candidate || arg?.startsWith(`${candidate}=`) === true
        );

        if (option !== undefined) {
          const valueResult = optionValue(rest, index, option);

          if (valueResult.error !== undefined || valueResult.value === undefined) {
            return {
              error: valueResult.error ?? formatMemoryAntiAddUsage()
            };
          }

          memoryCommand[optionMap[option as keyof typeof optionMap]] =
            valueResult.value.trim();
          index = valueResult.nextIndex;
          continue;
        }

        if (arg === "--source-lineage" || arg?.startsWith("--source-lineage=") === true) {
          const valueResult = optionValue(rest, index, "--source-lineage");

          if (valueResult.error !== undefined || valueResult.value === undefined) {
            return {
              error: valueResult.error ?? formatMemoryAntiAddUsage()
            };
          }

          memoryCommand.sourceLineageIds.push(valueResult.value.trim());
          index = valueResult.nextIndex;
          continue;
        }

        if (arg === "--metadata" || arg?.startsWith("--metadata=") === true) {
          const valueResult = optionValue(rest, index, "--metadata");

          if (valueResult.error !== undefined || valueResult.value === undefined) {
            return {
              error: valueResult.error ?? formatMemoryAntiAddUsage()
            };
          }

          const entry = metadataEntry(valueResult.value);

          if (entry.error !== undefined || entry.key === undefined || entry.value === undefined) {
            return {
              error: entry.error ?? formatMemoryAntiAddUsage()
            };
          }

          memoryCommand.metadata[entry.key] = entry.value;
          index = valueResult.nextIndex;
          continue;
        }

        return {
          error: formatMemoryAntiAddUsage()
        };
      }

      return {
        command: memoryCommand
      };
    }

    return {
      error: [
        formatMemoryCandidateAddUsage().trim(),
        formatMemoryCandidatePromoteUsage().trim(),
        formatMemoryCandidateRejectUsage().trim(),
        formatMemoryRecordApplyUsage().trim(),
        formatMemoryAntiAddUsage().trim()
      ].join("\n\n")
    };
  }

  if (command !== "plan") {
    return {
      error: "Usage: krn plan --task \"...\""
    };
  }

  return parsePlanArgs(rest, usage);
};
