import {
  describe,
  expect,
  it
} from "vitest";

import {
  buildDecisionPacketContractReadback,
  buildDecisionPacketFromReadModel,
  type DecisionPacketReadModelInput
} from "../decision-packet.js";

const now = "2026-07-08T14:45:00.000Z";

const fakeSha256Hex = (value: string): string => {
  let hash = 0;

  for (const char of value) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }

  return hash.toString(16).padStart(64, "0");
};

const readModel = {
  run: {
    id: "run-decision-packet-1",
    updatedAt: now
  },
  context: {
    inclusions: 3,
    exclusions: 2,
    inclusionDetails: [{
      subjectType: "source_claim",
      subjectId: "claim-current",
      sourceAuthority: "project-decision"
    }, {
      subjectType: "source_claim",
      subjectId: "claim-caveated",
      sourceAuthority: "medium"
    }, {
      subjectType: "memory_record",
      subjectId: "memory-current",
      sourceAuthority: "medium"
    }],
    activationTrace: {
      candidates: [{
        subjectType: "source_claim",
        subjectId: "claim-current",
        sourceDecisionSupportBoost: {
          sourceDecisionEdgeIds: ["source-decision-edge-current"]
        },
        projectStandardDecision: {
          kind: "krn.projectStandardDecision.v1",
          memoryRecordId: "memory-current",
          key: "frontend-template",
          sourceRefs: ["claim-current"],
          mechanism: "Accepted project standard narrows new frontend setup choices.",
          krnImplication: "DecisionPacket should tell Codex which template to use.",
          decision: "Use the current frontend template for matching app setup tasks.",
          consumer: "DecisionPacket",
          falsifier: "A matching app setup packet omits the current template decision.",
          validFrom: "2026-07-01T00:00:00.000Z",
          rejectedPath: "Do not use the superseded template.",
          doesNotProve: "Does not prove the template fits every frontend task."
        }
      }, {
        subjectType: "source_claim",
        subjectId: "claim-caveated"
      }],
      decisions: [{
        reason: "anti_memory_block",
        antiMemoryRecordId: "anti-memory-superseded-template"
      }]
    }
  },
  evidenceBundles: [{
    commands: [{
      command: "pnpm --filter frontend test"
    }]
  }],
  feedbackDeltas: [{
    candidates: [{
      kind: "source_decision_candidate",
      id: "source-decision-rejected",
      status: "reject"
    }],
    sourceUsefulnessOutcomes: [{
      sourceDecisionId: "source-decision-current",
      outcome: "helped",
      reason: "Current template reduced setup churn."
    }, {
      sourceDecisionId: "source-decision-stale",
      outcome: "stale",
      reason: "Old template no longer applies."
    }, {
      sourceDecisionId: "source-decision-noise",
      outcome: "noise",
      reason: "Noisy decision matched words but not task."
    }, {
      sourceDecisionId: "source-decision-conflicted",
      outcome: "helped",
      reason: "Conflicted decision was selected before stale feedback."
    }, {
      sourceDecisionId: "source-decision-conflicted",
      outcome: "stale",
      reason: "Conflicted decision is now stale."
    }, {
      sourceClaimId: "claim-current",
      outcome: "stale",
      reason: "Current source claim needs refresh before reuse."
    }]
  }],
  proof: {
    doesNotProve: [
      "source truth",
      "live Codex obedience"
    ]
  }
} satisfies DecisionPacketReadModelInput;

describe("DecisionPacket builder", () => {
  it("builds governed packet signals from read model evidence", () => {
    const packet = buildDecisionPacketFromReadModel(readModel);

    expect(packet.governingDecisionIds).toEqual([
      "source-decision-current",
      "source-decision-conflicted"
    ]);
    expect(packet.governingStatements).toContain(
      "Use the current frontend template for matching app setup tasks."
    );
    expect(packet.taskStandardDecisions).toEqual([expect.objectContaining({
      key: "frontend-template",
      rejectedPath: "Do not use the superseded template."
    })]);
    expect(packet.sourceClaimIds).toEqual([
      "claim-current",
      "claim-caveated"
    ]);
    expect(packet.caveatedSourceClaimIds).toEqual([
      "claim-current",
      "claim-caveated"
    ]);
    expect(packet.sourceDecisionEdgeIds).toEqual(["source-decision-edge-current"]);
    expect(packet.staleDecisionIds).toEqual([
      "source-decision-stale",
      "source-decision-conflicted"
    ]);
    expect(packet.rejectedPathIds).toEqual([
      "anti-memory-superseded-template",
      "source-decision-rejected"
    ]);
    expect(packet.noiseDecisionIds).toEqual(["source-decision-noise"]);
    expect(packet.severeStaleAuthorityIds).toEqual(["source-decision-conflicted"]);
    expect(packet.verificationCommands).toEqual(["pnpm --filter frontend test"]);
    expect(packet.evidenceGaps.map((gap) => gap.id)).toEqual([
      "evidence-gap:run-decision-packet-1:caveated-source-authority:claim-current",
      "evidence-gap:run-decision-packet-1:caveated-source-authority:claim-caveated",
      "evidence-gap:run-decision-packet-1:stale-authority:source-decision-conflicted"
    ]);
    expect(packet.sourceConsensus.evidenceGapIds).toEqual(packet.evidenceGaps.map((gap) => gap.id));
    expect(packet.abstentionScore).toMatchObject({
      status: "abstain",
      reasons: [
        "evidence_gap",
        "missing_decision_linked_source",
        "caveated_source_authority",
        "stale_authority"
      ]
    });
  });

  it("binds return channels to a stable packet checksum", () => {
    const first = buildDecisionPacketContractReadback({
      readModel,
      generatedAt: now,
      sha256Hex: fakeSha256Hex
    });
    const second = buildDecisionPacketContractReadback({
      readModel: {
        ...readModel,
        context: {
          ...readModel.context,
          inclusionDetails: [...readModel.context.inclusionDetails].reverse()
        }
      },
      generatedAt: now,
      sha256Hex: fakeSha256Hex
    });

    expect(first.packetIdentity.checksum).toMatch(/^[a-f0-9]{64}$/u);
    expect(first.packetIdentity.evidenceRef).toBe(`packet:${first.packetIdentity.checksum}`);
    expect(first.returnChannels.evidence.persistedCommand).toContain(
      `--decision-packet-checksum ${first.packetIdentity.checksum}`
    );
    expect(first.returnChannels.feedback.sourceDecisionUsefulnessExample).toContain(
      first.packetIdentity.evidenceRef
    );
    expect(first.proof.doesNotProve).toContain("live Codex obedience");
    expect(second.packetIdentity.checksum).not.toBe(first.packetIdentity.checksum);
  });
});
