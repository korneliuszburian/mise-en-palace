import type {
  TaskContract
} from "@krn/core";

import {
  tokenizeActivationText
} from "./memoryQuery.js";
import type {
  ActivationCandidate
} from "./types.js";

interface OwnerFileRecallEntry {
  id: string;
  path: string;
  title: string;
  summary: string;
  terms: readonly string[];
}

export interface TargetActivationSourceSeed {
  path: string;
  kind: string;
  reason: string;
}

export interface TargetActivationTrustExclusion {
  pathPattern: string;
  reason: string;
}

export interface TargetActivationOwnerFile {
  path: string;
  root: string;
  kind: string;
  reason: string;
}

export interface TargetActivationReadModel {
  projectKernelId?: string;
  repoInstallationIds: readonly string[];
  localPathHints: readonly string[];
  sourceSeeds: readonly TargetActivationSourceSeed[];
  ownerFiles?: readonly TargetActivationOwnerFile[];
  trustExclusions: readonly TargetActivationTrustExclusion[];
}

export type TargetOwnerFileRecallStatus =
  | "owner_files_available"
  | "missing_owner_file_read_model";

export interface TargetOwnerFileRecallAssessment {
  status: TargetOwnerFileRecallStatus;
  reason: string;
  explanation: string;
  sourceSeedPaths: readonly string[];
  ownerFilePaths: readonly string[];
  doesNotProve: string;
}

export interface BuildOwnerFileRecallCandidatesOptions {
  targetReadModel?: TargetActivationReadModel;
}

const ownerFileRecallCatalog = [
  {
    id: "11111111-1111-4111-8111-111111111001",
    path: "packages/cli/src/runDbReadinessCommand.ts",
    title: "DB readiness CLI command owner",
    summary: "Owns krn db readiness output, Postgres readiness reporting, migrations status, pgvector status, and DB endpoint display.",
    terms: ["db", "database", "readiness", "postgres", "endpoint", "migration", "migrations", "pgvector"]
  },
  {
    id: "11111111-1111-4111-8111-111111111002",
    path: "packages/cli/src/runDbReadinessCommand.test.ts",
    title: "DB readiness CLI command test owner",
    summary: "Owns focused DB readiness output tests, including endpoint redaction and invalid KRN_DATABASE_URL handling.",
    terms: ["db", "database", "readiness", "postgres", "endpoint", "test", "redaction"]
  },
  {
    id: "11111111-1111-4111-8111-111111111003",
    path: "packages/cli/src/runCli.test.ts",
    title: "CLI integration test owner",
    summary: "Owns runCli command behavior coverage, including DB readiness command output assertions.",
    terms: ["cli", "command", "db", "database", "readiness", "output", "test"]
  },
  {
    id: "11111111-1111-4111-8111-111111111004",
    path: "packages/cli/src/runEvidenceCaptureCommand.ts",
    title: "Evidence capture CLI command owner",
    summary: "Owns krn evidence capture output, intended-file classification, command proof rendering, review burden, and feedback candidate rendering.",
    terms: ["evidence", "capture", "intended", "dirty", "command", "proof", "feedback", "review"]
  },
  {
    id: "11111111-1111-4111-8111-111111111005",
    path: "packages/harness/src/reflection/reflectionCandidateWriter.ts",
    title: "Reflection candidate writer owner",
    summary: "Owns reflection candidate row writing, candidate-only gates, and reflection candidate reviewability metadata.",
    terms: ["reflection", "candidate", "writer", "reviewability", "metadata", "memory", "eval", "policy"]
  },
  {
    id: "11111111-1111-4111-8111-111111111006",
    path: "packages/harness/src/activation/activationEngine.ts",
    title: "Activation retrieval and trace owner",
    summary: "Owns activation candidate retrieval, source/memory/search merging, raw recall trace persistence, and activation decisions.",
    terms: ["activation", "retrieval", "context", "owner", "recall", "trace", "candidate", "search"]
  }
] as const satisfies readonly OwnerFileRecallEntry[];

const candidatePathId = (path: string): string =>
  path
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

const deterministicUuid = (key: string): string => {
  let hash = 0x811c9dc5;

  for (let index = 0; index < key.length; index += 1) {
    hash ^= key.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }

  const segments = Array.from({ length: 4 }, (_, index) =>
    ((hash + Math.imul(index + 1, 0x9e3779b1)) >>> 0).toString(16).padStart(8, "0")
  );
  const hex = segments.join("");

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    `4${hex.slice(13, 16)}`,
    `8${hex.slice(17, 20)}`,
    hex.slice(20, 32)
  ].join("-");
};

const matchingTermCount = (
  taskTerms: ReadonlySet<string>,
  entry: OwnerFileRecallEntry
): number =>
  tokenizeActivationText([
    entry.path,
    entry.title,
    entry.summary,
    ...entry.terms
  ].join(" ")).filter((term) => taskTerms.has(term)).length;

const ownerFileCandidateId = (entry: OwnerFileRecallEntry): string =>
  `owner-file:${entry.path}`;

const toOwnerFileCandidate = (
  entry: OwnerFileRecallEntry,
  matchCount: number
): ActivationCandidate => ({
  id: ownerFileCandidateId(entry),
  kind: "search",
  subjectType: "search_document",
  subjectId: entry.id,
  text: [entry.path, entry.title, entry.summary, ...entry.terms].join(" "),
  trustTier: "project-decision",
  reason: `Owner-file recall: ${entry.path}`,
  expectedUse: `Inspect ${entry.path} when the task touches ${entry.title.toLowerCase()}.`,
  tokenEstimate: 48,
  lexicalScore: matchCount * 20,
  metadata: {
    source: "owner_file_recall",
    ownerFileSubjectId: entry.id,
    ownerFilePath: entry.path,
    title: entry.title,
    matchedTerms: matchCount
  }
});

const targetSeedMatchCount = (
  taskTerms: ReadonlySet<string>,
  seed: TargetActivationSourceSeed
): number =>
  tokenizeActivationText([
    seed.path,
    seed.kind,
    seed.reason
  ].join(" ")).filter((term) => taskTerms.has(term)).length;

const toTargetSeedCandidate = (
  seed: TargetActivationSourceSeed,
  matchCount: number,
  readModel: TargetActivationReadModel
): ActivationCandidate => {
  const candidateSlug = candidatePathId(seed.path);
  const subjectId = deterministicUuid(`target-source-seed:${seed.path}`);

  return {
    id: `target-source-seed:${candidateSlug}`,
    kind: "search",
    subjectType: "search_document",
    subjectId,
    text: [
      seed.path,
      seed.kind,
      seed.reason,
      "target owner file source seed project scoped read model"
    ].join(" "),
    trustTier: "project-decision",
    reason: `Target source seed: ${seed.path}`,
    expectedUse: `Inspect target repo path ${seed.path} when the task needs ${seed.reason}.`,
    tokenEstimate: 40,
    lexicalScore: matchCount * 30,
    metadata: {
      source: "target_project_read_model",
      targetReadModelKind: "source_seed",
      targetPath: seed.path,
      seedKind: seed.kind,
      seedReason: seed.reason,
      repoInstallationIds: readModel.repoInstallationIds,
      ...(readModel.projectKernelId === undefined ? {} : { projectKernelId: readModel.projectKernelId })
    }
  };
};

const targetOwnerFileMatchCount = (
  taskTerms: ReadonlySet<string>,
  ownerFile: TargetActivationOwnerFile
): number =>
  tokenizeActivationText([
    ownerFile.path,
    ownerFile.root,
    ownerFile.kind,
    ownerFile.reason
  ].join(" ")).filter((term) => taskTerms.has(term)).length;

const toTargetOwnerFileCandidate = (
  ownerFile: TargetActivationOwnerFile,
  matchCount: number,
  readModel: TargetActivationReadModel
): ActivationCandidate => {
  const candidateSlug = candidatePathId(ownerFile.path);
  const subjectId = deterministicUuid(`target-owner-file:${ownerFile.path}`);

  return {
    id: `target-owner-file:${candidateSlug}`,
    kind: "search",
    subjectType: "search_document",
    subjectId,
    text: [
      ownerFile.path,
      ownerFile.root,
      ownerFile.kind,
      ownerFile.reason,
      "target owner file below named source root project scoped read model"
    ].join(" "),
    trustTier: "project-decision",
    reason: `Target owner file: ${ownerFile.path}`,
    expectedUse: `Inspect target owner file ${ownerFile.path} for ${ownerFile.reason}.`,
    tokenEstimate: 56,
    lexicalScore: matchCount * 45,
    metadata: {
      source: "target_project_read_model",
      targetReadModelKind: "owner_file",
      targetPath: ownerFile.path,
      targetRoot: ownerFile.root,
      ownerFileKind: ownerFile.kind,
      ownerFileReason: ownerFile.reason,
      repoInstallationIds: readModel.repoInstallationIds,
      ...(readModel.projectKernelId === undefined ? {} : { projectKernelId: readModel.projectKernelId })
    }
  };
};

const toTargetTrustExclusionCandidate = (
  readModel: TargetActivationReadModel
): ActivationCandidate | undefined => {
  if (readModel.trustExclusions.length === 0) {
    return undefined;
  }

  const patterns = readModel.trustExclusions.map((exclusion) => exclusion.pathPattern);

  return {
    id: "target-trust-exclusions",
    kind: "search",
    subjectType: "search_document",
    subjectId: deterministicUuid("target-trust-exclusions"),
    text: [
      "target trust exclusions redaction untrusted generated secret runtime",
      ...readModel.trustExclusions.map((exclusion) =>
        `${exclusion.pathPattern} ${exclusion.reason}`
      )
    ].join(" "),
    trustTier: "project-decision",
    reason: "Target trust exclusions for project-scoped planning",
    expectedUse: `Exclude or redact target paths before using target context: ${patterns.join(", ")}.`,
    tokenEstimate: 64,
    lexicalScore: 80,
    metadata: {
      source: "target_project_read_model",
      targetReadModelKind: "trust_exclusions",
      trustExclusions: readModel.trustExclusions,
      repoInstallationIds: readModel.repoInstallationIds,
      ...(readModel.projectKernelId === undefined ? {} : { projectKernelId: readModel.projectKernelId })
    }
  };
};

const buildTargetProjectRecallCandidates = (
  task: TaskContract,
  readModel: TargetActivationReadModel
): ActivationCandidate[] => {
  const taskTerms = new Set(tokenizeActivationText([task.title, task.objective].join(" ")));
  const ownerFileCandidates = (readModel.ownerFiles ?? []).flatMap((ownerFile) => {
    const matchCount = targetOwnerFileMatchCount(taskTerms, ownerFile);

    return matchCount >= 1 ? [toTargetOwnerFileCandidate(ownerFile, matchCount, readModel)] : [];
  });
  const sourceSeedCandidates = readModel.sourceSeeds.flatMap((seed) => {
    const matchCount = targetSeedMatchCount(taskTerms, seed);

    return matchCount >= 1 ? [toTargetSeedCandidate(seed, matchCount, readModel)] : [];
  });
  const trustExclusionCandidate = toTargetTrustExclusionCandidate(readModel);

  return [
    ...ownerFileCandidates,
    ...sourceSeedCandidates,
    ...(trustExclusionCandidate === undefined ? [] : [trustExclusionCandidate])
  ];
};

export const assessTargetOwnerFileRecall = (
  readModel: TargetActivationReadModel
): TargetOwnerFileRecallAssessment => {
  const ownerFilePaths = (readModel.ownerFiles ?? []).map((ownerFile) => ownerFile.path);
  const sourceSeedPaths = readModel.sourceSeeds.map((seed) => seed.path);

  if (ownerFilePaths.length > 0) {
    return {
      status: "owner_files_available",
      reason: "target_read_model_provided_owner_files",
      explanation: "Target read model can surface exact owner-file candidates below named source roots.",
      sourceSeedPaths,
      ownerFilePaths,
      doesNotProve: "Owner-file candidates do not prove the files are correct, complete, current, or sufficient for the task."
    };
  }

  return {
    status: "missing_owner_file_read_model",
    reason: "target_read_model_has_no_owner_files",
    explanation: "Target read model has source seeds but no exact owner-file entries, so KRN can only surface root-level target context.",
    sourceSeedPaths,
    ownerFilePaths,
    doesNotProve: "Missing owner-file entries do not prove owner files do not exist; it proves only that the current read model cannot name them."
  };
};

export const buildOwnerFileRecallCandidates = (
  task: TaskContract,
  options: BuildOwnerFileRecallCandidatesOptions = {}
): ActivationCandidate[] => {
  if (options.targetReadModel !== undefined) {
    return buildTargetProjectRecallCandidates(task, options.targetReadModel);
  }

  const taskTerms = new Set(tokenizeActivationText([task.title, task.objective].join(" ")));

  return ownerFileRecallCatalog.flatMap((entry) => {
    const matchCount = matchingTermCount(taskTerms, entry);

    return matchCount >= 3 ? [toOwnerFileCandidate(entry, matchCount)] : [];
  });
};
