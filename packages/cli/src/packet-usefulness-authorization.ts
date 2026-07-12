import {
  createHash
} from "node:crypto";
import {
  buildDecisionPacketContractReadback,
} from "@krn/core";
import type {
  IsoTimestamp
} from "@krn/core";
import type {
  HarnessRunAggregate
} from "@krn/core/repositories";

import {
  buildDecisionPacketReadModel
} from "./decision-packet-read-model-builders.js";

export type PacketUsefulnessSubjectKind =
  | "source_claim"
  | "source_decision"
  | "knowledge"
  | "memory_record";

export interface PacketUsefulnessSubject {
  kind: PacketUsefulnessSubjectKind;
  id: string;
  evidenceRefs?: readonly string[];
}

export interface PacketUsefulnessAuthorizationInput {
  aggregate: HarnessRunAggregate;
  runId: string;
  runtimeProjectId: string;
  callerPacketChecksum?: string;
  callerPacketGeneratedAt?: IsoTimestamp;
  subjects: readonly PacketUsefulnessSubject[];
}

export interface PacketUsefulnessBinding {
  packetChecksum: string;
  packetEvidenceRef: string;
  packetGeneratedAt: IsoTimestamp;
}

export type PacketUsefulnessAuthorization =
  | (PacketUsefulnessBinding & {
      authorized: true;
      projectId: string;
    })
  | {
      authorized: false;
      reason: string;
      projectId?: string;
    };

const sha256Hex = (value: string): string =>
  createHash("sha256").update(value).digest("hex");

const currentPacketForAggregate = (
  aggregate: HarnessRunAggregate,
  packetGeneratedAt: IsoTimestamp
) =>
  buildDecisionPacketContractReadback({
    readModel: buildDecisionPacketReadModel(aggregate),
    generatedAt: packetGeneratedAt,
    sha256Hex
  });

export const currentDecisionPacketBindingForAggregate = (
  aggregate: HarnessRunAggregate,
  packetGeneratedAt: IsoTimestamp
): PacketUsefulnessBinding => {
  const packetIdentity = currentPacketForAggregate(aggregate, packetGeneratedAt).packetIdentity;

  return {
    packetChecksum: packetIdentity.checksum,
    packetEvidenceRef: packetIdentity.evidenceRef,
    packetGeneratedAt: packetIdentity.generatedAt
  };
};

const selectedSubjectIds = (
  aggregate: HarnessRunAggregate,
  packetGeneratedAt: IsoTimestamp
): ReadonlyMap<PacketUsefulnessSubjectKind, ReadonlySet<string>> => {
  const packet = currentPacketForAggregate(aggregate, packetGeneratedAt).packet;

  return new Map([
    ["source_claim", new Set([
      ...packet.sourceClaimIds,
      ...packet.brief.includedSourceClaimIds
    ])],
    // governingDecisionIds and sourceDecisionTargets contain decision target
    // identities, not canonical SourceDecision row ids. Fail closed until the
    // packet contract carries selected SourceDecision ids explicitly.
    ["source_decision", new Set<string>()],
    ["knowledge", new Set([
      ...packet.memoryRefs,
      ...packet.taskStandardDecisions.map((decision) => decision.memoryRecordId),
      ...packet.brief.includedMemoryRecordIds
    ])],
    ["memory_record", new Set([
      ...packet.memoryRefs,
      ...packet.taskStandardDecisions.map((decision) => decision.memoryRecordId),
      ...packet.brief.includedMemoryRecordIds
    ])]
  ]);
};

const normalizePacketGeneratedAt = (
  packetGeneratedAt: IsoTimestamp | undefined
): IsoTimestamp | undefined => {
  const normalized = packetGeneratedAt?.trim();

  if (normalized === undefined || normalized.length === 0 || !Number.isFinite(Date.parse(normalized))) {
    return undefined;
  }

  return normalized;
};

export const authorizePacketUsefulness = (
  input: PacketUsefulnessAuthorizationInput
): PacketUsefulnessAuthorization => {
  const reject = (reason: string): PacketUsefulnessAuthorization => ({
    authorized: false,
    reason,
    ...(input.aggregate.taskContract.projectId === undefined
      ? {}
      : { projectId: input.aggregate.taskContract.projectId })
  });

  if (input.runId !== input.aggregate.executionRun.id) {
    return reject("usefulness write rejected: run id does not match the fetched harness run");
  }

  const taskProjectId = input.aggregate.taskContract.projectId;

  if (taskProjectId === undefined) {
    return reject("usefulness write rejected: run task has no project identity");
  }

  if (input.runtimeProjectId !== taskProjectId) {
    return reject("usefulness write rejected: runtime project does not match the run task project");
  }

  const packetGeneratedAt = normalizePacketGeneratedAt(input.callerPacketGeneratedAt);

  if (packetGeneratedAt === undefined) {
    return reject("usefulness write rejected: exact DecisionPacket generatedAt is required");
  }

  const currentBinding = currentDecisionPacketBindingForAggregate(
    input.aggregate,
    packetGeneratedAt
  );

  if (input.callerPacketChecksum !== currentBinding.packetChecksum) {
    return reject("usefulness write rejected: packet checksum is not the current reconstructed packet checksum");
  }

  const subjects = selectedSubjectIds(input.aggregate, packetGeneratedAt);
  const packetEvidenceRef = currentBinding.packetEvidenceRef;

  for (const subject of input.subjects) {
    if (!subjects.get(subject.kind)?.has(subject.id)) {
      return reject(`usefulness write rejected: ${subject.kind}:${subject.id} is not selected by the current packet`);
    }

    if (subject.evidenceRefs !== undefined && !subject.evidenceRefs.includes(packetEvidenceRef)) {
      return reject(`usefulness write rejected: ${subject.kind}:${subject.id} lacks the current packet evidence ref`);
    }
  }

  return {
    authorized: true,
    ...currentBinding,
    projectId: taskProjectId
  };
};

export const usefulnessAuthorizationDowngradeReason = (
  authorization: PacketUsefulnessAuthorization
): string => authorization.authorized
  ? "Downgraded: usefulness write was not authorized by the current packet."
  : authorization.reason;
