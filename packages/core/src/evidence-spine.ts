import { createHash } from "node:crypto";

import type { DecisionPacketContractReadback } from "./decision-packet.js";
import { parseDecisionPacketContractReadback } from "./decision-packet-contract.js";
import { stampCurrentDecisionPacketAuthorityMetadata } from "./evidence-bundle.js";
import type { ExecutionRun } from "./execution-run.js";
import type { ProjectId } from "./ids.js";
import type {
  CreateEvidenceBundleInput,
  CreateEvidenceFeedbackOnceInput,
  CreateFeedbackDeltaInput,
  CreateReviewAssessmentInput,
} from "./repositories/harness-run-repository.js";

const wireVersion = 1 as const;
const semanticVersion = "1" as const;
const hexadecimalDigest = /^[0-9a-f]{64}$/u;
const identifier = /^[a-z0-9](?:[a-z0-9-]{0,63})$/u;
const maximumAttemptNumber = 1_024;

export type EvidenceSpineVerifier = "passed" | "failed";

export type EvidenceSpinePlan = Readonly<{
  readonly kind: "evidence_spine_plan";
  readonly version: "1";
  readonly task_id: string;
  readonly plan_id: string;
  readonly context_packet_sha256: string;
}>;

export type EvidenceSpineAttempt = Readonly<{
  readonly kind: "evidence_spine_attempt";
  readonly version: "1";
  readonly task_id: string;
  readonly plan_id: string;
  readonly context_packet_sha256: string;
  readonly attempt_id: string;
  readonly attempt_number: number;
  readonly evidence_sha256: string;
  readonly verifier: EvidenceSpineVerifier;
}>;

export type EvidenceSpineReceipt = Readonly<{
  readonly kind: "evidence_spine_receipt";
  readonly version: "1";
  readonly task_id: string;
  readonly plan_id: string;
  readonly context_packet_sha256: string;
  readonly attempt_id: string;
  readonly attempt_number: number;
  readonly evidence_sha256: string;
  readonly verifier: "passed";
}>;

export type EvidenceSpineValue =
  EvidenceSpinePlan | EvidenceSpineAttempt | EvidenceSpineReceipt;

export type EvidenceSpineAttemptValue =
  EvidenceSpineAttempt | EvidenceSpineReceipt;

export interface EvidenceSpinePlanInput {
  readonly task_id: string;
  readonly plan_id: string;
  readonly context_packet_sha256: string;
}

export interface EvidenceSpineAttemptInput {
  readonly attempt_id: string;
  readonly attempt_number: number;
  readonly evidence_sha256: string;
  readonly verifier: EvidenceSpineVerifier;
}

export type EvidenceSpineSha256Hex = (value: string) => string;

function invalid(): never {
  throw new Error("invalid evidence spine");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean {
  const actual = Object.keys(value).sort();
  const sortedExpected = [...expected].sort();

  return (
    actual.length === sortedExpected.length &&
    actual.every((key, index) => key === sortedExpected[index])
  );
}

function validIdentifier(value: unknown): value is string {
  return typeof value === "string" && identifier.test(value);
}

function validDigest(value: unknown): value is string {
  return typeof value === "string" && hexadecimalDigest.test(value);
}

function validAttemptNumber(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= 1 &&
    value <= maximumAttemptNumber
  );
}

function freezePlan(value: EvidenceSpinePlan): EvidenceSpinePlan {
  return Object.freeze(value);
}

function freezeAttempt(value: EvidenceSpineAttempt): EvidenceSpineAttempt {
  return Object.freeze(value);
}

function freezeReceipt(value: EvidenceSpineReceipt): EvidenceSpineReceipt {
  return Object.freeze(value);
}

function validatePlan(value: unknown): asserts value is EvidenceSpinePlan {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      "kind",
      "version",
      "task_id",
      "plan_id",
      "context_packet_sha256",
    ]) ||
    value.kind !== "evidence_spine_plan" ||
    value.version !== semanticVersion ||
    !validIdentifier(value.task_id) ||
    !validDigest(value.plan_id) ||
    !validDigest(value.context_packet_sha256)
  ) {
    invalid();
  }
}

function validateAttempt(
  value: unknown,
): asserts value is EvidenceSpineAttempt {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      "kind",
      "version",
      "task_id",
      "plan_id",
      "context_packet_sha256",
      "attempt_id",
      "attempt_number",
      "evidence_sha256",
      "verifier",
    ]) ||
    value.kind !== "evidence_spine_attempt" ||
    value.version !== semanticVersion ||
    !validIdentifier(value.task_id) ||
    !validDigest(value.plan_id) ||
    !validDigest(value.context_packet_sha256) ||
    !validIdentifier(value.attempt_id) ||
    !validAttemptNumber(value.attempt_number) ||
    !validDigest(value.evidence_sha256) ||
    (value.verifier !== "passed" && value.verifier !== "failed")
  ) {
    invalid();
  }
}

function validateReceipt(
  value: unknown,
): asserts value is EvidenceSpineReceipt {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      "kind",
      "version",
      "task_id",
      "plan_id",
      "context_packet_sha256",
      "attempt_id",
      "attempt_number",
      "evidence_sha256",
      "verifier",
    ]) ||
    value.kind !== "evidence_spine_receipt" ||
    value.version !== semanticVersion ||
    !validIdentifier(value.task_id) ||
    !validDigest(value.plan_id) ||
    !validDigest(value.context_packet_sha256) ||
    !validIdentifier(value.attempt_id) ||
    !validAttemptNumber(value.attempt_number) ||
    !validDigest(value.evidence_sha256) ||
    value.verifier !== "passed"
  ) {
    invalid();
  }
}

function validateValue(value: EvidenceSpineValue): void {
  if (value.kind === "evidence_spine_plan") {
    validatePlan(value);
    return;
  }
  if (value.kind === "evidence_spine_attempt") {
    validateAttempt(value);
    return;
  }
  validateReceipt(value);
}

function attemptBoundToPlan(
  plan: EvidenceSpinePlan,
  attempt: EvidenceSpineAttempt,
): boolean {
  return (
    attempt.task_id === plan.task_id &&
    attempt.plan_id === plan.plan_id &&
    attempt.context_packet_sha256 === plan.context_packet_sha256
  );
}

function fromPlanWire(value: Record<string, unknown>): EvidenceSpinePlan {
  if (
    !hasExactKeys(value, ["v", "k", "t", "r", "c"]) ||
    value.v !== wireVersion ||
    value.k !== "p"
  ) {
    invalid();
  }

  const plan = {
    kind: "evidence_spine_plan" as const,
    version: semanticVersion,
    task_id: value.t,
    plan_id: value.r,
    context_packet_sha256: value.c,
  };
  validatePlan(plan);
  return freezePlan(plan);
}

function fromAttemptWire(value: Record<string, unknown>): EvidenceSpineAttempt {
  if (
    !hasExactKeys(value, ["v", "k", "t", "r", "c", "i", "n", "e", "s"]) ||
    value.v !== wireVersion ||
    value.k !== "a"
  ) {
    invalid();
  }

  const attempt = {
    kind: "evidence_spine_attempt" as const,
    version: semanticVersion,
    task_id: value.t,
    plan_id: value.r,
    context_packet_sha256: value.c,
    attempt_id: value.i,
    attempt_number: value.n,
    evidence_sha256: value.e,
    verifier: value.s,
  };
  validateAttempt(attempt);
  return freezeAttempt(attempt);
}

function fromReceiptWire(value: Record<string, unknown>): EvidenceSpineReceipt {
  if (
    !hasExactKeys(value, ["v", "k", "t", "r", "c", "i", "n", "e", "s"]) ||
    value.v !== wireVersion ||
    value.k !== "q"
  ) {
    invalid();
  }

  const receipt = {
    kind: "evidence_spine_receipt" as const,
    version: semanticVersion,
    task_id: value.t,
    plan_id: value.r,
    context_packet_sha256: value.c,
    attempt_id: value.i,
    attempt_number: value.n,
    evidence_sha256: value.e,
    verifier: value.s,
  };
  validateReceipt(receipt);
  return freezeReceipt(receipt);
}

export function createEvidenceSpinePlan(
  input: EvidenceSpinePlanInput,
): EvidenceSpinePlan {
  const plan = {
    kind: "evidence_spine_plan" as const,
    version: semanticVersion,
    task_id: input.task_id,
    plan_id: input.plan_id,
    context_packet_sha256: input.context_packet_sha256,
  };
  validatePlan(plan);
  return freezePlan(plan);
}

export function createEvidenceSpineAttempt(
  plan: EvidenceSpinePlan,
  input: EvidenceSpineAttemptInput,
): EvidenceSpineAttempt {
  validatePlan(plan);
  const attempt = {
    kind: "evidence_spine_attempt" as const,
    version: semanticVersion,
    task_id: plan.task_id,
    plan_id: plan.plan_id,
    context_packet_sha256: plan.context_packet_sha256,
    attempt_id: input.attempt_id,
    attempt_number: input.attempt_number,
    evidence_sha256: input.evidence_sha256,
    verifier: input.verifier,
  };
  validateAttempt(attempt);
  return freezeAttempt(attempt);
}

export function createEvidenceSpineReceipt(
  plan: EvidenceSpinePlan,
  attempt: EvidenceSpineAttempt,
): EvidenceSpineReceipt {
  validatePlan(plan);
  validateAttempt(attempt);
  if (!attemptBoundToPlan(plan, attempt)) {
    throw new Error("evidence spine binding mismatch");
  }
  if (attempt.verifier !== "passed") {
    throw new Error("verifier has not passed");
  }

  return freezeReceipt({
    kind: "evidence_spine_receipt",
    version: semanticVersion,
    task_id: attempt.task_id,
    plan_id: attempt.plan_id,
    context_packet_sha256: attempt.context_packet_sha256,
    attempt_id: attempt.attempt_id,
    attempt_number: attempt.attempt_number,
    evidence_sha256: attempt.evidence_sha256,
    verifier: "passed",
  });
}

export function serializeEvidenceSpine(value: EvidenceSpineValue): string {
  validateValue(value);

  if (value.kind === "evidence_spine_plan") {
    return JSON.stringify({
      v: wireVersion,
      k: "p",
      t: value.task_id,
      r: value.plan_id,
      c: value.context_packet_sha256,
    });
  }

  if (value.kind === "evidence_spine_attempt") {
    return JSON.stringify({
      v: wireVersion,
      k: "a",
      t: value.task_id,
      r: value.plan_id,
      c: value.context_packet_sha256,
      i: value.attempt_id,
      n: value.attempt_number,
      e: value.evidence_sha256,
      s: value.verifier,
    });
  }

  return JSON.stringify({
    v: wireVersion,
    k: "q",
    t: value.task_id,
    r: value.plan_id,
    c: value.context_packet_sha256,
    i: value.attempt_id,
    n: value.attempt_number,
    e: value.evidence_sha256,
    s: value.verifier,
  });
}

export function parseEvidenceSpine(input: string): EvidenceSpineValue {
  if (hasDuplicateJsonKeys(input)) invalid();

  let value: unknown;
  try {
    const parsed: unknown = JSON.parse(input);
    value = parsed;
  } catch {
    invalid();
  }

  if (
    !isRecord(value) ||
    value.v !== wireVersion ||
    typeof value.k !== "string"
  ) {
    invalid();
  }

  if (value.k === "p") return fromPlanWire(value);
  if (value.k === "a") return fromAttemptWire(value);
  if (value.k === "q") return fromReceiptWire(value);
  invalid();
}

export function parseEvidenceSpinePlan(input: string): EvidenceSpinePlan {
  const value = parseEvidenceSpine(input);
  if (value.kind !== "evidence_spine_plan") invalid();
  return value;
}

export function parseEvidenceSpineAttempt(input: string): EvidenceSpineAttempt {
  const value = parseEvidenceSpine(input);
  if (value.kind !== "evidence_spine_attempt") invalid();
  return value;
}

export function parseEvidenceSpineReceipt(input: string): EvidenceSpineReceipt {
  const value = parseEvidenceSpine(input);
  if (value.kind !== "evidence_spine_receipt") invalid();
  return value;
}

const hasDuplicateJsonKeys = (input: string): boolean => {
  let index = 0;

  const skipWhitespace = (): void => {
    while (/\s/u.test(input[index] ?? "")) index += 1;
  };

  const readString = (): string | undefined => {
    if (input[index] !== '"') return undefined;
    const start = index;
    index += 1;

    while (index < input.length) {
      const character = input[index];
      index += 1;
      if (character === "\\") {
        index += input[index] === "u" ? 5 : 1;
      } else if (character === '"') {
        const raw = input.slice(start, index);
        try {
          const decoded: unknown = JSON.parse(raw);
          return typeof decoded === "string" ? decoded : undefined;
        } catch {
          return undefined;
        }
      }
    }

    return undefined;
  };

  const readValue = (): boolean => {
    skipWhitespace();
    const character = input[index];

    if (character === '"') {
      readString();
      return false;
    }
    if (character === "{") {
      index += 1;
      const keys = new Set<string>();
      skipWhitespace();
      if (input[index] === "}") {
        index += 1;
        return false;
      }
      while (index < input.length) {
        skipWhitespace();
        const key = readString();
        if (key === undefined) return false;
        if (keys.has(key)) return true;
        keys.add(key);
        skipWhitespace();
        if (input[index] !== ":") return false;
        index += 1;
        if (readValue()) return true;
        skipWhitespace();
        if (input[index] === "}") {
          index += 1;
          return false;
        }
        if (input[index] !== ",") return false;
        index += 1;
      }
      return false;
    }
    if (character === "[") {
      index += 1;
      skipWhitespace();
      if (input[index] === "]") {
        index += 1;
        return false;
      }
      while (index < input.length) {
        if (readValue()) return true;
        skipWhitespace();
        if (input[index] === "]") {
          index += 1;
          return false;
        }
        if (input[index] !== ",") return false;
        index += 1;
      }
      return false;
    }

    while (index < input.length && !/[\s,\]}]/u.test(input[index] ?? "")) {
      index += 1;
    }
    return false;
  };

  return readValue();
};

const defaultSha256Hex: EvidenceSpineSha256Hex = (value) =>
  createHash("sha256").update(value).digest("hex");

const canonicalJson = (value: unknown): string => {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(",")}]`;
  }

  if (typeof value === "object" && value !== null) {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`)
      .join(",")}}`;
  }

  return JSON.stringify(value) ?? "null";
};

export type EvidenceSpineUsefulnessInput = Pick<
  CreateEvidenceFeedbackOnceInput,
  | "contextInclusionUsefulnessOutcomes"
  | "sourceUsefulnessOutcomes"
  | "knowledgeUsefulnessOutcomes"
>;

export interface EvidenceSpineReceiptFeedbackInput {
  readonly plan: EvidenceSpinePlan;
  readonly planSource: unknown;
  readonly receipt: EvidenceSpineReceipt | string;
  readonly packet: DecisionPacketContractReadback;
  readonly executionRun: Pick<ExecutionRun, "id" | "lifecycleRevision">;
  readonly projectId: ProjectId;
  readonly evidencePayload: string;
  readonly metadata?: Record<string, unknown>;
  readonly usefulness?: EvidenceSpineUsefulnessInput;
  readonly evidence: Omit<CreateEvidenceBundleInput, "executionRunId">;
  readonly review: Omit<CreateReviewAssessmentInput, "evidenceBundleId">;
  readonly feedback: Omit<CreateFeedbackDeltaInput, "reviewAssessmentId">;
}

const receiptMetadata = (
  receipt: EvidenceSpineReceipt,
  serializedReceipt: string,
  evidencePayload: string,
): Record<string, unknown> => ({
  evidenceSpineReceipt: serializedReceipt,
  evidenceSpineReceiptSha256: defaultSha256Hex(serializedReceipt),
  evidenceSpineTaskId: receipt.task_id,
  evidenceSpinePlanId: receipt.plan_id,
  evidenceSpineContextPacketSha256: receipt.context_packet_sha256,
  evidenceSpineAttemptId: receipt.attempt_id,
  evidenceSpineAttemptNumber: receipt.attempt_number,
  evidenceSpineEvidenceSha256: receipt.evidence_sha256,
  evidenceSpineEvidencePayload: evidencePayload,
});

export const evidenceSpineCaptureIdentity = (
  receipt: EvidenceSpineReceipt,
): string =>
  `evidence-spine:${receipt.task_id}:${receipt.plan_id}:${receipt.attempt_id}`;

const normalizePlan = (plan: EvidenceSpinePlan): EvidenceSpinePlan =>
  parseEvidenceSpinePlan(serializeEvidenceSpine(plan));

const normalizeReceipt = (
  receipt: EvidenceSpineReceipt | string,
): { receipt: EvidenceSpineReceipt; serialized: string } => {
  const serialized =
    typeof receipt === "string" ? receipt : serializeEvidenceSpine(receipt);
  const parsed = parseEvidenceSpineReceipt(serialized);

  return {
    receipt: parsed,
    serialized: serializeEvidenceSpine(parsed),
  };
};

/**
 * Turn a terminal upstream receipt into the existing KRN evidence-feedback
 * write contract. This adapter validates only identity and authority; it does
 * not execute a verifier, promote memory, or write the database itself.
 */
export function createKrnEvidenceFeedbackInputFromReceipt(
  input: EvidenceSpineReceiptFeedbackInput,
): CreateEvidenceFeedbackOnceInput | null {
  try {
    const plan = normalizePlan(input.plan);
    if (
      !isRecord(input.planSource) ||
      defaultSha256Hex(canonicalJson(input.planSource)) !== plan.plan_id
    ) {
      return null;
    }
    const normalizedReceipt = normalizeReceipt(input.receipt);
    const packet = parseDecisionPacketContractReadback({
      value: input.packet,
      expectedRunId: input.executionRun.id,
      sha256Hex: defaultSha256Hex,
    });

    if (packet === undefined) {
      return null;
    }

    const identity = packet.packetIdentity;
    const receipt = normalizedReceipt.receipt;
    if (
      typeof input.evidencePayload !== "string" ||
      defaultSha256Hex(input.evidencePayload) !== receipt.evidence_sha256
    ) {
      return null;
    }
    const taskAndPlanMatch =
      receipt.task_id === plan.task_id &&
      receipt.plan_id === plan.plan_id &&
      receipt.context_packet_sha256 === plan.context_packet_sha256;
    const packetMatch =
      packet.request.runId === input.executionRun.id &&
      packet.request.taskId === plan.task_id &&
      packet.packet.task.id === plan.task_id &&
      packet.packet.task.projectId === input.projectId &&
      identity.checksum === plan.context_packet_sha256;
    const lifecycleMatch =
      input.executionRun.lifecycleRevision ===
      identity.sourceRunLifecycleRevision;

    if (
      !taskAndPlanMatch ||
      !packetMatch ||
      !lifecycleMatch ||
      input.evidence.status === "draft"
    ) {
      return null;
    }

    const claim = {
      checksum: identity.checksum,
      generatedAt: identity.generatedAt,
    };
    const spineMetadata = receiptMetadata(
      receipt,
      normalizedReceipt.serialized,
      input.evidencePayload,
    );
    const authority = {
      checksum: identity.checksum,
      generatedAt: identity.generatedAt,
      sourceRunLifecycleRevision: identity.sourceRunLifecycleRevision,
    };
    const usefulness = input.usefulness ?? {};

    return {
      metadata: {
        ...(input.metadata ?? {}),
        ...spineMetadata,
      },
      executionRunId: input.executionRun.id,
      sourceRunLifecycleRevision: identity.sourceRunLifecycleRevision,
      projectId: input.projectId,
      captureIdentity: evidenceSpineCaptureIdentity(receipt),
      semanticRequest: {
        decisionPacketClaim: claim,
        ...usefulness,
      },
      decisionPacketClaim: claim,
      ...usefulness,
      evidence: {
        ...input.evidence,
        status: "captured",
        metadata: stampCurrentDecisionPacketAuthorityMetadata(
          {
            ...(input.evidence.metadata ?? {}),
            ...spineMetadata,
          },
          authority,
        ),
      },
      review: {
        ...input.review,
        metadata: {
          ...(input.review.metadata ?? {}),
          ...spineMetadata,
        },
      },
      feedback: {
        ...input.feedback,
        metadata: stampCurrentDecisionPacketAuthorityMetadata(
          {
            ...(input.feedback.metadata ?? {}),
            ...spineMetadata,
          },
          authority,
        ),
      },
    };
  } catch {
    return null;
  }
}

const attemptIdentity = (value: EvidenceSpineAttemptValue): string =>
  `${value.task_id}\u0000${value.plan_id}\u0000${value.attempt_id}`;

const sameAttemptEvidence = (
  left: EvidenceSpineAttemptValue,
  right: EvidenceSpineAttemptValue,
): boolean =>
  left.task_id === right.task_id &&
  left.plan_id === right.plan_id &&
  left.context_packet_sha256 === right.context_packet_sha256 &&
  left.attempt_id === right.attempt_id &&
  left.attempt_number === right.attempt_number &&
  left.evidence_sha256 === right.evidence_sha256;

export type EvidenceSpineReplayObservation =
  | {
      readonly status: "accepted" | "replayed";
      readonly value: EvidenceSpineAttemptValue;
    }
  | {
      readonly status: "conflict";
      readonly value: EvidenceSpineAttemptValue;
      readonly existing: EvidenceSpineAttemptValue;
    };

/**
 * Deterministic in-memory replay oracle for adapter tests and bounded harness
 * experiments. Durable KRN persistence remains the production idempotency
 * authority; this class makes the identity transition explicit and testable.
 */
export class EvidenceSpineReplayLedger {
  private readonly entries = new Map<string, EvidenceSpineAttemptValue>();

  observe(value: EvidenceSpineAttemptValue): EvidenceSpineReplayObservation {
    const serialized = serializeEvidenceSpine(value);
    const normalized = parseEvidenceSpine(serialized);
    if (normalized.kind === "evidence_spine_plan") {
      invalid();
    }

    const key = attemptIdentity(normalized);
    const existing = this.entries.get(key);

    if (existing === undefined) {
      this.entries.set(key, normalized);
      return { status: "accepted", value: normalized };
    }

    if (serializeEvidenceSpine(existing) === serialized) {
      return { status: "replayed", value: existing };
    }

    if (
      existing.kind === "evidence_spine_attempt" &&
      normalized.kind === "evidence_spine_receipt" &&
      existing.verifier === "passed" &&
      sameAttemptEvidence(existing, normalized)
    ) {
      this.entries.set(key, normalized);
      return { status: "accepted", value: normalized };
    }

    return { status: "conflict", value: normalized, existing };
  }
}
