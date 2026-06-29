import type {
  ReflectionCandidateEvidence,
  ReflectionCandidateEvidenceProvenance,
  SourceLineageRef
} from "@krn/core";

import {
  createDatabaseRuntime
} from "./databaseRuntime.js";
import type {
  DatabaseRuntime,
  DatabaseRuntimeInput
} from "./databaseRuntime.js";

export type CreateMemoryCommandDatabaseRuntime = (
  input: DatabaseRuntimeInput
) => Promise<DatabaseRuntime>;

export interface MemoryCommandDatabaseRuntimeInput {
  env: Record<string, string | undefined>;
  now(): string;
  createId(prefix: string): string;
  createDatabaseRuntime?: CreateMemoryCommandDatabaseRuntime;
}

interface CandidateEvidenceInput {
  provenance: string | undefined;
  evidenceRefs: readonly string[];
  doesNotProve: string | undefined;
}

interface SourceLineageInput {
  sourceId: string;
  note?: string | undefined;
}

const defaultWorkspaceSlug = "local";
const defaultProjectSlug = "mise-en-palace";

const candidateEvidenceProvenances = new Set<ReflectionCandidateEvidenceProvenance>([
  "default_template",
  "operator_reported",
  "captured_output_file",
  "command_runner",
  "external_log",
  "run_event",
  "source_chunk",
  "tool_trace",
  "diff",
  "evidence_bundle",
  "review_assessment",
  "feedback_delta",
  "user_correction",
  "user_preference",
  "local_operator_note",
  "source_claim"
]);

const isCandidateEvidenceProvenance = (
  value: string
): value is ReflectionCandidateEvidenceProvenance =>
  candidateEvidenceProvenances.has(value as ReflectionCandidateEvidenceProvenance);

export const buildReflectionCandidateEvidence = (
  input: CandidateEvidenceInput
): ReflectionCandidateEvidence | undefined => {
  const provenance = input.provenance?.trim();
  const evidenceRefs = input.evidenceRefs
    .map((evidenceRef) => evidenceRef.trim())
    .filter((evidenceRef) => evidenceRef.length > 0);
  const doesNotProve = input.doesNotProve?.trim();
  const evidenceInputProvided =
    provenance !== undefined ||
    input.evidenceRefs.length > 0 ||
    doesNotProve !== undefined;

  if (!evidenceInputProvided) {
    return undefined;
  }

  if (provenance === undefined || provenance.length === 0) {
    throw new Error("--candidate-evidence-provenance is required when candidate evidence is supplied");
  }

  if (!isCandidateEvidenceProvenance(provenance)) {
    throw new Error(`Unsupported candidate evidence provenance: ${provenance}`);
  }

  if (evidenceRefs.length === 0) {
    throw new Error("--candidate-evidence-ref is required when candidate evidence is supplied");
  }

  if (doesNotProve === undefined || doesNotProve.length === 0) {
    throw new Error("--candidate-evidence-does-not-prove is required when candidate evidence is supplied");
  }

  return {
    provenance,
    evidenceRefs,
    doesNotProve
  };
};

export const toSourceLineageRefs = (
  sourceLineageItems: readonly SourceLineageInput[]
): SourceLineageRef[] =>
  sourceLineageItems.map((item) => ({
    sourceId: item.sourceId,
    ...(item.note === undefined ? {} : { note: item.note })
  }));

export const createMemoryCommandDatabaseRuntime = async (
  runtime: MemoryCommandDatabaseRuntimeInput,
  missingDatabaseUrlMessage: string
): Promise<DatabaseRuntime> => {
  const databaseUrl = runtime.env.KRN_DATABASE_URL?.trim();

  if (databaseUrl === undefined || databaseUrl.length === 0) {
    throw new Error(missingDatabaseUrlMessage);
  }

  const createDatabase = runtime.createDatabaseRuntime ?? createDatabaseRuntime;

  return createDatabase({
    databaseUrl,
    workspaceSlug: defaultWorkspaceSlug,
    projectSlug: defaultProjectSlug,
    now: runtime.now,
    createId: runtime.createId
  });
};

export const assertSourceClaimExists = async (
  runtime: DatabaseRuntime,
  sourceClaimId: string
): Promise<void> => {
  const sourceClaim = await runtime.sourceRepository.getSourceClaimById(sourceClaimId);

  if (sourceClaim === undefined) {
    throw new Error(`SourceClaim not found: ${sourceClaimId}`);
  }
};
