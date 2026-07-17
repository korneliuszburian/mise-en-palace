import { describe, expect, it } from "vitest";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { eq, inArray, sql } from "drizzle-orm";
import postgres from "postgres";
import {
  applyReviewedHelpedAuthorityUpgradeThroughGate,
  promoteMemoryCandidateThroughGate
} from "@krn/harness";
import {
  ReviewedHelpedLearningBlockedError
} from "@krn/core/repositories/internal";

import {
  activeMemorySelectionOrder,
  antiMemoryPromotionMetadata,
  assertAntiMemoryCandidateInvariants,
  assertMemoryCoreInvariants,
  DrizzleMemoryRepository,
  memoryAuthorityPredecessorFingerprint,
  memoryPromotionMetadata
} from "../drizzle-memory-repository.js";
import { createKrnDatabase } from "../../database.js";
import {
  cleanupActivationSmokeRows,
  countActivationSmokeMarkerRows,
  createSmokeHarnessScaffold
} from "../../dev/smoke/db-smoke-support.js";
import { memoryApplications, memoryRecords } from "../../schema/index.js";

const databaseUrl = process.env.KRN_DATABASE_URL?.trim();
const postgresIt = it.skipIf(databaseUrl === undefined || databaseUrl.length === 0);
const migrationsFolder = fileURLToPath(new URL("../../migrations", import.meta.url));

const waitForBackendTableLock = async (
  observer: ReturnType<typeof postgres>,
  backendPid: number
): Promise<void> => {
  const deadline = Date.now() + 5_000;

  while (Date.now() < deadline) {
    const [activity] = await observer<{
      waitEventType: string | null;
    }[]>`
      select wait_event_type as "waitEventType"
      from pg_stat_activity
      where pid = ${backendPid}
    `;

    if (activity?.waitEventType === "Lock") {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  throw new Error(`writer backend ${backendPid} did not wait for the rebuild table lock`);
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const orderColumnName = (order: unknown): string | undefined => {
  if (!isRecord(order) || !Array.isArray(order["queryChunks"])) {
    return undefined;
  }

  const column = order["queryChunks"].find((chunk) =>
    isRecord(chunk) && typeof chunk["name"] === "string"
  );

  return isRecord(column) && typeof column["name"] === "string"
    ? column["name"]
    : undefined;
};

const orderDirection = (order: unknown): "asc" | "desc" | undefined => {
  if (!isRecord(order) || !Array.isArray(order["queryChunks"])) {
    return undefined;
  }

  const suffix = order["queryChunks"].flatMap((chunk) => {
    if (!isRecord(chunk) || !Array.isArray(chunk["value"])) {
      return [];
    }

    return chunk["value"].filter((item): item is string => typeof item === "string");
  }).join("");

  return suffix.includes("desc") ? "desc" : "asc";
};

describe("DrizzleMemoryRepository", () => {
  postgresIt("fails closed before proposing reviewed helped learning from unknown store identities", async () => {
    const marker = `krn_reviewed_helped_candidate_${crypto.randomUUID().replaceAll("-", "")}`;
    const scaffold = await createSmokeHarnessScaffold({
      databaseUrl: databaseUrl!,
      migrationsFolder,
      smokeId: marker,
      smokeName: "reviewed helped candidate authority",
      workspacePrefix: "krn-reviewed-helped-candidate",
      projectSlug: "reviewed-helped-candidate",
      cleanupRows: cleanupActivationSmokeRows,
      countMarkerRows: countActivationSmokeMarkerRows,
      rawIntent: `reviewed helped candidate authority ${marker}`,
      taskContract: {
        title: "Reject caller-asserted reviewed helped learning",
        objective: "Require the exact authoritative store chain before proposing memory.",
        constraints: ["real PostgreSQL"],
        nonGoals: ["promote a MemoryRecord"],
        acceptance: ["unknown feedback identity creates no candidate"]
      },
      harnessPlan: {
        summary: "Reviewed helped candidate authority",
        nextAction: "Attempt a proposal with unknown authority identities."
      }
    });

    try {
      const proposal = scaffold.memoryRepository.proposeReviewedHelpedMemoryCandidateOnce({
        projectId: scaffold.project.id,
        feedbackDeltaId: crypto.randomUUID(),
        reviewAssessmentId: crypto.randomUUID(),
        sourceDecisionId: crypto.randomUUID()
      });

      await expect(proposal).rejects.toBeInstanceOf(ReviewedHelpedLearningBlockedError);
      await expect(proposal).rejects.toMatchObject({
        reason: "feedback_delta_not_found"
      });

      expect(await scaffold.memoryRepository.listMemoryCandidates(scaffold.project.id))
        .toEqual([]);
    } finally {
      await scaffold.cleanup();
      await scaffold.client.end();
    }
  });

  // fallow-ignore-next-line complexity -- one real-store authority chain owns rejection, concurrency, rollback, retry corruption, and final selection falsifiers
  postgresIt("proposes one exact reviewed helped candidate atomically and rejects weaker authority", async () => {
    const marker = `krn_reviewed_helped_chain_${crypto.randomUUID().replaceAll("-", "")}`;
    const scaffold = await createSmokeHarnessScaffold({
      databaseUrl: databaseUrl!,
      migrationsFolder,
      smokeId: marker,
      smokeName: "reviewed helped candidate chain",
      workspacePrefix: "krn-reviewed-helped-chain",
      projectSlug: "reviewed-helped-chain",
      cleanupRows: cleanupActivationSmokeRows,
      countMarkerRows: countActivationSmokeMarkerRows,
      rawIntent: `reviewed helped candidate chain ${marker}`,
      taskContract: {
        title: "Persist one exact reviewed helped candidate",
        objective: "Reject weaker outcomes and duplicate concurrent proposals.",
        constraints: ["real PostgreSQL", "two repository connections"],
        nonGoals: ["promote a MemoryRecord"],
        acceptance: ["one canonical application creates one proposed candidate"]
      },
      harnessPlan: {
        summary: "Reviewed helped candidate chain",
        nextAction: "Race the exact governed proposal."
      }
    });
    const retryClient = postgres(databaseUrl!, { max: 1, onnotice: () => undefined });
    const lockClient = postgres(databaseUrl!, { max: 1, onnotice: () => undefined });
    const observerClient = postgres(databaseUrl!, { max: 1, onnotice: () => undefined });
    const retryRepository = new DrizzleMemoryRepository(createKrnDatabase(retryClient));
    let releaseAuthorityLock = (): void => {};

    try {
      const executionRun = await scaffold.harnessRunRepository.createExecutionRun({
        harnessPlanId: scaffold.harnessPlan.id,
        adapter: "reviewed-helped-chain",
        metadata: { smokeId: marker }
      });
      const sourceMetadata = {
        smokeId: marker,
        evidenceRef: `source-authority://${marker}/captured`,
        evidenceStatus: "captured",
        evidenceContentHash: `sha256:${marker}:captured-evidence`,
        evidenceFreshness: "current"
      };
      const artifact = await scaffold.sourceRepository.createSourceArtifact({
        projectId: scaffold.project.id,
        kind: "doc",
        sourceAuthority: "project-decision",
        uri: `source-authority://${marker}`,
        title: "Reviewed helped authority",
        contentHash: `sha256:${marker}:artifact`,
        metadata: sourceMetadata
      });
      const chunk = await scaffold.sourceRepository.createSourceChunk({
        sourceArtifactId: artifact.id,
        ordinal: 0,
        content: "Captured evidence for reviewed helped learning.",
        contentHash: `sha256:${marker}:chunk`,
        metadata: sourceMetadata
      });
      const claim = await scaffold.sourceRepository.createSourceClaim({
        sourceArtifactId: artifact.id,
        sourceChunkId: chunk.id,
        claim: "Only exact reviewed helped applications may propose memory.",
        mechanism: "The store joins packet, review, application, source, and project authority.",
        krnImplication: "Caller strings cannot establish learned-memory authority.",
        doesNotProve: "One store fixture does not prove future task benefit.",
        sourceAuthority: "project-decision",
        supportType: "implementation-boundary",
        consumer: "reviewed helped learning",
        falsifier: "A used or mismatched subject creates a candidate.",
        metadata: sourceMetadata
      });
      const decision = await scaffold.sourceRepository.createSourceDecision({
        projectId: scaffold.project.id,
        sourceClaimId: claim.id,
        status: "adopt",
        decision: "Require store-validated reviewed helped learning.",
        rationale: "Every authority identity is persisted and cross-checked.",
        falsifier: "A caller-asserted identity bypasses store validation.",
        consumer: "reviewed helped learning",
        metadata: { ...sourceMetadata, smokeId: marker }
      });
      await scaffold.sourceRepository.createSourceDecisionEdge({
        sourceClaimId: claim.id,
        sourceDecisionId: decision.id,
        targetType: "memory_record",
        targetId: `reviewed-helped:${marker}`,
        supportType: "implementation-boundary",
        confidence: "high",
        notes: "Captured-current decision-grade support.",
        metadata: { smokeId: marker }
      });

      const packetChecksum = crypto.createHash("sha256").update(marker).digest("hex");
      const packetGeneratedAt = new Date(Date.now() - 2_000).toISOString();
      const appliedAt = new Date(Date.now() - 1_000).toISOString();
      const packetEvidenceRef = `packet:${packetChecksum}`;
      const applicationId = `reviewed-helped:${marker}`;
      const usedDecisionId = crypto.randomUUID();
      const bindingMetadata = {
        smokeId: marker,
        decisionPacketBindingState: "bound_current",
        decisionPacketAuthorityAdmission: "current_v1",
        decisionPacketChecksum: packetChecksum,
        decisionPacketEvidenceRef: packetEvidenceRef,
        decisionPacketGeneratedAt: packetGeneratedAt,
        decisionPacketSourceRunLifecycleRevision: executionRun.lifecycleRevision
      };
      const [issuance] = await scaffold.client<{ executionRunId: string }[]>`
        insert into decision_packet_issuances (
          execution_run_id, packet_checksum, packet_generated_at,
          source_run_lifecycle_revision, readback
        ) values (
          ${executionRun.id}, ${packetChecksum}, ${packetGeneratedAt},
          ${executionRun.lifecycleRevision}, ${JSON.stringify({ smokeId: marker })}::jsonb
        ) returning execution_run_id::text as "executionRunId"
      `;
      expect(issuance?.executionRunId).toBe(executionRun.id);
      const [bundle] = await scaffold.client<{ id: string }[]>`
        insert into evidence_bundles (
          execution_run_id, status, changed_files, commands, diff_risk,
          review_burden, rollback_path, capture_identity, capture_channel, metadata
        ) values (
          ${executionRun.id}, 'captured', '[]'::jsonb, '[]'::jsonb, 'low',
          'Review exact learned authority.', 'Delete marker-scoped rows.',
          ${marker}, 'evidence_feedback_v1', ${JSON.stringify(bindingMetadata)}::jsonb
        ) returning id::text as id
      `;
      if (bundle === undefined) {
        throw new Error("reviewed helped EvidenceBundle fixture was not persisted");
      }
      const [feedbackReview] = await scaffold.client<{ id: string }[]>`
        insert into review_assessments (
          evidence_bundle_id, capture_channel, status, reviewer, summary, metadata
        ) values (
          ${bundle.id}, 'evidence_feedback_v1', 'pending', 'capture-checker',
          'Current packet-bound evidence.', ${JSON.stringify({ smokeId: marker })}::jsonb
        ) returning id::text as id
      `;
      if (feedbackReview === undefined) {
        throw new Error("evidence feedback ReviewAssessment fixture was not persisted");
      }
      const sourceOutcomes = [{
        sourceDecisionId: decision.id,
        outcome: "helped",
        reason: "The exact application improved the mapped result.",
        evidenceRefs: [packetEvidenceRef],
        doesNotProve: "One result does not prove portability.",
        applicationId,
        appliedAt
      }, {
        sourceDecisionId: usedDecisionId,
        outcome: "used",
        reason: "The subject was observed without benefit attribution.",
        evidenceRefs: [packetEvidenceRef],
        doesNotProve: "Use does not prove help.",
        applicationId: `${applicationId}:used`,
        appliedAt
      }];
      const [feedback] = await scaffold.client<{ id: string }[]>`
        insert into feedback_deltas (
          review_assessment_id, capture_channel, decision_packet_authority_admission,
          status, metadata
        ) values (
          ${feedbackReview.id}, 'evidence_feedback_v1', 'current_v1', 'candidate',
          ${JSON.stringify({
            ...bindingMetadata,
            sourceUsefulnessOutcomes: sourceOutcomes
          })}::jsonb
        ) returning id::text as id
      `;
      const [acceptedReview] = await scaffold.client<{ id: string }[]>`
        insert into review_assessments (
          evidence_bundle_id, capture_channel, status, reviewer, summary, metadata
        ) values (
          ${bundle.id}, 'review_assess_v1', 'accepted', 'independent-reviewer',
          'The exact helped subject is eligible for candidate proposal.',
          ${JSON.stringify({
            smokeId: marker,
            sourceDecisionId: decision.id,
            sourceClaimId: claim.id,
            applicationId
          })}::jsonb
        ) returning id::text as id
      `;
      if (feedback === undefined || acceptedReview === undefined) {
        throw new Error("reviewed helped feedback fixtures were not persisted");
      }
      await scaffold.client`
        insert into usefulness_applications (
          application_id, subject_kind, subject_id, project_id, execution_run_id,
          task_contract_id, packet_checksum, packet_generated_at,
          source_run_lifecycle_revision, applied_at
        ) values (
          ${applicationId}, 'source_decision', ${decision.id}, ${scaffold.project.id},
          ${executionRun.id}, ${scaffold.taskContract.id}, ${packetChecksum},
          ${packetGeneratedAt}, ${executionRun.lifecycleRevision}, ${appliedAt}
        )
      `;

      const input = {
        projectId: scaffold.project.id,
        feedbackDeltaId: feedback.id,
        reviewAssessmentId: acceptedReview.id,
        sourceDecisionId: decision.id
      };

      await scaffold.client`
        update evidence_bundles set capture_channel = 'eval_feedback_v1' where id = ${bundle.id}
      `;
      await expect(scaffold.memoryRepository.proposeReviewedHelpedMemoryCandidateOnce(input))
        .rejects.toMatchObject({ reason: "feedback_delta_not_authoritative" });
      await scaffold.client`
        update evidence_bundles set capture_channel = 'evidence_feedback_v1' where id = ${bundle.id}
      `;
      await scaffold.client`
        update review_assessments set capture_channel = 'eval_feedback_v1' where id = ${feedbackReview.id}
      `;
      await expect(scaffold.memoryRepository.proposeReviewedHelpedMemoryCandidateOnce(input))
        .rejects.toMatchObject({ reason: "feedback_delta_not_authoritative" });
      await scaffold.client`
        update review_assessments
        set capture_channel = 'evidence_feedback_v1'
        where id = ${feedbackReview.id}
      `;

      await scaffold.client`
        update usefulness_applications set subject_id = ${usedDecisionId} where application_id = ${applicationId}
      `;
      await expect(scaffold.memoryRepository.proposeReviewedHelpedMemoryCandidateOnce(input))
        .rejects.toMatchObject({ reason: "application_identity_mismatch" });
      await scaffold.client`
        update usefulness_applications set subject_id = ${decision.id} where application_id = ${applicationId}
      `;

      const missingApplicationOutcomes = sourceOutcomes.map((outcome, index) =>
        index === 0 ? { ...outcome, applicationId: `${applicationId}:missing` } : outcome
      );
      await scaffold.client`
        update feedback_deltas
        set metadata = ${JSON.stringify({
          ...bindingMetadata,
          sourceUsefulnessOutcomes: missingApplicationOutcomes
        })}::jsonb
        where id = ${feedback.id}
      `;
      await expect(scaffold.memoryRepository.proposeReviewedHelpedMemoryCandidateOnce(input))
        .rejects.toMatchObject({ reason: "application_not_found" });
      await scaffold.client`
        update feedback_deltas
        set metadata = ${JSON.stringify({
          ...bindingMetadata,
          sourceUsefulnessOutcomes: sourceOutcomes
        })}::jsonb
        where id = ${feedback.id}
      `;

      await expect(scaffold.memoryRepository.proposeReviewedHelpedMemoryCandidateOnce({
        ...input,
        sourceDecisionId: usedDecisionId
      })).rejects.toMatchObject({ reason: "source_outcome_not_helped" });

      const concurrent = await Promise.all([
        scaffold.memoryRepository.proposeReviewedHelpedMemoryCandidateOnce(input),
        retryRepository.proposeReviewedHelpedMemoryCandidateOnce(input)
      ]);
      expect(concurrent.map((result) => result.created).sort()).toEqual([false, true]);
      expect(new Set(concurrent.map((result) => result.candidate.id)).size).toBe(1);
      expect(concurrent[0]?.candidate).toMatchObject({
        projectId: scaffold.project.id,
        executionRunId: executionRun.id,
        feedbackDeltaId: feedback.id,
        reviewAssessmentId: acceptedReview.id,
        usefulnessApplicationId: applicationId,
        sourceClaimIds: [claim.id],
        isUserPreference: false,
        metadata: {
          candidateType: "reviewed_helped_source_decision",
          sourceDecisionId: decision.id,
          sourceClaimId: claim.id,
          usefulnessOutcome: "helped",
          usefulnessApplicationId: applicationId,
          evidenceBundleId: bundle.id,
          packetChecksum,
          reflectionCandidateEvidence: {
            provenance: "feedback_delta",
            doesNotProve: "One result does not prove portability."
          }
        }
      });
      expect(concurrent[0]?.candidate.sourceLineage.map((item) => item.sourceId))
        .toEqual([claim.id, decision.id, expect.any(String), feedback.id, acceptedReview.id, applicationId]);

      const [counts] = await scaffold.client<{
        candidateCount: number;
        recordCount: number;
      }[]>`
        select
          (select count(*)::int from memory_candidates
            where usefulness_application_id = ${applicationId}) as "candidateCount",
          (select count(*)::int from memory_records
            where metadata->>'smokeId' = ${marker}) as "recordCount"
      `;
      expect(counts).toEqual({ candidateCount: 1, recordCount: 0 });

      await scaffold.client`
        update feedback_deltas
        set metadata = jsonb_set(metadata, '{decisionPacketChecksum}', to_jsonb(${'0'.repeat(64)}::text))
        where id = ${feedback.id}
      `;
      await expect(scaffold.memoryRepository.proposeReviewedHelpedMemoryCandidateOnce(input))
        .rejects.toMatchObject({ reason: "packet_binding_mismatch" });
      await scaffold.client`
        update feedback_deltas
        set metadata = ${JSON.stringify({
          ...bindingMetadata,
          sourceUsefulnessOutcomes: sourceOutcomes
        })}::jsonb
        where id = ${feedback.id}
      `;

      await scaffold.client`
        update review_assessments set status = 'pending' where id = ${acceptedReview.id}
      `;
      await expect(scaffold.memoryRepository.proposeReviewedHelpedMemoryCandidateOnce(input))
        .rejects.toMatchObject({ reason: "review_assessment_not_accepted" });
      await scaffold.client`
        update review_assessments set status = 'accepted' where id = ${acceptedReview.id}
      `;

      const [foreignBundle] = await scaffold.client<{ id: string }[]>`
        insert into evidence_bundles (
          execution_run_id, status, changed_files, commands, diff_risk,
          review_burden, rollback_path, capture_identity, capture_channel, metadata
        ) values (
          ${executionRun.id}, 'captured', '[]'::jsonb, '[]'::jsonb, 'low',
          'Foreign review bundle.', 'Delete marker-scoped rows.',
          ${`${marker}:foreign`}, 'evidence_feedback_v1', ${JSON.stringify(bindingMetadata)}::jsonb
        ) returning id::text as id
      `;
      if (foreignBundle === undefined) {
        throw new Error("foreign EvidenceBundle fixture was not persisted");
      }
      await scaffold.client`
        update review_assessments
        set evidence_bundle_id = ${foreignBundle.id}
        where id = ${acceptedReview.id}
      `;
      await expect(scaffold.memoryRepository.proposeReviewedHelpedMemoryCandidateOnce(input))
        .rejects.toMatchObject({ reason: "review_evidence_bundle_mismatch" });
      await scaffold.client`
        update review_assessments
        set evidence_bundle_id = ${bundle.id}
        where id = ${acceptedReview.id}
      `;

      await scaffold.client`
        update review_assessments
        set metadata = jsonb_set(metadata, '{sourceDecisionId}', to_jsonb(${usedDecisionId}::text))
        where id = ${acceptedReview.id}
      `;
      await expect(scaffold.memoryRepository.proposeReviewedHelpedMemoryCandidateOnce(input))
        .rejects.toMatchObject({ reason: "review_subject_mismatch" });
      await scaffold.client`
        update review_assessments
        set metadata = ${JSON.stringify({
          smokeId: marker,
          sourceDecisionId: decision.id,
          sourceClaimId: claim.id,
          applicationId
        })}::jsonb
        where id = ${acceptedReview.id}
      `;

      await expect(scaffold.memoryRepository.proposeReviewedHelpedMemoryCandidateOnce({
        ...input,
        projectId: crypto.randomUUID()
      })).rejects.toMatchObject({ reason: "application_identity_mismatch" });

      const candidateId = concurrent[0]!.candidate.id;
      await scaffold.client`
        update memory_candidates set summary = 'corrupt legacy candidate' where id = ${candidateId}
      `;
      await expect(scaffold.memoryRepository.proposeReviewedHelpedMemoryCandidateOnce(input))
        .rejects.toMatchObject({ reason: "existing_candidate_identity_conflict" });
      await scaffold.client`
        update memory_candidates
        set summary = ${decision.decision}
        where id = ${candidateId}
      `;

      await scaffold.client`
        update memory_candidates
        set metadata = metadata || '{"unexpectedAuthority":true}'::jsonb
        where id = ${candidateId}
      `;
      await expect(scaffold.memoryRepository.proposeReviewedHelpedMemoryCandidateOnce(input))
        .rejects.toMatchObject({ reason: "existing_candidate_identity_conflict" });
      await scaffold.client`
        update memory_candidates
        set metadata = metadata - 'unexpectedAuthority'
        where id = ${candidateId}
      `;

      await scaffold.client`
        update memory_candidates set is_user_preference = true where id = ${candidateId}
      `;
      await expect(scaffold.memoryRepository.proposeReviewedHelpedMemoryCandidateOnce(input))
        .rejects.toMatchObject({ reason: "existing_candidate_identity_conflict" });
      await scaffold.client`
        update memory_candidates set is_user_preference = false where id = ${candidateId}
      `;

      await expect(scaffold.client`delete from review_assessments where id = ${acceptedReview.id}`)
        .rejects.toThrow();
      await expect(scaffold.client`delete from feedback_deltas where id = ${feedback.id}`)
        .rejects.toThrow();
      await expect(scaffold.client`delete from usefulness_applications where application_id = ${applicationId}`)
        .rejects.toThrow();

      const legacyCandidate = await scaffold.memoryRepository.createMemoryCandidate({
        projectId: scaffold.project.id,
        executionRunId: executionRun.id,
        feedbackDeltaId: feedback.id,
        proposedBy: "legacy-reviewed-helped-path",
        kind: concurrent[0]!.candidate.kind,
        summary: decision.decision,
        body: decision.rationale,
        owner: concurrent[0]!.candidate.owner,
        confidence: 92,
        applicationGuidance: decision.decision,
        invalidationRule: decision.falsifier,
        sourceClaimIds: [claim.id],
        sourceLineage: [{ sourceId: claim.id }],
        isUserPreference: false,
        validFrom: appliedAt,
        metadata: {
          smokeId: marker,
          usefulnessApplicationId: applicationId,
          sourceDecisionId: decision.id,
          reviewAssessmentId: acceptedReview.id,
          reflectionCandidateEvidence: {
            provenance: "feedback_delta",
            evidenceRefs: [`review-assessment:${acceptedReview.id}`],
            doesNotProve: "Legacy metadata does not establish first-class authority."
          }
        }
      });
      const legacyPromotion = await promoteMemoryCandidateThroughGate({
        memoryRepository: scaffold.memoryRepository,
        sourceRepository: scaffold.sourceRepository,
        review: {
          candidateId: legacyCandidate.id,
          reviewer: "legacy-independent-reviewer",
          evidenceReviewedRef: `review-assessment:${acceptedReview.id}`,
          metadata: { smokeId: marker, promotionBasis: "legacy_reviewed_helped" }
        }
      });
      const reviewedLegacyCandidate = await scaffold.memoryRepository.getMemoryCandidateById(
        legacyCandidate.id
      );
      if (reviewedLegacyCandidate === undefined) {
        throw new Error("reviewed legacy candidate was not readable");
      }
      const [upgradeBundle] = await scaffold.client<{ id: string }[]>`
        insert into evidence_bundles (
          execution_run_id, status, changed_files, commands, diff_risk,
          review_burden, rollback_path, capture_identity, capture_channel, metadata
        ) values (
          ${executionRun.id}, 'captured', '[]'::jsonb, '[]'::jsonb, 'low',
          'Review exact legacy predecessor authority.', 'Do not apply the revision.',
          ${`authority-upgrade:${marker}`}, 'evidence_feedback_v1',
          ${JSON.stringify({ smokeId: marker })}::jsonb
        ) returning id::text as id
      `;
      if (upgradeBundle === undefined) {
        throw new Error("authority upgrade evidence bundle was not persisted");
      }
      const { reviewAssessment: upgradeReview } =
        await scaffold.harnessRunRepository.createReviewFeedbackOnce({
          evidenceBundleId: upgradeBundle.id,
          requestIdentity: `authority-upgrade-review:${marker}`,
          review: {
            status: "accepted",
            reviewer: "independent-reviewer",
            summary: "The exact legacy predecessor projection is approved for authority upgrade.",
            findings: [],
            metadata: {
              smokeId: marker,
              authorityUpgradeMemoryRecordId: legacyPromotion.memoryRecord.id,
              authorityUpgradeMemoryCandidateId: reviewedLegacyCandidate.id,
              authorityUpgradePredecessorFingerprint: memoryAuthorityPredecessorFingerprint({
                candidate: reviewedLegacyCandidate,
                memoryRecord: legacyPromotion.memoryRecord
              })
            }
          },
          feedback: {
            status: "candidate",
            memoryCandidates: [],
            sourceDecisions: [],
            evalCandidates: [],
            metadata: { smokeId: marker, memoryRecordMutation: "none" }
          }
        });
      const forgedLegacyCandidate = await scaffold.memoryRepository.createMemoryCandidate({
        projectId: scaffold.project.id,
        executionRunId: executionRun.id,
        feedbackDeltaId: feedback.id,
        proposedBy: "forged-legacy-predecessor",
        kind: concurrent[0]!.candidate.kind,
        summary: decision.decision,
        body: "Altered content must not substitute the canonical legacy predecessor.",
        owner: concurrent[0]!.candidate.owner,
        confidence: 90,
        applicationGuidance: decision.decision,
        invalidationRule: decision.falsifier,
        sourceClaimIds: [claim.id],
        sourceLineage: [{ sourceId: claim.id }],
        isUserPreference: false,
        validFrom: appliedAt,
        metadata: {
          smokeId: marker,
          usefulnessApplicationId: applicationId,
          sourceDecisionId: decision.id,
          reviewAssessmentId: acceptedReview.id,
          reflectionCandidateEvidence: {
            provenance: "feedback_delta",
            evidenceRefs: [`review-assessment:${acceptedReview.id}`],
            doesNotProve: "Copied authority IDs do not establish canonical legacy content."
          }
        }
      });
      const revisionReview = {
        candidateId,
        reviewer: "independent-reviewer",
        evidenceReviewedRef: `review-assessment:${upgradeReview.id}`,
        metadata: { promotionBasis: "reviewed_exact_helped" }
      };
      await scaffold.client`
        update memory_records set status = 'invalidated'
        where id = ${legacyPromotion.memoryRecord.id}
      `;
      const forgedLegacyPromotion = await promoteMemoryCandidateThroughGate({
        memoryRepository: scaffold.memoryRepository,
        sourceRepository: scaffold.sourceRepository,
        review: {
          candidateId: forgedLegacyCandidate.id,
          reviewer: "forged-legacy-reviewer",
          evidenceReviewedRef: `review-assessment:${acceptedReview.id}`,
          metadata: { smokeId: marker, promotionBasis: "forged_legacy_predecessor" }
        }
      });
      await expect(applyReviewedHelpedAuthorityUpgradeThroughGate({
        memoryRepository: scaffold.memoryRepository,
        sourceRepository: scaffold.sourceRepository,
        review: revisionReview,
        sourceMemoryRecordId: forgedLegacyPromotion.memoryRecord.id,
        reason: "Reject sole active same-authority altered predecessor"
      })).rejects.toThrow("failed coordinates: predecessor_review");
      expect(await scaffold.memoryRepository.getMemoryCandidateById(candidateId))
        .toMatchObject({ status: "proposed" });
      await scaffold.client`
        update memory_records set status = 'invalidated'
        where id = ${forgedLegacyPromotion.memoryRecord.id}
      `;
      await scaffold.client`
        update memory_records set status = 'active'
        where id = ${legacyPromotion.memoryRecord.id}
      `;
      const raceLegacyCandidate = await scaffold.memoryRepository.createMemoryCandidate({
        projectId: scaffold.project.id,
        executionRunId: executionRun.id,
        feedbackDeltaId: feedback.id,
        proposedBy: "concurrent-forged-legacy-predecessor",
        kind: concurrent[0]!.candidate.kind,
        summary: decision.decision,
        body: "A queued altered predecessor must not survive the authority transaction.",
        owner: concurrent[0]!.candidate.owner,
        confidence: 90,
        applicationGuidance: decision.decision,
        invalidationRule: decision.falsifier,
        sourceClaimIds: [claim.id],
        sourceLineage: [{ sourceId: claim.id }],
        isUserPreference: false,
        validFrom: appliedAt,
        metadata: {
          smokeId: marker,
          usefulnessApplicationId: applicationId,
          sourceDecisionId: decision.id,
          reviewAssessmentId: acceptedReview.id,
          reflectionCandidateEvidence: {
            provenance: "feedback_delta",
            evidenceRefs: [`review-assessment:${acceptedReview.id}`],
            doesNotProve: "Queued copied authority IDs do not establish predecessor authority."
          }
        }
      });
      await scaffold.client`
        update memory_record_versions set owner = 'corrupt-legacy-version-owner'
        where id = ${legacyPromotion.memoryRecord.currentVersionId}
      `;
      await expect(applyReviewedHelpedAuthorityUpgradeThroughGate({
        memoryRepository: scaffold.memoryRepository,
        sourceRepository: scaffold.sourceRepository,
        review: revisionReview,
        sourceMemoryRecordId: legacyPromotion.memoryRecord.id,
        reason: "Reject malformed legacy version projection"
      })).rejects.toThrow(
        "authority upgrade requires matching legacy feedback and application lineage"
      );
      await scaffold.client`
        update memory_record_versions set owner = ${legacyCandidate.owner}
        where id = ${legacyPromotion.memoryRecord.currentVersionId}
      `;
      const [authorityBackend] = await scaffold.client<{ pid: number }[]>`
        select pg_backend_pid()::int as pid
      `;
      const [legacyBackend] = await retryClient<{ pid: number }[]>`
        select pg_backend_pid()::int as pid
      `;
      if (authorityBackend === undefined || legacyBackend === undefined) {
        throw new Error("authority upgrade race backend identities were not available");
      }
      let markAuthorityLockAcquired = (): void => {};
      const authorityLockRelease = new Promise<void>((resolve) => {
        releaseAuthorityLock = resolve;
      });
      const authorityLockAcquired = new Promise<void>((resolve) => {
        markAuthorityLockAcquired = resolve;
      });
      const lockKey = `memory-feedback-authority:${scaffold.project.id}:${feedback.id}`;
      const heldLock = lockClient.begin(async (tx) => {
        await tx`select pg_advisory_xact_lock(hashtextextended(${lockKey}, 0))`;
        markAuthorityLockAcquired();
        await authorityLockRelease;
      });
      await authorityLockAcquired;
      const promotionPromise = applyReviewedHelpedAuthorityUpgradeThroughGate({
        memoryRepository: scaffold.memoryRepository,
        sourceRepository: scaffold.sourceRepository,
        review: revisionReview,
        sourceMemoryRecordId: legacyPromotion.memoryRecord.id,
        reason: "Replace legacy helped memory with first-class authority bindings"
      });
      await waitForBackendTableLock(observerClient, authorityBackend.pid);
      const forgedPromotionPromise = retryRepository.promoteReviewedMemoryCandidate({
        candidateId: raceLegacyCandidate.id,
        reviewer: "forged-legacy-reviewer",
        decision: "accepted",
        metadata: { smokeId: marker, promotionBasis: "forged_legacy_predecessor" }
      });
      await waitForBackendTableLock(observerClient, legacyBackend.pid);
      releaseAuthorityLock();
      await heldLock;
      const promotion = await promotionPromise;
      await expect(forgedPromotionPromise).rejects.toThrow(
        "already has active memory; use the reviewed authority upgrade path"
      );
      expect(await scaffold.memoryRepository.getMemoryCandidateById(raceLegacyCandidate.id))
        .toMatchObject({ status: "proposed" });
      expect(await scaffold.memoryRepository.getMemoryCandidateById(candidateId))
        .toMatchObject({ revisionReviewAssessmentId: upgradeReview.id });
      await expect(scaffold.client`
        delete from evidence_bundles where id = ${upgradeBundle.id}
      `).rejects.toThrow();
      const retry = await applyReviewedHelpedAuthorityUpgradeThroughGate({
        memoryRepository: retryRepository,
        sourceRepository: scaffold.sourceRepository,
        review: revisionReview,
        sourceMemoryRecordId: legacyPromotion.memoryRecord.id,
        reason: "Replace legacy helped memory with first-class authority bindings"
      });
      await scaffold.client`
        update memory_records set current_version_id = null
        where id = ${legacyPromotion.memoryRecord.id}
      `;
      await expect(applyReviewedHelpedAuthorityUpgradeThroughGate({
        memoryRepository: scaffold.memoryRepository,
        sourceRepository: scaffold.sourceRepository,
        review: revisionReview,
        sourceMemoryRecordId: legacyPromotion.memoryRecord.id,
        reason: "Replace legacy helped memory with first-class authority bindings"
      })).rejects.toThrow("identity conflict for accepted candidate");
      await scaffold.client`
        update memory_records set current_version_id = ${legacyPromotion.memoryRecord.currentVersionId}
        where id = ${legacyPromotion.memoryRecord.id}
      `;
      await scaffold.client`
        update memory_records set current_version_id = null
        where id = ${promotion.memoryRecord.id}
      `;
      await expect(applyReviewedHelpedAuthorityUpgradeThroughGate({
        memoryRepository: scaffold.memoryRepository,
        sourceRepository: scaffold.sourceRepository,
        review: revisionReview,
        sourceMemoryRecordId: legacyPromotion.memoryRecord.id,
        reason: "Replace legacy helped memory with first-class authority bindings"
      })).rejects.toThrow("identity conflict for accepted candidate");
      await scaffold.client`
        update memory_records set current_version_id = ${promotion.memoryRecord.currentVersionId}
        where id = ${promotion.memoryRecord.id}
      `;
      const supersededAt = promotion.supersededMemoryRecord.invalidatedAt;
      if (supersededAt === undefined) {
        throw new Error("authority upgrade did not return supersession time");
      }
      await scaffold.client`
        update memory_records
        set metadata = jsonb_set(
          metadata,
          '{supersessionReview,supersededAt}',
          ${JSON.stringify("1900-01-01T00:00:00.000Z")}::jsonb
        )
        where id = ${legacyPromotion.memoryRecord.id}
      `;
      await expect(applyReviewedHelpedAuthorityUpgradeThroughGate({
        memoryRepository: scaffold.memoryRepository,
        sourceRepository: scaffold.sourceRepository,
        review: revisionReview,
        sourceMemoryRecordId: legacyPromotion.memoryRecord.id,
        reason: "Replace legacy helped memory with first-class authority bindings"
      })).rejects.toThrow("identity conflict for accepted candidate");
      await scaffold.client`
        update memory_records
        set metadata = jsonb_set(
          metadata,
          '{supersessionReview,supersededAt}',
          ${JSON.stringify(supersededAt)}::jsonb
        ), invalidated_at = null
        where id = ${legacyPromotion.memoryRecord.id}
      `;
      await expect(applyReviewedHelpedAuthorityUpgradeThroughGate({
        memoryRepository: scaffold.memoryRepository,
        sourceRepository: scaffold.sourceRepository,
        review: revisionReview,
        sourceMemoryRecordId: legacyPromotion.memoryRecord.id,
        reason: "Replace legacy helped memory with first-class authority bindings"
      })).rejects.toThrow("identity conflict for accepted candidate");
      await scaffold.client`
        update memory_records set invalidated_at = ${supersededAt}
        where id = ${legacyPromotion.memoryRecord.id}
      `;
      await scaffold.client`
        update memory_records set metadata = metadata - 'usefulnessApplicationId'
        where id = ${legacyPromotion.memoryRecord.id}
      `;
      await expect(applyReviewedHelpedAuthorityUpgradeThroughGate({
        memoryRepository: scaffold.memoryRepository,
        sourceRepository: scaffold.sourceRepository,
        review: revisionReview,
        sourceMemoryRecordId: legacyPromotion.memoryRecord.id,
        reason: "Replace legacy helped memory with first-class authority bindings"
      })).rejects.toThrow("identity conflict for accepted candidate");
      await scaffold.client`
        update memory_records set metadata = jsonb_set(
          metadata,
          '{usefulnessApplicationId}',
          ${JSON.stringify(applicationId)}::jsonb
        )
        where id = ${legacyPromotion.memoryRecord.id}
      `;
      await expect(applyReviewedHelpedAuthorityUpgradeThroughGate({
        memoryRepository: scaffold.memoryRepository,
        sourceRepository: scaffold.sourceRepository,
        review: revisionReview,
        sourceMemoryRecordId: legacyPromotion.memoryRecord.id,
        reason: "A different retry reason"
      })).rejects.toThrow("identity conflict for accepted candidate");
      const postPromotionRetry = await scaffold.memoryRepository
        .proposeReviewedHelpedMemoryCandidateOnce(input);
      const acceptedAuthorityCandidate = await scaffold.memoryRepository.getMemoryCandidateById(
        candidateId
      );
      if (acceptedAuthorityCandidate === undefined) {
        throw new Error("accepted authority candidate was not readable");
      }
      await scaffold.client`
        update memory_candidates
        set metadata = metadata - 'memoryRevision' - 'revisionReview'
        where id = ${candidateId}
      `;
      await expect(scaffold.memoryRepository.proposeReviewedHelpedMemoryCandidateOnce(input))
        .rejects.toMatchObject({ reason: "existing_candidate_identity_conflict" });
      await scaffold.client`
        update memory_candidates set metadata = ${JSON.stringify(acceptedAuthorityCandidate.metadata)}::jsonb
        where id = ${candidateId}
      `;
      const selected = await scaffold.memoryRepository.listActiveMemory(
        scaffold.project.id,
        5,
        { terms: ["store-validated", "reviewed", "helped"] }
      );
      const legacyReadback = await scaffold.memoryRepository.getMemoryRecordById(
        legacyPromotion.memoryRecord.id
      );

      expect(retry.memoryRecord.id).toBe(promotion.memoryRecord.id);
      expect(retry.supersededMemoryRecord.id).toBe(legacyPromotion.memoryRecord.id);
      expect(legacyReadback).toMatchObject({
        status: "superseded",
        metadata: { replacementMemoryRecordId: promotion.memoryRecord.id }
      });
      expect(postPromotionRetry).toMatchObject({
        created: false,
        candidate: { id: candidateId, status: "accepted" }
      });
      expect(promotion.reviewedSourceClaims.map((item) => item.id)).toEqual([claim.id]);
      expect(selected.map((item) => item.id)).toContain(promotion.memoryRecord.id);
      expect(selected.map((item) => item.id)).not.toContain(legacyPromotion.memoryRecord.id);
    } finally {
      releaseAuthorityLock();
      await scaffold.cleanup();
      await Promise.all([
        scaffold.client.end(),
        retryClient.end(),
        lockClient.end(),
        observerClient.end()
      ]);
    }
  });

  postgresIt("retains the most task-relevant active memory before the bounded limit", async () => {
    const marker = `krn_memory_relevance_${crypto.randomUUID().replaceAll("-", "")}`;
    const scaffold = await createSmokeHarnessScaffold({
      databaseUrl: databaseUrl!,
      migrationsFolder,
      smokeId: marker,
      smokeName: "memory relevance prelimit",
      workspacePrefix: "krn-memory-relevance-prelimit",
      projectSlug: "memory-relevance-prelimit",
      cleanupRows: cleanupActivationSmokeRows,
      countMarkerRows: countActivationSmokeMarkerRows,
      rawIntent: `memory relevance prelimit ${marker}`,
      taskContract: {
        title: "Retain the best task-relevant memory before the limit",
        objective: "Select an all-term match ahead of one-term distractors.",
        constraints: ["bounded PostgreSQL query"],
        nonGoals: ["prove globally optimal semantic ranking"],
        acceptance: ["the position-26 all-term record is selected"]
      },
      harnessPlan: {
        summary: "Memory relevance prelimit",
        nextAction: "Compare deterministic lexical relevance before counters."
      }
    });

    try {
      const relevant = await scaffold.memoryRepository.createMemoryRecord({
        projectId: scaffold.project.id,
        key: `memory:position-26:all-terms:${marker}`,
        kind: "constraint",
        status: "active",
        summary: "position-26 task-relevant memory",
        body: "This record matches every bounded retrieval term.",
        owner: "kernel",
        confidence: 90,
        applicationGuidance: "Use for the position-26 relevance boundary.",
        invalidationRule: "Remove after the repository test.",
        sourceLineage: [{ sourceId: `source:${marker}:relevant` }],
        isUserPreference: false,
        metadata: { smokeId: marker, position26: true }
      });
      const distractors = await Promise.all(Array.from({ length: 25 }, async (_, index) =>
        scaffold.memoryRepository.createMemoryRecord({
          projectId: scaffold.project.id,
          key: `memory:position-26:distractor:${index}:${marker}`,
          kind: "constraint",
          status: "active",
          summary: `position-26 generic distractor ${index}`,
          body: "This record matches only the common retrieval term.",
          owner: "kernel",
          confidence: 90,
          applicationGuidance: "Do not select over the all-term match.",
          invalidationRule: "Remove after the repository test.",
          sourceLineage: [{ sourceId: `source:${marker}:distractor:${index}` }],
          isUserPreference: false,
          metadata: { smokeId: marker, position26: false }
        })
      ));
      await scaffold.db
        .update(memoryRecords)
        .set({ positiveFeedbackCount: 1 })
        .where(inArray(memoryRecords.id, distractors.map((record) => record.id)));

      const selected = await scaffold.memoryRepository.listActiveMemory(
        scaffold.project.id,
        1,
        { terms: ["position-26", "task-relevant", "bounded"] }
      );

      expect(
        selected.map((record) => record.id),
        `expected ${relevant.id}; returned ${selected.map((record) => record.id).join(",")}`
      ).toEqual([relevant.id]);
    } finally {
      await scaffold.cleanup();
      await scaffold.client.end();
    }
  });

  postgresIt("serializes counter rebuild with a concurrent memory application", async () => {
    const marker = `krn_counter_rebuild_race_${crypto.randomUUID().replaceAll("-", "")}`;
    const scaffold = await createSmokeHarnessScaffold({
      databaseUrl: databaseUrl!,
      migrationsFolder,
      smokeId: marker,
      smokeName: "memory counter rebuild race",
      workspacePrefix: "krn-counter-rebuild-race",
      projectSlug: "counter-rebuild-race",
      cleanupRows: cleanupActivationSmokeRows,
      countMarkerRows: countActivationSmokeMarkerRows,
      rawIntent: `memory counter rebuild race ${marker}`,
      taskContract: {
        title: "Falsify memory counter rebuild races",
        objective: "Keep a committed application visible after counter reconciliation.",
        constraints: ["two PostgreSQL connections"],
        nonGoals: ["measure throughput"],
        acceptance: ["counter equals canonical applications at one serialized snapshot"]
      },
      harnessPlan: {
        summary: "Memory counter rebuild race",
        nextAction: "Interleave one application after classification."
      }
    });
    const writerClient = postgres(databaseUrl!, { max: 1 });
    const observerClient = postgres(databaseUrl!, { max: 1 });
    const writerDb = createKrnDatabase(writerClient);
    let releaseRebuild = (): void => undefined;
    let reportClassified = (): void => undefined;
    const rebuildClassified = new Promise<void>((resolve) => {
      reportClassified = resolve;
    });
    const allowRebuildPersist = new Promise<void>((resolve) => {
      releaseRebuild = resolve;
    });

    try {
      const executionRun = await scaffold.harnessRunRepository.createExecutionRun({
        harnessPlanId: scaffold.harnessPlan.id,
        adapter: "counter-rebuild-race",
        status: "planned",
        metadata: { smokeId: marker }
      });
      const memoryRecord = await scaffold.memoryRepository.createMemoryRecord({
        projectId: scaffold.project.id,
        key: `memory:counter-rebuild-race:${marker}`,
        kind: "constraint",
        status: "active",
        summary: "Counter rebuild race target",
        body: "A committed hurt application must remain counted after reconciliation.",
        owner: "kernel",
        confidence: 90,
        applicationGuidance: "Use only for the counter rebuild race test.",
        invalidationRule: "Remove after the race test.",
        sourceLineage: [{ sourceId: `source:${marker}` }],
        isUserPreference: false,
        metadata: { smokeId: marker }
      });
      const rankingPeerInputs = [
        { key: "newer", updatedAt: new Date("2026-07-14T06:00:00.000Z") },
        { key: "older", updatedAt: new Date("2026-07-13T06:00:00.000Z") }
      ] as const;
      const rankingPeers = await Promise.all(rankingPeerInputs.map(({ key }) =>
        scaffold.memoryRepository.createMemoryRecord({
          projectId: scaffold.project.id,
          key: `memory:counter-rebuild-race:${key}:${marker}`,
          kind: "constraint",
          status: "active",
          summary: `Counter rebuild ranking peer ${key}`,
          body: "Counter-only repair must not rewrite semantic recency.",
          owner: "kernel",
          confidence: 80,
          applicationGuidance: "Use only for the counter rebuild ordering test.",
          invalidationRule: "Remove after the ordering test.",
          sourceLineage: [{ sourceId: `source:${marker}` }],
          isUserPreference: false,
          metadata: { smokeId: marker, rankingPeer: key }
        })
      ));
      await Promise.all(rankingPeers.map((peer, index) => scaffold.db
        .update(memoryRecords)
        .set({ updatedAt: rankingPeerInputs[index]!.updatedAt })
        .where(eq(memoryRecords.id, peer.id))));
      const beforeRebuildPeers = await Promise.all(rankingPeers.map((peer) =>
        scaffold.memoryRepository.getMemoryRecordById(peer.id)
      ));
      const beforeRebuildOrder = (await scaffold.memoryRepository
        .listActiveMemory(scaffold.project.id, 100))
        .filter((record) => rankingPeers.some((peer) => peer.id === record.id))
        .map((record) => record.id);
      const rebuildRepository = new DrizzleMemoryRepository(scaffold.db, {
        beforeCounterRebuildPersist: async () => {
          reportClassified();
          await allowRebuildPersist;
        }
      });
      const rebuild = rebuildRepository.rebuildMemoryApplicationCounters();
      await rebuildClassified;

      const [{ pid: writerBackendPid }] = await writerClient<{ pid: number }[]>`
        select pg_backend_pid()::int as pid
      `;
      const writer = writerDb.transaction(async (tx) => {
        await tx.insert(memoryApplications).values({
          memoryRecordId: memoryRecord.id,
          executionRunId: executionRun.id,
          decisionPacketChecksum: "a".repeat(64),
          expectedUse: "Falsify a stale counter snapshot.",
          outcome: "hurt",
          notes: "Committed after rebuild classification.",
          metadata: {
            smokeId: marker,
            decisionPacketChecksum: "a".repeat(64),
            decisionPacketGeneratedAt: "2026-07-15T06:00:00.000Z",
            decisionPacketSourceRunLifecycleRevision: 1,
            memoryApplicationRequestFingerprint: "race-fingerprint"
          }
        });
        await tx
          .update(memoryRecords)
          .set({
            negativeFeedbackCount: sql`${memoryRecords.negativeFeedbackCount} + 1`,
            updatedAt: new Date()
          })
          .where(eq(memoryRecords.id, memoryRecord.id));
      });
      await waitForBackendTableLock(observerClient, writerBackendPid);

      releaseRebuild();
      await Promise.all([rebuild, writer]);

      const afterRebuild = await scaffold.memoryRepository.getMemoryRecordById(memoryRecord.id);
      const afterRebuildPeers = await Promise.all(rankingPeers.map((peer) =>
        scaffold.memoryRepository.getMemoryRecordById(peer.id)
      ));
      const afterRebuildOrder = (await scaffold.memoryRepository
        .listActiveMemory(scaffold.project.id, 100))
        .filter((record) => rankingPeers.some((peer) => peer.id === record.id))
        .map((record) => record.id);
      expect(afterRebuild?.negativeFeedbackCount).toBe(1);
      expect(afterRebuildPeers.map((peer) => peer?.updatedAt))
        .toEqual(beforeRebuildPeers.map((peer) => peer?.updatedAt));
      expect(afterRebuildOrder).toEqual(beforeRebuildOrder);

      const faultRepository = new DrizzleMemoryRepository(scaffold.db, {
        faultAfterCounterRebuildReset: () => {
          throw new Error("fault:after_counter_rebuild_reset");
        }
      });
      await expect(faultRepository.rebuildMemoryApplicationCounters())
        .rejects.toThrow("fault:after_counter_rebuild_reset");
      const afterFault = await scaffold.memoryRepository.getMemoryRecordById(memoryRecord.id);
      expect(afterFault).toMatchObject({
        negativeFeedbackCount: afterRebuild?.negativeFeedbackCount,
        updatedAt: afterRebuild?.updatedAt
      });
    } finally {
      releaseRebuild();
      await scaffold.cleanup();
      await Promise.all([scaffold.client.end(), writerClient.end(), observerClient.end()]);
    }
  });

  it("orders active memory before limit by negative feedback, positive feedback, then recency", () => {
    const order = activeMemorySelectionOrder();

    expect(order.map(orderColumnName)).toEqual([
      "negative_feedback_count",
      "positive_feedback_count",
      "updated_at",
      "id"
    ]);
    expect(order.map(orderDirection)).toEqual([
      "asc",
      "desc",
      "desc",
      "asc"
    ]);
  });

  it("accepts governed memory core inputs with lineage and guidance", () => {
    expect(() => assertMemoryCoreInvariants({
      summary: "Reviewed memory summary",
      body: "Reviewed memory body.",
      owner: "kernel",
      confidence: 90,
      applicationGuidance: "Use only for governed memory tests.",
      invalidationRule: "Revisit when governance changes.",
      sourceLineage: [{ sourceId: "source-claim-1" }],
      validFrom: "2026-06-22T00:00:00.000Z",
      validUntil: "2026-07-22T00:00:00.000Z"
    }, "Memory record")).not.toThrow();
  });

  it("rejects missing source lineage, owner, guidance, and bad confidence", () => {
    const valid = {
      summary: "Reviewed memory summary",
      body: "Reviewed memory body.",
      owner: "kernel",
      confidence: 90,
      applicationGuidance: "Use only for governed memory tests.",
      sourceLineage: [{ sourceId: "source-claim-1" }]
    };

    expect(() => assertMemoryCoreInvariants({
      ...valid,
      sourceLineage: []
    }, "Memory record")).toThrow("Memory record requires source lineage");
    expect(() => assertMemoryCoreInvariants({
      ...valid,
      owner: " "
    }, "Memory record")).toThrow("Memory record requires owner");
    expect(() => assertMemoryCoreInvariants({
      ...valid,
      applicationGuidance: ""
    }, "Memory record")).toThrow("Memory record requires application guidance");
    expect(() => assertMemoryCoreInvariants({
      ...valid,
      confidence: 101
    }, "Memory record")).toThrow("Memory record confidence must be an integer from 0 to 100");
  });

  it("requires validity and invalidation strategy for temporal memory", () => {
    const temporal = {
      summary: "Temporal memory summary",
      body: "Temporal memory body.",
      owner: "kernel",
      confidence: 80,
      applicationGuidance: "Use until stale.",
      sourceLineage: [{ sourceId: "source-claim-1" }],
      validUntil: "2026-06-22T00:00:00.000Z"
    };

    expect(() => assertMemoryCoreInvariants(temporal, "Memory record"))
      .toThrow("Memory record with validUntil requires validFrom");
    expect(() => assertMemoryCoreInvariants({
      ...temporal,
      validFrom: "2026-06-21T00:00:00.000Z"
    }, "Memory record")).toThrow("Memory record with validUntil requires invalidation rule");
    expect(() => assertMemoryCoreInvariants({
      ...temporal,
      validFrom: "2026-06-23T00:00:00.000Z",
      invalidationRule: "Revisit when stale."
    }, "Memory record")).toThrow("Memory record validUntil must be after validFrom");
  });

  it("accepts reviewed anti-memory candidate inputs with lineage", () => {
    expect(() => assertAntiMemoryCandidateInvariants({
      key: "anti-markdown-runtime-memory",
      summary: "Do not treat markdown as runtime memory.",
      body: "Markdown may be source/export, not Memory Core.",
      owner: "operator",
      confidence: 90,
      invalidatedBySourceClaimIds: ["source-claim-1"],
      sourceLineage: [{ sourceId: "source-claim-1" }],
      validFrom: "2026-06-22T00:00:00.000Z",
      validUntil: "2026-07-22T00:00:00.000Z"
    }, "Anti-memory candidate")).not.toThrow();

    expect(() => assertAntiMemoryCandidateInvariants({
      key: "anti-markdown-runtime-memory",
      summary: "Do not treat markdown as runtime memory.",
      body: "Markdown may be source/export, not Memory Core.",
      owner: "operator",
      confidence: 90,
      sourceLineage: []
    }, "Anti-memory candidate")).toThrow(
      "Anti-memory candidate requires invalidating source claim or source lineage"
    );
  });

  it("rejects ungoverned anti-memory record inputs", () => {
    const valid = {
      key: "anti-markdown-runtime-memory",
      summary: "Do not treat markdown as runtime memory.",
      body: "Markdown may be source/export, not Memory Core.",
      owner: "operator",
      confidence: 90,
      sourceLineage: [{ sourceId: "source-claim-1" }]
    };

    expect(() => assertAntiMemoryCandidateInvariants(
      {
        ...valid,
        confidence: -1
      },
      "Anti-memory record"
    )).toThrow("Anti-memory record confidence must be an integer from 0 to 100");
    expect(() => assertAntiMemoryCandidateInvariants(
      {
        ...valid,
        sourceLineage: []
      },
      "Anti-memory record"
    )).toThrow(
      "Anti-memory record requires invalidating source claim or source lineage"
    );
  });

  it("preserves review gate metadata when promoting a candidate", () => {
    const metadata = memoryPromotionMetadata({
      id: "memory-candidate-1",
      projectId: "project-1",
      executionRunId: "execution-run-1",
      proposedBy: "reflection",
      kind: "constraint",
      status: "candidate",
      summary: "Use Postgres edge tables first",
      body: "Use Postgres edge tables first.",
      owner: "operator",
      confidence: 80,
      applicationGuidance: "Use when evaluating graph DB proposals.",
      invalidationRule: "Revisit when graph traversal exceeds Postgres limits.",
      sourceClaimIds: ["source-claim-1"],
      sourceLineage: [{ sourceId: "source-claim-1" }],
      isUserPreference: false,
      validFrom: "2026-06-23T00:00:00.000Z",
      metadata: {
        candidateNote: "from reflection"
      },
      createdAt: "2026-06-23T00:00:00.000Z",
      updatedAt: "2026-06-23T00:00:00.000Z"
    }, {
      candidateId: "memory-candidate-1",
      reviewer: "operator",
      decision: "accepted",
      metadata: {
        reviewGate: {
          evidenceReviewedRef: "raw-evidence:run-event-1"
        }
      }
    });

    expect(metadata).toMatchObject({
      candidateNote: "from reflection",
      createdFromCandidateId: "memory-candidate-1",
      sourceClaimIds: ["source-claim-1"],
      reviewGate: {
        evidenceReviewedRef: "raw-evidence:run-event-1"
      }
    });
  });

  it("preserves anti-memory review gate metadata when promoting a candidate", () => {
    const metadata = antiMemoryPromotionMetadata({
      id: "anti-memory-candidate-1",
      projectId: "project-1",
      executionRunId: "execution-run-1",
      proposedBy: "reflection",
      key: "anti-markdown-runtime-memory",
      status: "candidate",
      rejectedClaim: "Markdown files are runtime memory",
      reason: "Memory Core is store-backed.",
      invalidatedBySourceClaimIds: ["source-claim-1"],
      sourceLineage: [{ sourceId: "source-claim-1" }],
      summary: "Do not treat markdown as runtime memory.",
      body: "Markdown may be source/export, not Memory Core.",
      owner: "operator",
      confidence: 90,
      validFrom: "2026-06-23T00:00:00.000Z",
      metadata: {
        candidateNote: "from reflection"
      },
      createdAt: "2026-06-23T00:00:00.000Z",
      updatedAt: "2026-06-23T00:00:00.000Z"
    }, {
      candidateId: "anti-memory-candidate-1",
      reviewer: "operator",
      decision: "accepted",
      metadata: {
        reviewGate: {
          evidenceReviewedRef: "source-claim-1"
        }
      }
    });

    expect(metadata).toMatchObject({
      candidateNote: "from reflection",
      createdFromCandidateId: "anti-memory-candidate-1",
      invalidatedBySourceClaimIds: ["source-claim-1"],
      reviewGate: {
        evidenceReviewedRef: "source-claim-1"
      }
    });
  });
});
