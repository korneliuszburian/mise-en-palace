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

export const buildOwnerFileRecallCandidates = (
  task: TaskContract
): ActivationCandidate[] => {
  const taskTerms = new Set(tokenizeActivationText([task.title, task.objective].join(" ")));

  return ownerFileRecallCatalog.flatMap((entry) => {
    const matchCount = matchingTermCount(taskTerms, entry);

    return matchCount >= 3 ? [toOwnerFileCandidate(entry, matchCount)] : [];
  });
};
