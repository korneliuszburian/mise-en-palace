import type {
  SourceClaim
} from "@krn/core";
import {
  createDatabaseRuntime
} from "./database-runtime.js";
import type {
  DatabaseRuntime,
  DatabaseRuntimeInput
} from "./database-runtime.js";
import type {
  CliCommand
} from "./parse-args.js";
import type {
  BaseCommandRuntime
} from "./command-runtime-support.js";
import {
  createSourceCommandDatabaseRuntime
} from "./source-database-runtime-support.js";

export type SourceDecisionGapsCommand = Extract<CliCommand, { kind: "sourceDecisionGaps" }>;

export interface SourceDecisionGapsCommandRuntime extends BaseCommandRuntime {
  cwd: string;
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

interface UnadoptedSourceClaim {
  sourceClaimId: SourceClaim["id"];
  status: SourceClaim["status"];
  claim: string;
  consumer: string;
  explicitDisposition: "rejected" | "pending_review";
  rejectionIds: readonly string[];
  dispositionReason?: string;
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
  // Claims in this project whose status is not "accepted" - they have no active
  // SourceDecision, so source-search cannot surface them. Surfacing this count
  // is the difference between "no missing edges" (everything accepted is
  // linked) and "the project has raw claims that were never promoted to
  // decisions at all".
  unadoptedSourceClaimCount: number;
  resolvedUnadoptedSourceClaimCount: number;
  pendingUnadoptedSourceClaimCount: number;
  unadoptedClaims: readonly UnadoptedSourceClaim[];
  proof: {
    proves: readonly string[];
    doesNotProve: readonly string[];
  };
}

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
    `unadoptedSourceClaims: ${report.unadoptedSourceClaimCount}`,
    `resolvedUnadoptedSourceClaims: ${report.resolvedUnadoptedSourceClaimCount}`,
    `pendingUnadoptedSourceClaims: ${report.pendingUnadoptedSourceClaimCount}`,
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
    "Un-adopted SourceClaims (status is not accepted; no active SourceDecision, invisible to source-search):",
    ...(report.unadoptedClaims.length === 0
      ? ["- none"]
      : report.unadoptedClaims.map((claim) =>
          [
            `- sourceClaim:${claim.sourceClaimId}`,
            ` status:${claim.status}`,
            ` disposition:${claim.explicitDisposition}`,
            ` consumer:${claim.consumer}`,
            ` claim:${claim.claim}`
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
  const listSourceRejectionsForClaim = input.sourceRepository.listSourceRejectionsForClaim;
  const unadoptedClaims = await Promise.all(
    claims.filter((claim) => claim.status !== "accepted").map(async (claim) => {
      const rejections = listSourceRejectionsForClaim === undefined
        ? []
        : await listSourceRejectionsForClaim(claim.id);
      const dispositionReason = rejections.at(0)?.reason;
      const explicitDisposition: UnadoptedSourceClaim["explicitDisposition"] =
        rejections.length > 0 ? "rejected" : "pending_review";

      return {
        sourceClaimId: claim.id,
        status: claim.status,
        claim: claim.claim,
        consumer: claim.consumer,
        explicitDisposition,
        rejectionIds: rejections.map((rejection) => rejection.id),
        ...(dispositionReason === undefined ? {} : { dispositionReason })
      };
    })
  );
  const resolvedUnadoptedSourceClaimCount = unadoptedClaims.filter(
    (claim) => claim.explicitDisposition === "rejected"
  ).length;
  const pendingUnadoptedSourceClaimCount =
    unadoptedClaims.length - resolvedUnadoptedSourceClaimCount;
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
    unadoptedSourceClaimCount: unadoptedClaims.length,
    resolvedUnadoptedSourceClaimCount,
    pendingUnadoptedSourceClaimCount,
    unadoptedClaims,
    proof: {
      proves: [
        "read-only project scan can identify accepted SourceClaims without SourceDecisionEdge readback",
        "read-only project scan can count SourceClaims that were never adopted (status is not accepted) and are therefore invisible to source-search",
        "read-only project scan can separate unadopted claims with explicit SourceRejection readback from pending review claims"
      ],
      doesNotProve: [
        "source truth",
        "claim usefulness",
        "that a missing edge or an un-adopted claim is a defect",
        "that an un-adopted claim should be adopted",
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

  const databaseRuntime = await createSourceCommandDatabaseRuntime({
    createRuntime: runtime.createDatabaseRuntime ?? createDatabaseRuntime,
    databaseUrl,
    commandProjectId: runtime.command.projectId,
    cwd: runtime.cwd,
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
