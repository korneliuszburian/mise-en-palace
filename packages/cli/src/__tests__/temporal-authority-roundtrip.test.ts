import crypto from "node:crypto";

import postgres from "postgres";
import { describe, expect, it } from "vitest";
import { compileHarnessPlan } from "@krn/harness";
import type { HarnessRunRepository, SourceClaim } from "@krn/core/repositories/internal";

import { createDatabaseRuntime } from "../database-runtime.js";

const databaseUrl = process.env.KRN_DATABASE_URL?.trim();
const now = "2026-07-18T12:00:00.000Z";

describe.skipIf(databaseUrl === undefined || databaseUrl.length === 0)(
  "persisted temporal authority to DecisionPacket roundtrip",
  () => {
    it("keeps historical and unsupported source claims out of active packet authority", async () => {
      const marker = `temporal-authority-roundtrip-${crypto.randomUUID()}`;
      const runtime = await createDatabaseRuntime({
        databaseUrl: databaseUrl!,
        workspaceSlug: marker,
        projectSlug: marker,
        now: () => now,
        createId: (prefix) => `${prefix}-${crypto.randomUUID()}`
      });
      const client = postgres(databaseUrl!, { max: 1, onnotice: () => undefined });

      try {
        const sourceRepository = runtime.sourceRepository;
        if (
          sourceRepository.createSourceChunk === undefined ||
          sourceRepository.createSourceRejection === undefined
        ) {
          throw new Error("Temporal authority roundtrip requires persisted source chunk and rejection seams");
        }
        const claimFor = async (label: string, input: {
          readonly status?: "proposed" | "accepted" | "rejected";
          readonly revisitWhen?: string;
        } = {}): Promise<SourceClaim> => {
          const metadata = {
            smokeId: marker,
            evidenceStatus: "captured",
            evidenceFreshness: "current",
            evidenceContentHash: `sha256:${marker}:${label}`
          };
          const artifact = await sourceRepository.createSourceArtifact({
            projectId: runtime.projectId,
            kind: "operator_input",
            sourceAuthority: "project-decision",
            uri: `temporal-authority://${marker}/${label}`,
            title: `Temporal authority ${label}`,
            contentHash: `temporal-authority-${marker}-${label}`,
            metadata
          });
          const chunk = await sourceRepository.createSourceChunk({
            sourceArtifactId: artifact.id,
            ordinal: 0,
            content: `Temporal authority fixture ${label}.`,
            contentHash: `temporal-authority-chunk-${marker}-${label}`,
            metadata
          });
          const claim = await sourceRepository.createSourceClaim({
            sourceArtifactId: artifact.id,
            ...(chunk === undefined ? {} : { sourceChunkId: chunk.id }),
            claim: `Temporal authority roundtrip ${label} for the governed packet.`,
            mechanism: "Persisted source authority is reconstructed during activation.",
            krnImplication: "Only supported current claims may guide a DecisionPacket.",
            doesNotProve: "This fixture does not prove source truth or broad consensus quality.",
            sourceAuthority: "project-decision",
            supportType: "implementation-boundary",
            consumer: "temporal authority roundtrip test",
            falsifier: "A historical or unsupported claim appears as current packet authority.",
            ...(input.revisitWhen === undefined ? {} : { revisitWhen: input.revisitWhen }),
            ...(input.status === undefined ? {} : { status: input.status }),
            metadata
          });

          return claim;
        };

        const current = await claimFor("current");
        const superseded = await claimFor("superseded");
        const stale = await claimFor("stale", {
          revisitWhen: "2026-07-01T00:00:00.000Z"
        });
        const unsupported = await claimFor("unsupported");
        const rejected = await claimFor("rejected", { status: "rejected" });

        const adopt = await sourceRepository.createSourceDecision({
          projectId: runtime.projectId,
          sourceClaimId: current.id,
          status: "adopt",
          decision: "Adopt current temporal authority fixture.",
          rationale: "Current captured evidence supports the governed claim.",
          falsifier: "The current claim becomes stale or superseded.",
          consumer: "temporal authority roundtrip test",
          metadata: { smokeId: marker }
        });
        await sourceRepository.createSourceDecision({
          projectId: runtime.projectId,
          sourceClaimId: superseded.id,
          status: "adopt",
          decision: "Adopt the historical fixture before supersession.",
          rationale: "The fixture needs an accepted predecessor for the supersession edge.",
          falsifier: "The current claim no longer supersedes this predecessor.",
          consumer: "temporal authority roundtrip test",
          metadata: { smokeId: marker }
        });
        await sourceRepository.createSourceDecisionEdge({
          sourceClaimId: current.id,
          sourceDecisionId: adopt.id,
          targetType: "architecture_decision",
          targetId: `temporal-authority:${marker}:current`,
          supportType: "implementation-boundary",
          confidence: "high",
          notes: "Current claim has explicit decision support.",
          metadata: {
            smokeId: marker,
            evidenceRef: `temporal-authority://${marker}/current`,
            consumer: "temporal authority roundtrip test",
            doesNotProve: "Decision support does not prove source truth."
          }
        });
        await sourceRepository.createSourceClaimEdge({
          fromSourceClaimId: current.id,
          toSourceClaimId: superseded.id,
          kind: "supersedes",
          metadata: {
            smokeId: marker,
            evidenceRef: `temporal-authority://${marker}/current`,
            consumer: "temporal authority roundtrip test",
            doesNotProve: "Supersession does not erase historical context."
          }
        });
        await sourceRepository.createSourceDecision({
          projectId: runtime.projectId,
          sourceClaimId: stale.id,
          status: "adopt",
          decision: "Adopt stale fixture before its revisit date.",
          rationale: "The fixture is intentionally stale at read time.",
          falsifier: "The stale claim is selected as current authority.",
          consumer: "temporal authority roundtrip test",
          metadata: { smokeId: marker }
        });
        await sourceRepository.createSourceRejection({
          projectId: runtime.projectId,
          sourceClaimId: rejected.id,
          title: "Rejected temporal authority fixture",
          attemptedClaim: rejected.claim,
          rejectedBecause: "unsupported",
          reason: "Rejected fixture must remain historical negative context.",
          doesNotProve: "Rejection does not prove the opposing claim true.",
          consumer: "temporal authority roundtrip test",
          metadata: { smokeId: marker }
        });

        const compiled = await compileHarnessPlan({
          workspaceId: runtime.workspaceId,
          projectId: runtime.projectId,
          operatorIntent: {
            source: "cli",
            rawIntent: "Use the current temporal authority roundtrip guidance."
          },
          taskContract: {
            title: "Use current temporal authority",
            objective: "Use the current temporal authority roundtrip guidance.",
            constraints: ["exclude stale, superseded, rejected, and unsupported claims"],
            nonGoals: ["do not infer source truth"],
            acceptance: ["only current supported authority guides the packet"],
            metadata: { smokeId: marker }
          },
          metadata: { smokeId: marker }
        }, {
          ...runtime.compilerDependencies,
          now: () => now
        });
        const executionRun = await (runtime.harnessRunRepository as HarnessRunRepository).createExecutionRun({
          harnessPlanId: compiled.harnessPlan.id,
          adapter: "codex",
          metadata: { smokeId: marker }
        });
        const issued = await (runtime.harnessRunRepository as HarnessRunRepository)
          .issueDecisionPacketForExecutionRun(executionRun.id);
        const readback = issued.packet;
        const timeline = readback.sourceConsensus.timeline;

        expect(timeline).toBeDefined();
        expect(timeline?.currentSourceClaimIds).toContain(current.id);
        expect(timeline?.supersededSourceClaimIds).toContain(superseded.id);
        expect(timeline?.staleSourceClaimIds).toContain(stale.id);
        expect(timeline?.rejectedSourceClaimIds).toContain(rejected.id);
        expect(timeline?.unknownSourceClaimIds).toContain(unsupported.id);
        expect(readback.sourceClaimIds).toContain(current.id);
        expect(readback.sourceClaimIds).not.toContain(superseded.id);
        expect(readback.sourceClaimIds).not.toContain(stale.id);
        expect(readback.sourceClaimIds).not.toContain(rejected.id);
        expect(readback.sourceClaimIds).not.toContain(unsupported.id);
        expect(readback.supersededPathIds).toContain(superseded.id);
        expect(readback.sourceConsensus.sourceRejectionIds.length).toBeGreaterThan(0);
        expect(readback.contextExclusions).toEqual(expect.arrayContaining([
          expect.objectContaining({ subjectType: "source_claim", subjectId: rejected.id })
        ]));
      } finally {
        await runtime.close();
        await client`delete from outbox_events where payload->>'smokeId' = ${marker}`;
        await client`delete from source_claim_edges where metadata->>'smokeId' = ${marker}`;
        await client`delete from source_decision_edges where metadata->>'smokeId' = ${marker}`;
        await client`delete from source_rejections where metadata->>'smokeId' = ${marker}`;
        await client`delete from source_decisions where metadata->>'smokeId' = ${marker}`;
        await client`delete from source_claims where metadata->>'smokeId' = ${marker}`;
        await client`delete from source_chunks where metadata->>'smokeId' = ${marker}`;
        await client`delete from source_artifacts where metadata->>'smokeId' = ${marker}`;
        await client`delete from projects where slug = ${marker}`;
        await client`delete from workspaces where slug = ${marker}`;
        await client.end();
      }
    });
  }
);
