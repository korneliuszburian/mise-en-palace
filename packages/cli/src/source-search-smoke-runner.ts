import type {
  createDatabaseRuntime
} from "./database-runtime.js";
import {
  runSourceSearchCommand
} from "./run-source-search-command.js";

interface SmokeSourceSearchInput {
  readonly databaseUrl: string;
  readonly repoRoot: string;
  readonly now: string;
}

type SmokeDatabaseRuntimeFactory = (
  runtimeInput: Parameters<typeof createDatabaseRuntime>[0]
) => Promise<Awaited<ReturnType<typeof createDatabaseRuntime>>>;

export interface SmokeSourceSearchJson {
  readonly includedCandidates: readonly unknown[];
  readonly answerPackage?: {
    readonly supportingClaims?: unknown;
    readonly supportingDocuments?: unknown;
    readonly sourceDecisionSupport?: unknown;
  };
}

const objectValue = (value: unknown): Record<string, unknown> | undefined =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;

const parseSmokeSourceSearchJson = (
  text: string,
  label: string
): SmokeSourceSearchJson => {
  const parsed: unknown = JSON.parse(text);
  const record = objectValue(parsed);

  if (record === undefined) {
    throw new Error(`${label} expected JSON object output`);
  }

  const answerPackage = objectValue(record["answerPackage"]);

  return {
    includedCandidates: Array.isArray(record["includedCandidates"])
      ? record["includedCandidates"]
      : [],
    ...(answerPackage === undefined
      ? {}
      : {
          answerPackage: {
            supportingClaims: answerPackage["supportingClaims"],
            supportingDocuments: answerPackage["supportingDocuments"],
            sourceDecisionSupport: answerPackage["sourceDecisionSupport"]
          }
        })
  };
};

const sourceSearchCandidateClaimId = (candidate: unknown): string | undefined => {
  const record = objectValue(candidate);

  return typeof record?.["sourceClaimId"] === "string"
    ? record["sourceClaimId"]
    : undefined;
};

export const sourceSearchIncludesClaim = (
  json: SmokeSourceSearchJson,
  sourceClaimId: string
): boolean =>
  json.includedCandidates.some((candidate) => sourceSearchCandidateClaimId(candidate) === sourceClaimId);

export const topSourceSearchClaimId = (
  json: SmokeSourceSearchJson
): string | null => {
  for (const candidate of json.includedCandidates) {
    const id = sourceSearchCandidateClaimId(candidate);

    if (id !== undefined) {
      return id;
    }
  }

  return null;
};

export const runSmokeSourceSearch = async (
  input: SmokeSourceSearchInput,
  createId: (prefix: string) => string,
  createSmokeDatabaseRuntime: SmokeDatabaseRuntimeFactory,
  query: string,
  label: string
): Promise<SmokeSourceSearchJson> => {
  const result = await runSourceSearchCommand({
    cwd: input.repoRoot,
    env: {
      KRN_DATABASE_URL: input.databaseUrl
    },
    now: () => input.now,
    createId,
    createDatabaseRuntime: createSmokeDatabaseRuntime,
    command: {
      kind: "sourceSearch",
      query,
      json: true,
      limit: 12,
      maxInclusions: 6
    }
  });

  return parseSmokeSourceSearchJson(result.stdout, label);
};
