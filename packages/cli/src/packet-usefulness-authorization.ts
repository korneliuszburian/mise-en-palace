import {
  createHash
} from "node:crypto";
import {
  buildDecisionPacketContractReadback,
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
  subjects: readonly PacketUsefulnessSubject[];
}

export interface PacketUsefulnessAuthorization {
  authorized: boolean;
  reason?: string;
  packetChecksum: string;
  packetEvidenceRef: string;
  projectId?: string;
}

const sha256Hex = (value: string): string =>
  createHash("sha256").update(value).digest("hex");

const currentPacketForAggregate = (aggregate: HarnessRunAggregate) =>
  buildDecisionPacketContractReadback({
    readModel: buildDecisionPacketReadModel(aggregate),
    generatedAt: aggregate.executionRun.updatedAt,
    sha256Hex
  });

export const currentDecisionPacketBindingForAggregate = (
  aggregate: HarnessRunAggregate
): Pick<PacketUsefulnessAuthorization, "packetChecksum" | "packetEvidenceRef"> => {
  const packetIdentity = currentPacketForAggregate(aggregate).packetIdentity;

  return {
    packetChecksum: packetIdentity.checksum,
    packetEvidenceRef: packetIdentity.evidenceRef
  };
};

const selectedSubjectIds = (
  aggregate: HarnessRunAggregate
): ReadonlyMap<PacketUsefulnessSubjectKind, ReadonlySet<string>> => {
  const packet = currentPacketForAggregate(aggregate).packet;

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

export const authorizePacketUsefulness = (
  input: PacketUsefulnessAuthorizationInput
): PacketUsefulnessAuthorization => {
  const currentBinding = currentDecisionPacketBindingForAggregate(input.aggregate);
  const reject = (reason: string): PacketUsefulnessAuthorization => ({
    authorized: false,
    reason,
    ...currentBinding,
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

  if (input.callerPacketChecksum !== currentBinding.packetChecksum) {
    return reject("usefulness write rejected: packet checksum is not the current reconstructed packet checksum");
  }

  const subjects = selectedSubjectIds(input.aggregate);
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
): string => authorization.reason ?? "Downgraded: usefulness write was not authorized by the current packet.";
