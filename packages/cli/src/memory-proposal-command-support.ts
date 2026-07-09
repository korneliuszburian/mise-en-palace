import type { ProjectId } from "@krn/core";

import {
  persistenceLine,
  postgresPersistedLabel,
  previewOnlyPersistenceLabel
} from "./command-runtime-support.js";

interface MetadataCarrier {
  readonly metadata: Record<string, unknown>;
}

interface SourceDecisionProposalSource {
  readonly sourceDecision: {
    readonly id: string;
  };
  readonly sourceClaim: {
    readonly id: string;
  };
}

interface PersistedCandidate {
  readonly id: string;
}

export interface SourceDecisionProposal {
  readonly sourceDecisionId: string;
  readonly sourceClaimId: string;
  readonly summary: string;
  readonly candidateId?: string;
  readonly skipped: boolean;
}

const metadataSourceDecisionId = (
  item: MetadataCarrier
): string | undefined => {
  const sourceDecisionId = item.metadata["sourceDecisionId"];

  return typeof sourceDecisionId === "string" && sourceDecisionId.trim().length > 0
    ? sourceDecisionId
    : undefined;
};

export const sourceDecisionIdsFromMetadata = (
  items: readonly MetadataCarrier[]
): Set<string> => {
  const ids = new Set<string>();

  for (const item of items) {
    const sourceDecisionId = metadataSourceDecisionId(item);

    if (sourceDecisionId !== undefined) {
      ids.add(sourceDecisionId);
    }
  }

  return ids;
};

export const proposeSourceDecisionCandidates = async <TSource extends SourceDecisionProposalSource>(
  input: {
    readonly sources: readonly TSource[];
    readonly alreadyRepresented: Set<string>;
    readonly persist: boolean;
    readonly summarize: (source: TSource) => string;
    readonly createCandidate: (source: TSource) => Promise<PersistedCandidate>;
  }
): Promise<SourceDecisionProposal[]> => {
  const proposed: SourceDecisionProposal[] = [];

  for (const source of input.sources) {
    const sourceDecisionId = source.sourceDecision.id;
    const sourceClaimId = source.sourceClaim.id;
    const summary = input.summarize(source);

    if (input.alreadyRepresented.has(sourceDecisionId)) {
      proposed.push({
        sourceDecisionId,
        sourceClaimId,
        summary,
        skipped: true
      });
      continue;
    }

    if (!input.persist) {
      proposed.push({
        sourceDecisionId,
        sourceClaimId,
        summary,
        skipped: false
      });
      continue;
    }

    const candidate = await input.createCandidate(source);
    input.alreadyRepresented.add(sourceDecisionId);
    proposed.push({
      sourceDecisionId,
      sourceClaimId,
      summary,
      candidateId: candidate.id,
      skipped: false
    });
  }

  return proposed;
};

export const formatSourceDecisionProposalResult = (
  input: {
    readonly title: string;
    readonly projectId: ProjectId;
    readonly sourceCountLabel: string;
    readonly sourceCount: number;
    readonly proposed: readonly SourceDecisionProposal[];
    readonly persist: boolean;
    readonly previewTarget: string;
    readonly noPromotionLine: string;
    readonly entriesTitle: string;
  }
): string => {
  const createdCount = input.proposed.filter((item) => !item.skipped).length;
  const skippedCount = input.proposed.filter((item) => item.skipped).length;
  const lines = [
    input.title,
    `Project: ${input.projectId}`,
    `${input.sourceCountLabel}: ${input.sourceCount}`,
    `Created candidates: ${input.persist ? createdCount : 0}`,
    `Preview candidates: ${input.persist ? 0 : createdCount}`,
    `Skipped duplicates: ${skippedCount}`,
    persistenceLine(
      input.persist
        ? postgresPersistedLabel
        : previewOnlyPersistenceLabel(input.previewTarget)
    ),
    input.noPromotionLine,
    "",
    input.entriesTitle
  ];

  for (const proposal of input.proposed) {
    const status = proposal.skipped
      ? "skipped_duplicate"
      : input.persist
        ? `created:${proposal.candidateId ?? "unknown"}`
        : "preview";
    lines.push(
      `- ${proposal.sourceDecisionId} -> ${proposal.sourceClaimId} (${status}) ${proposal.summary}`
    );
  }

  return `${lines.join("\n")}\n`;
};
