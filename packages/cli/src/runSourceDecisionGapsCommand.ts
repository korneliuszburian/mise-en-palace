import type {
  SourceClaim
} from "@krn/core";
import {
  createDatabaseRuntime
} from "./databaseRuntime.js";
import type {
  DatabaseRuntime,
  DatabaseRuntimeInput
} from "./databaseRuntime.js";
import type {
  CliCommand
} from "./parseArgs.js";

export type SourceDecisionGapsCommand = Extract<CliCommand, { kind: "sourceDecisionGaps" }>;

export interface SourceDecisionGapsCommandRuntime {
  env: Record<string, string | undefined>;
  now(): string;
  createId(prefix: string): string;
  command: SourceDecisionGapsCommand;
  createDatabaseRuntime?: CreateSourceDecisionGapsDatabaseRuntime;
}

export interface SourceDecisionGapsCommandResult {
  stdout: string;
}

export type CreateSourceDecisionGapsDatabaseRuntime = (
  input: DatabaseRuntimeInput
) => Promise<DatabaseRuntime>;

interface SourceDecisionGap {
  sourceClaimId: SourceClaim["id"];
  claim: string;
  trustTier: SourceClaim["trustTier"];
  supportType: SourceClaim["supportType"];
  consumer: string;
  caveat: string;
  doesNotProve: string;
}

interface SourceDecisionGapsReport {
  kind: "source_decision_gaps";
  projectId: string;
  limit: number;
  persistence: "read_only_postgres";
  dbWrites: "none";
  mutation: "none";
  acceptedSourceClaimCount: number;
  linkedSourceClaimCount: number;
  missingDecisionEdgeCount: number;
  missingDecisionEdgeClaims: readonly SourceDecisionGap[];
  proof: {
    proves: readonly string[];
    doesNotProve: readonly string[];
  };
}

const defaultWorkspaceSlug = "local";
const defaultProjectSlug = "mise-en-palace";
const defaultLimit = 50;

const sourceDecisionGapFor = (claim: SourceClaim): SourceDecisionGap => ({
  sourceClaimId: claim.id,
  claim: claim.claim,
  trustTier: claim.trustTier,
  supportType: claim.supportType,
  consumer: claim.consumer,
  caveat:
    `Accepted SourceClaim ${claim.id} has no SourceDecisionEdge support in this project readback.`,
  doesNotProve:
    "Missing SourceDecisionEdge readback does not prove the claim is false or unused; it proves only that this decision-link surface has no edge for the claim."
});

const formatText = (report: SourceDecisionGapsReport): string =>
  [
    "KRN Source Decision Gaps",
    "Persistence: read-only (Postgres)",
    "DB writes: none",
    "Mutation: none",
    `Project: ${report.projectId}`,
    `Limit: ${report.limit}`,
    "",
    "Summary:",
    `acceptedSourceClaims: ${report.acceptedSourceClaimCount}`,
    `linkedSourceClaims: ${report.linkedSourceClaimCount}`,
    `missingDecisionEdgeClaims: ${report.missingDecisionEdgeCount}`,
    "",
    "Missing SourceDecisionEdge claims:",
    ...(report.missingDecisionEdgeClaims.length === 0
      ? ["- none"]
      : report.missingDecisionEdgeClaims.map((gap) =>
          [
            `- sourceClaim:${gap.sourceClaimId}`,
            ` trustTier:${gap.trustTier}`,
            ` supportType:${gap.supportType}`,
            ` consumer:${gap.consumer}`,
            ` claim:${gap.claim}`,
            ` caveat:${gap.caveat}`
          ].join("")
        )),
    "",
    "Proof:",
    ...report.proof.proves.map((item) => `- proves: ${item}`),
    ...report.proof.doesNotProve.map((item) => `- doesNotProve: ${item}`)
  ].join("\n");

const buildReport = async (input: {
  projectId: string;
  limit: number;
  sourceRepository: DatabaseRuntime["sourceRepository"];
}): Promise<SourceDecisionGapsReport> => {
  const listSourceDecisionEdgesForClaim =
    input.sourceRepository.listSourceDecisionEdgesForClaim;

  if (listSourceDecisionEdgesForClaim === undefined) {
    throw new Error("SourceDecisionEdge readback is unavailable in this database runtime");
  }

  const claims = await input.sourceRepository.listClaimsForProject(input.projectId, input.limit);
  const acceptedClaims = claims.filter((claim) => claim.status === "accepted");
  const edgeGroups = await Promise.all(acceptedClaims.map(async (claim) => ({
    claim,
    edges: await listSourceDecisionEdgesForClaim(claim.id)
  })));
  const linked = edgeGroups.filter((item) => item.edges.length > 0);
  const missing = edgeGroups.filter((item) => item.edges.length === 0);

  return {
    kind: "source_decision_gaps",
    projectId: input.projectId,
    limit: input.limit,
    persistence: "read_only_postgres",
    dbWrites: "none",
    mutation: "none",
    acceptedSourceClaimCount: acceptedClaims.length,
    linkedSourceClaimCount: linked.length,
    missingDecisionEdgeCount: missing.length,
    missingDecisionEdgeClaims: missing.map((item) => sourceDecisionGapFor(item.claim)),
    proof: {
      proves: [
        "read-only project scan can identify accepted SourceClaims without SourceDecisionEdge readback"
      ],
      doesNotProve: [
        "source truth",
        "claim usefulness",
        "that a missing edge is a defect",
        "Memory Core mutation",
        "product readiness"
      ]
    }
  };
};

export const runSourceDecisionGapsCommand = async (
  runtime: SourceDecisionGapsCommandRuntime
): Promise<SourceDecisionGapsCommandResult> => {
  const databaseUrl = runtime.env.KRN_DATABASE_URL?.trim();

  if (databaseUrl === undefined || databaseUrl.length === 0) {
    throw new Error("KRN_DATABASE_URL is required for krn source decision gaps");
  }

  const createRuntime = runtime.createDatabaseRuntime ?? createDatabaseRuntime;
  const databaseRuntime = await createRuntime({
    databaseUrl,
    workspaceSlug: defaultWorkspaceSlug,
    projectSlug: defaultProjectSlug,
    ...(runtime.command.projectId === undefined ? {} : { projectId: runtime.command.projectId }),
    requireProjectKernelForExplicitProject: false,
    now: runtime.now,
    createId: runtime.createId
  });

  try {
    const report = await buildReport({
      projectId: databaseRuntime.projectId,
      limit: runtime.command.limit ?? defaultLimit,
      sourceRepository: databaseRuntime.sourceRepository
    });

    return {
      stdout: runtime.command.json === true
        ? `${JSON.stringify(report, null, 2)}\n`
        : formatText(report)
    };
  } finally {
    await databaseRuntime.close();
  }
};
