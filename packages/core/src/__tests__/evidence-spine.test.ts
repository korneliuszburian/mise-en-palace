import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  buildDecisionPacketContractReadback,
  type DecisionPacketReadModelInput,
} from "../decision-packet.js";
import {
  createEvidenceSpineAttempt,
  createEvidenceSpinePlan,
  createEvidenceSpineReceipt,
  createKrnEvidenceFeedbackInputFromReceipt,
  EvidenceSpineReplayLedger,
  parseEvidenceSpine,
  parseEvidenceSpineReceipt,
  serializeEvidenceSpine,
  type EvidenceSpineReceipt,
} from "../evidence-spine.js";
import type { CreateEvidenceFeedbackOnceInput } from "../repositories/harness-run-repository.js";
import type { ExecutionRun } from "../execution-run.js";

const now = "2026-08-26T18:00:00.000Z";
const runId = "run-evidence-spine-1";
const taskId = "task-evidence-spine-1";
const projectId = "project-evidence-spine-1";
const harnessPlanId = "harness-plan-evidence-spine-1";

const sha256Hex = (value: string | Uint8Array): string =>
  createHash("sha256").update(value).digest("hex");

const readModel: DecisionPacketReadModelInput = {
  run: {
    id: runId,
    status: "planned",
    lifecycleRevision: 1,
    updatedAt: now,
  },
  task: {
    id: taskId,
    projectId,
    title: "Exercise the EvidenceSpine seam",
    objective: "Bind a worker receipt to packet-bound feedback.",
    constraints: [],
    nonGoals: [],
    acceptance: [],
  },
  evidenceContractActivation: {
    status: "active",
    evidenceContract: {
      taskContractId: taskId,
      commands: [{ command: "pnpm test", required: true }],
      diffRisk: "low",
      reviewBurden: "Review the EvidenceSpine seam.",
      rollbackPath: "Revert the EvidenceSpine seam.",
      metadata: {},
    },
    taskContractId: taskId,
    harnessPlanId,
    executionRunId: runId,
    taskContractStatus: "active",
    executionRunStatus: "planned",
  },
  context: {
    inclusions: 0,
    exclusions: 0,
    inclusionDetails: [],
    exclusionDetails: [],
  },
  evidenceBundles: [],
  feedbackDeltas: [],
  proof: {
    doesNotProve: ["live worker obedience"],
  },
};

const issuedPacket = () =>
  buildDecisionPacketContractReadback({
    readModel,
    generatedAt: now,
    sha256Hex,
  });

const evidencePayload = "mini-agi verified evidence\n";

const planSourceFor = (packet: ReturnType<typeof issuedPacket>) => ({
  context_packet_sha256: packet.packetIdentity.checksum,
  task_id: taskId,
});

const upstreamPlan = (
  packet = issuedPacket(),
): ReturnType<typeof createEvidenceSpinePlan> =>
  createEvidenceSpinePlan({
    task_id: taskId,
    plan_id: sha256Hex(JSON.stringify(planSourceFor(packet))),
    context_packet_sha256: packet.packetIdentity.checksum,
  });

const receiptFor = (
  plan: ReturnType<typeof createEvidenceSpinePlan>,
  attemptId = "attempt-evidence-spine-1",
): EvidenceSpineReceipt =>
  createEvidenceSpineReceipt(
    plan,
    createEvidenceSpineAttempt(plan, {
      attempt_id: attemptId,
      attempt_number: attemptId.endsWith("-2") ? 2 : 1,
      evidence_sha256: sha256Hex(evidencePayload),
      verifier: "passed",
    }),
  );

const executionRun = (
  lifecycleRevision = 1,
): Pick<ExecutionRun, "id" | "lifecycleRevision"> => ({
  id: runId,
  lifecycleRevision,
});

const feedbackWriteInput = (): Omit<
  CreateEvidenceFeedbackOnceInput,
  | "executionRunId"
  | "sourceRunLifecycleRevision"
  | "projectId"
  | "captureIdentity"
  | "decisionPacketClaim"
  | "evidence"
  | "review"
  | "feedback"
> & {
  evidence: Omit<CreateEvidenceFeedbackOnceInput["evidence"], "executionRunId">;
  review: Omit<CreateEvidenceFeedbackOnceInput["review"], "evidenceBundleId">;
  feedback: Omit<
    CreateEvidenceFeedbackOnceInput["feedback"],
    "reviewAssessmentId"
  >;
} => ({
  metadata: {
    source: "mini-agi",
  },
  evidence: {
    status: "captured",
    changedFiles: ["packages/core/src/evidence-spine.ts"],
    commands: [
      {
        command: "pnpm test",
        status: "passed",
        provenance: "external_log",
        outputRef: "mini-agi:attempt-evidence-spine-1",
        capturedAt: now,
      },
    ],
    diffRisk: "low",
    reviewBurden: "Review the upstream verified receipt.",
    rollbackPath: "Revert the packet-bound feedback capture.",
    event: {
      type: "evidence.spine.receipt_captured",
      message: "EvidenceSpine receipt captured",
      payload: {},
    },
    metadata: {
      source: "mini-agi",
    },
  },
  review: {
    status: "pending",
    reviewer: "evidence-spine",
    summary: "Upstream receipt captured; review remains explicit.",
    findings: [],
    metadata: {},
  },
  feedback: {
    status: "candidate",
    memoryCandidates: [],
    sourceDecisions: [],
    evalCandidates: [],
    metadata: {},
  },
});

describe("EvidenceSpineV1 KRN adapter", () => {
  it("accepts the canonical MUZG golden fixture in every semantic form", () => {
    const fixture = JSON.parse(
      readFileSync(
        new URL("./fixtures/evidence-spine-v1-golden.json", import.meta.url),
        "utf8",
      ),
    ) as { wire: { plan: string; attempt: string; receipt: string } };

    expect(parseEvidenceSpine(fixture.wire.plan)).toMatchObject({
      kind: "evidence_spine_plan",
      task_id: "evidence-adapter-001",
    });
    expect(parseEvidenceSpine(fixture.wire.attempt)).toMatchObject({
      kind: "evidence_spine_attempt",
      attempt_id: "attempt-evidence-adapter-001-1",
    });
    expect(parseEvidenceSpineReceipt(fixture.wire.receipt).verifier).toBe(
      "passed",
    );
  });

  it("round-trips the exact vectors shared with MUZG and mini-agi", () => {
    const plan = createEvidenceSpinePlan({
      task_id: "task-evidence-001",
      plan_id: "a".repeat(64),
      context_packet_sha256: "b".repeat(64),
    });
    const attempt = createEvidenceSpineAttempt(plan, {
      attempt_id: "attempt-evidence-001-2",
      attempt_number: 2,
      evidence_sha256: "c".repeat(64),
      verifier: "passed",
    });
    const receipt = createEvidenceSpineReceipt(plan, attempt);

    expect(serializeEvidenceSpine(plan)).toBe(
      `{"v":1,"k":"p","t":"task-evidence-001","r":"${"a".repeat(64)}","c":"${"b".repeat(64)}"}`,
    );
    expect(serializeEvidenceSpine(attempt)).toBe(
      `{"v":1,"k":"a","t":"task-evidence-001","r":"${"a".repeat(64)}","c":"${"b".repeat(64)}","i":"attempt-evidence-001-2","n":2,"e":"${"c".repeat(64)}","s":"passed"}`,
    );
    expect(serializeEvidenceSpine(receipt)).toBe(
      `{"v":1,"k":"q","t":"task-evidence-001","r":"${"a".repeat(64)}","c":"${"b".repeat(64)}","i":"attempt-evidence-001-2","n":2,"e":"${"c".repeat(64)}","s":"passed"}`,
    );
    expect(parseEvidenceSpine(serializeEvidenceSpine(plan))).toEqual(plan);
    expect(parseEvidenceSpine(serializeEvidenceSpine(attempt))).toEqual(
      attempt,
    );
    expect(parseEvidenceSpine(serializeEvidenceSpine(receipt))).toEqual(
      receipt,
    );
  });

  it("rejects duplicate wire keys before JSON parsing can overwrite one", () => {
    const wire = `{"v":1,"k":"p","t":"task-evidence-001","r":"${"a".repeat(64)}","c":"${"b".repeat(64)}","c":"${"d".repeat(64)}"}`;

    expect(() => parseEvidenceSpine(wire)).toThrow("invalid evidence spine");
  });

  it("builds packet-bound KRN feedback input from an upstream terminal receipt", () => {
    const packet = issuedPacket();
    const plan = upstreamPlan(packet);
    const receipt = receiptFor(plan);
    const prepared = createKrnEvidenceFeedbackInputFromReceipt({
      plan,
      planSource: planSourceFor(packet),
      receipt: `\n  ${serializeEvidenceSpine(receipt)}\n`,
      packet,
      executionRun: executionRun(),
      projectId,
      evidencePayload,
      usefulness: {
        knowledgeUsefulnessOutcomes: [
          {
            knowledgeId: "knowledge-evidence-spine",
            outcome: "used",
            reason: "The verified worker used the selected context.",
            evidenceRefs: [],
            doesNotProve: "The receipt does not prove future usefulness.",
          },
        ],
      },
      ...feedbackWriteInput(),
    });

    expect(prepared).not.toBeNull();
    expect(prepared).toMatchObject({
      executionRunId: runId,
      sourceRunLifecycleRevision: 1,
      projectId,
      captureIdentity: `evidence-spine:${taskId}:${plan.plan_id}:${receipt.attempt_id}`,
      decisionPacketClaim: {
        checksum: packet.packetIdentity.checksum,
        generatedAt: packet.packetIdentity.generatedAt,
      },
    });
    expect(prepared?.metadata?.evidenceSpineReceipt).toBe(
      serializeEvidenceSpine(receipt),
    );
    expect(prepared?.metadata?.evidenceSpineReceiptSha256).toBe(
      sha256Hex(serializeEvidenceSpine(receipt)),
    );
    expect(prepared?.evidence.metadata).toMatchObject({
      evidenceSpineReceipt: serializeEvidenceSpine(receipt),
      decisionPacketAuthorityAdmission: "current_v1",
      decisionPacketBindingState: "bound_current",
      decisionPacketChecksum: packet.packetIdentity.checksum,
    });
    expect(prepared?.feedback.metadata).toMatchObject({
      evidenceSpineAttemptId: receipt.attempt_id,
      decisionPacketAuthorityAdmission: "current_v1",
      decisionPacketBindingState: "bound_current",
    });
    expect(prepared?.semanticRequest?.decisionPacketClaim).toEqual(
      prepared?.decisionPacketClaim,
    );
    expect(prepared?.knowledgeUsefulnessOutcomes).toHaveLength(1);
  });

  it("accepts a retried receipt as a new capture identity while preserving task and packet", () => {
    const packet = issuedPacket();
    const plan = upstreamPlan(packet);
    const first = receiptFor(plan);
    const retry = receiptFor(plan, "attempt-evidence-spine-2");
    const firstInput = createKrnEvidenceFeedbackInputFromReceipt({
      plan,
      planSource: planSourceFor(packet),
      receipt: first,
      packet,
      executionRun: executionRun(),
      projectId,
      evidencePayload,
      ...feedbackWriteInput(),
    });
    const retryInput = createKrnEvidenceFeedbackInputFromReceipt({
      plan,
      planSource: planSourceFor(packet),
      receipt: retry,
      packet,
      executionRun: executionRun(),
      projectId,
      evidencePayload,
      ...feedbackWriteInput(),
    });

    expect(firstInput).not.toBeNull();
    expect(retryInput).not.toBeNull();
    expect(firstInput?.captureIdentity).not.toBe(retryInput?.captureIdentity);
    expect(firstInput?.decisionPacketClaim).toEqual(
      retryInput?.decisionPacketClaim,
    );
    expect(firstInput?.metadata?.evidenceSpineTaskId).toBe(
      retryInput?.metadata?.evidenceSpineTaskId,
    );
  });

  it("rejects stale, tampered, cross-project, and non-terminal receipt bindings", () => {
    const packet = issuedPacket();
    const plan = upstreamPlan(packet);
    const receipt = receiptFor(plan);
    const base = {
      plan,
      planSource: planSourceFor(packet),
      receipt,
      packet,
      executionRun: executionRun(),
      projectId,
      evidencePayload,
      ...feedbackWriteInput(),
    };

    expect(
      createKrnEvidenceFeedbackInputFromReceipt({
        ...base,
        executionRun: executionRun(2),
      }),
    ).toBeNull();
    expect(
      createKrnEvidenceFeedbackInputFromReceipt({
        ...base,
        projectId: "project-other",
      }),
    ).toBeNull();
    expect(
      createKrnEvidenceFeedbackInputFromReceipt({
        ...base,
        packet: {
          ...packet,
          packet: {
            ...packet.packet,
            nextAction: "tampered",
          },
        },
      }),
    ).toBeNull();
    expect(
      createKrnEvidenceFeedbackInputFromReceipt({
        ...base,
        plan: createEvidenceSpinePlan({
          task_id: taskId,
          plan_id: "d".repeat(64),
          context_packet_sha256: packet.packetIdentity.checksum,
        }),
      }),
    ).toBeNull();
    expect(
      createKrnEvidenceFeedbackInputFromReceipt({
        ...base,
        evidencePayload: "tampered evidence\n",
      }),
    ).toBeNull();
    expect(
      createKrnEvidenceFeedbackInputFromReceipt({
        ...base,
        receipt: `{"v":1,"k":"q","t":"${taskId}","r":"${plan.plan_id}","c":"${packet.packetIdentity.checksum}","i":"attempt-evidence-spine-1","n":1,"e":"${sha256Hex(evidencePayload)}","s":"failed"}`,
      }),
    ).toBeNull();
  });

  it("makes retry replay idempotency explicit and rejects identity collisions", () => {
    const plan = createEvidenceSpinePlan({
      task_id: taskId,
      plan_id: "a".repeat(64),
      context_packet_sha256: "b".repeat(64),
    });
    const attempt = createEvidenceSpineAttempt(plan, {
      attempt_id: "attempt-evidence-spine-1",
      attempt_number: 1,
      evidence_sha256: "c".repeat(64),
      verifier: "passed",
    });
    const receipt = createEvidenceSpineReceipt(plan, attempt);
    const ledger = new EvidenceSpineReplayLedger();

    expect(ledger.observe(attempt).status).toBe("accepted");
    expect(ledger.observe(attempt).status).toBe("replayed");
    expect(ledger.observe(receipt).status).toBe("accepted");
    expect(ledger.observe(receipt).status).toBe("replayed");
    expect(
      ledger.observe({
        ...attempt,
        evidence_sha256: "d".repeat(64),
      }).status,
    ).toBe("conflict");
    expect(
      ledger.observe({
        ...attempt,
        attempt_id: "attempt-evidence-spine-2",
        attempt_number: 2,
      }).status,
    ).toBe("accepted");
  });

  it("traces an upstream receipt into one deterministic KRN write request", () => {
    const packet = issuedPacket();
    const plan = upstreamPlan(packet);
    const receipt = receiptFor(plan);
    const first = createKrnEvidenceFeedbackInputFromReceipt({
      plan,
      planSource: planSourceFor(packet),
      receipt,
      packet,
      executionRun: executionRun(),
      projectId,
      evidencePayload,
      ...feedbackWriteInput(),
    });
    const replay = createKrnEvidenceFeedbackInputFromReceipt({
      plan,
      planSource: planSourceFor(packet),
      receipt: parseEvidenceSpineReceipt(serializeEvidenceSpine(receipt)),
      packet,
      executionRun: executionRun(),
      projectId,
      evidencePayload,
      ...feedbackWriteInput(),
    });

    expect(first).not.toBeNull();
    expect(replay).toEqual(first);
    expect(replay?.captureIdentity).toBe(first?.captureIdentity);
    expect(replay?.metadata?.evidenceSpineReceiptSha256).toBe(
      first?.metadata?.evidenceSpineReceiptSha256,
    );
  });
});
