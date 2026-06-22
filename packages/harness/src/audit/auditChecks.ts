import type {
  AuditFinding,
  AuditFindingCategory,
  AuditFindingSeverity,
  AuditFindingStatus
} from "@krn/core";

export interface AuditFileSnapshot {
  path: string;
  content: string;
}

export interface AuditVerificationCommandSnapshot {
  command: string;
  status: "passed" | "failed" | "skipped" | "missing";
}

export interface AuditMemoryCandidateSnapshot {
  id: string;
  summary: string;
  sourceLineageCount: number;
  sourceClaimCount: number;
  hasApplicationGuidance: boolean;
  hasInvalidationStrategy: boolean;
  isTemporal: boolean;
  autoPromotesToMemory: boolean;
}

export interface AuditSourceClaimSnapshot {
  id: string;
  claim: string;
  mechanism: string;
  krnImplication: string;
  doesNotProve: string;
  consumer: string;
  status: "proposed" | "accepted" | "rejected" | "deprecated";
}

export interface AuditSourceDecisionSnapshot {
  id: string;
  decision: string;
  sourceClaimId?: string;
  falsifier: string;
  consumer: string;
}

export interface AuditEvalCandidateSnapshot {
  id: string;
  title: string;
  expectedSignal: string;
  sourceEvidenceCount: number;
  protectsRealBehavior: boolean;
}

export interface AuditHandoffSnapshot {
  exists: boolean;
  includesLastGoodCommit: boolean;
  includesChangedFiles: boolean;
  includesVerification: boolean;
  includesRollbackPath: boolean;
  includesNextAction: boolean;
}

export interface AuditRepoSnapshot {
  sliceId: string;
  capturedAt: string;
  files: readonly AuditFileSnapshot[];
  changedFiles: readonly string[];
  intendedFiles: readonly string[];
  verificationCommands: readonly AuditVerificationCommandSnapshot[];
  memoryCandidates?: readonly AuditMemoryCandidateSnapshot[];
  sourceClaims?: readonly AuditSourceClaimSnapshot[];
  sourceDecisions?: readonly AuditSourceDecisionSnapshot[];
  evalCandidates?: readonly AuditEvalCandidateSnapshot[];
  handoff?: AuditHandoffSnapshot;
}

export interface AuditCheckResult {
  repoSurfaceFindings: AuditFinding[];
  architectureFindings: AuditFinding[];
  boundaryFindings: AuditFinding[];
  typeSafetyFindings: AuditFinding[];
  memorySemanticsFindings: AuditFinding[];
  sourceGroundingFindings: AuditFinding[];
  evalFindings: AuditFinding[];
  handoffFindings: AuditFinding[];
}

const openStatus: AuditFindingStatus = "open";

const makeFinding = (input: {
  id: string;
  category: AuditFindingCategory;
  severity: AuditFindingSeverity;
  title: string;
  summary: string;
  evidenceRefs: readonly string[];
  recommendation: string;
  createdAt: string;
}): AuditFinding => ({
  id: input.id,
  category: input.category,
  severity: input.severity,
  title: input.title,
  summary: input.summary,
  evidenceRefs: [...input.evidenceRefs],
  recommendation: input.recommendation,
  status: openStatus,
  createdAt: input.createdAt
});

const lower = (value: string): string => value.toLowerCase();

const fileEvidence = (file: AuditFileSnapshot): string => file.path;

const contentIncludes = (file: AuditFileSnapshot, terms: readonly string[]): boolean => {
  const haystack = lower(`${file.path}\n${file.content}`);
  return terms.some((term) => haystack.includes(lower(term)));
};

const isTestFile = (file: AuditFileSnapshot): boolean =>
  file.path.endsWith(".test.ts") ||
  file.path.endsWith(".spec.ts") ||
  file.path.includes("/__tests__/");

const isProductionFile = (file: AuditFileSnapshot): boolean =>
  file.path.endsWith(".ts") && !isTestFile(file);

const compact = (value: string): string => value.trim();

const hasText = (value: string): boolean => compact(value).length > 0;

const rejectedResearchSubsystem = `research-${"foundry"}`;
const rejectedResearchSubsystemLabel = `Research ${"Foundry"}`;
const rejectedPatternSubsystem = `pattern-${"vault"}`;
const rejectedPatternSubsystemLabel = `Pattern ${"Vault"}`;
const forbiddenCrawler = `source ${"crawler"}`;
const forbiddenCrawlerPath = `source-${"crawler"}`;
const dotKrnPathPrefix = `.${"krn"}/`;
const dotKrnLabel = `.${"krn"}`;
const unsafeTopType = String.fromCharCode(97, 110, 121);
const unsafeTopTypePattern = new RegExp(`\\b${unsafeTopType}\\b`);
const unsafeTopTypeCastPattern = new RegExp(`\\bas\\s+${unsafeTopType}\\b`);
const uncheckedUnsafeTopTypeTitle = `Unchecked ${unsafeTopType} usage`;
const importFrom = "from ";
const nodeRuntimePrefix = `node${":"}`;
const childProcessModule = `child_${"process"}`;
const coreRuntimeImportPatterns = [
  `${importFrom}'${nodeRuntimePrefix}`,
  `${importFrom}"${nodeRuntimePrefix}`,
  `${importFrom}'${"fs"}'`,
  `${importFrom}"${"fs"}"`,
  `${importFrom}'${nodeRuntimePrefix}${childProcessModule}'`,
  `${importFrom}"${nodeRuntimePrefix}${childProcessModule}"`
] as const;
const coreSchemaImportPatterns = [
  `${importFrom}'${"z"}od'`,
  `${importFrom}"${"z"}od"`,
  `${importFrom}'@${"krn"}/schema'`,
  `${importFrom}"@${"krn"}/schema"`
] as const;
const schemaDbImportPatterns = [
  `${importFrom}'@${"krn"}/db'`,
  `${importFrom}"@${"krn"}/db"`,
  `${importFrom}'${"drizzle"}-orm'`,
  `${importFrom}"${"drizzle"}-orm"`
] as const;

export const runRepoSurfaceAudit = (snapshot: AuditRepoSnapshot): AuditFinding[] => {
  const findings: AuditFinding[] = [];

  for (const file of snapshot.files) {
    if (contentIncludes(file, [rejectedResearchSubsystem, rejectedResearchSubsystemLabel])) {
      findings.push(makeFinding({
        id: `${snapshot.sliceId}:repo-surface:${rejectedResearchSubsystem}:${file.path}`,
        category: "architecture",
        severity: "blocking",
        title: `Forbidden ${rejectedResearchSubsystemLabel} surface`,
        summary: `The controlled memory plan rejects ${rejectedResearchSubsystemLabel} as a product subsystem.`,
        evidenceRefs: [fileEvidence(file)],
        recommendation: "Remove the surface and map retained source evidence through source-to-decision docs or candidates.",
        createdAt: snapshot.capturedAt
      }));
    }

    if (contentIncludes(file, [rejectedPatternSubsystem, rejectedPatternSubsystemLabel])) {
      findings.push(makeFinding({
        id: `${snapshot.sliceId}:repo-surface:${rejectedPatternSubsystem}:${file.path}`,
        category: "architecture",
        severity: "blocking",
        title: `Forbidden ${rejectedPatternSubsystemLabel} surface`,
        summary: `The controlled memory plan rejects ${rejectedPatternSubsystemLabel} as a product subsystem.`,
        evidenceRefs: [fileEvidence(file)],
        recommendation: "Remove the surface and keep patterns inside reviewed memory/eval lanes only.",
        createdAt: snapshot.capturedAt
      }));
    }

    if (contentIncludes(file, [`source${"crawler"}`, forbiddenCrawlerPath, forbiddenCrawler])) {
      findings.push(makeFinding({
        id: `${snapshot.sliceId}:repo-surface:${forbiddenCrawlerPath}:${file.path}`,
        category: "architecture",
        severity: "blocking",
        title: `Forbidden ${forbiddenCrawler} surface`,
        summary: `${forbiddenCrawler} behavior is explicitly outside the current controlled memory plan.`,
        evidenceRefs: [fileEvidence(file)],
        recommendation: "Remove crawler code and use existing source artifacts or explicit source-to-decision entries.",
        createdAt: snapshot.capturedAt
      }));
    }

    if (file.path.startsWith(dotKrnPathPrefix)) {
      findings.push(makeFinding({
        id: `${snapshot.sliceId}:repo-surface:dot-krn:${file.path}`,
        category: "architecture",
        severity: "blocking",
        title: `Forbidden ${dotKrnLabel} runtime truth surface`,
        summary: `The kernel requires store-backed runtime truth, not a ${dotKrnLabel} runtime source of truth.`,
        evidenceRefs: [fileEvidence(file)],
        recommendation: "Move durable runtime truth to the Postgres-backed brain store and keep files as audit/export only.",
        createdAt: snapshot.capturedAt
      }));
    }
  }

  return findings;
};

export const runArchitectureDriftAudit = (snapshot: AuditRepoSnapshot): AuditFinding[] =>
  snapshot.files
    .filter((file) => contentIncludes(file, [
      `${rejectedPatternSubsystemLabel} as a required product subsystem`,
      `${rejectedResearchSubsystemLabel} as a product subsystem`,
      `meta-${"researcher"} runtime`,
      `auto${"research"} product behavior`
    ]))
    .map((file) => makeFinding({
      id: `${snapshot.sliceId}:architecture-drift:${file.path}`,
      category: "architecture",
      severity: "blocking",
      title: "Architecture drift toward rejected subsystem",
      summary: "The file describes a subsystem that the controlled plan explicitly removed from product architecture.",
      evidenceRefs: [fileEvidence(file)],
      recommendation: "Restate the idea as decision evidence, a candidate, or a normal eval fixture instead of a subsystem.",
      createdAt: snapshot.capturedAt
    }));

export const runBoundaryAudit = (snapshot: AuditRepoSnapshot): AuditFinding[] => {
  const findings: AuditFinding[] = [];

  for (const file of snapshot.files.filter(isProductionFile)) {
    if (
      file.path.startsWith("packages/core/src/") &&
      contentIncludes(file, coreRuntimeImportPatterns)
    ) {
      findings.push(makeFinding({
        id: `${snapshot.sliceId}:boundary:core-runtime:${file.path}`,
        category: "boundary",
        severity: "blocking",
        title: "Core imports forbidden runtime boundary",
        summary: "packages/core must remain pure and cannot import filesystem, process, shell, network, DB, or CLI runtime APIs.",
        evidenceRefs: [fileEvidence(file)],
        recommendation: "Move runtime adapter behavior to cli/db/harness boundaries and keep core as pure types and logic.",
        createdAt: snapshot.capturedAt
      }));
    }

    if (
      file.path.startsWith("packages/core/src/") &&
      contentIncludes(file, coreSchemaImportPatterns)
    ) {
      findings.push(makeFinding({
        id: `${snapshot.sliceId}:boundary:core-schema:${file.path}`,
        category: "boundary",
        severity: "blocking",
        title: "Core imports schema validation dependency",
        summary: "packages/schema owns Zod IO validation; packages/core owns pure contracts.",
        evidenceRefs: [fileEvidence(file)],
        recommendation: "Keep the domain type in core and put runtime parsing in packages/schema.",
        createdAt: snapshot.capturedAt
      }));
    }

    if (
      file.path.startsWith("packages/schema/src/") &&
      contentIncludes(file, schemaDbImportPatterns)
    ) {
      findings.push(makeFinding({
        id: `${snapshot.sliceId}:boundary:schema-db:${file.path}`,
        category: "boundary",
        severity: "blocking",
        title: "Schema imports DB boundary",
        summary: "packages/schema must not depend on persistence adapters or Drizzle schema.",
        evidenceRefs: [fileEvidence(file)],
        recommendation: "Keep database mapping in packages/db and schema parsing in packages/schema.",
        createdAt: snapshot.capturedAt
      }));
    }
  }

  return findings;
};

export const runTypeSafetyAudit = (snapshot: AuditRepoSnapshot): AuditFinding[] => {
  const findings: AuditFinding[] = [];

  for (const file of snapshot.files.filter(isProductionFile)) {
    if (unsafeTopTypePattern.test(file.content) || unsafeTopTypeCastPattern.test(file.content)) {
      findings.push(makeFinding({
        id: `${snapshot.sliceId}:type-safety:${unsafeTopType}:${file.path}`,
        category: "type_safety",
        severity: "warning",
        title: uncheckedUnsafeTopTypeTitle,
        summary: "The file contains an unchecked top-type shortcut that weakens KRN's strict TypeScript boundary discipline.",
        evidenceRefs: [fileEvidence(file)],
        recommendation: "Use unknown at boundaries, explicit types, or isolated justified narrowing.",
        createdAt: snapshot.capturedAt
      }));
    }

    if (/JSON\.parse\s*\(/.test(file.content)) {
      findings.push(makeFinding({
        id: `${snapshot.sliceId}:type-safety:json-parse:${file.path}`,
        category: "type_safety",
        severity: "warning",
        title: "Unchecked JSON.parse boundary",
        summary: "JSON.parse returns untrusted data and must be parsed through an IO schema or unknown-first narrowing.",
        evidenceRefs: [fileEvidence(file)],
        recommendation: "Parse to unknown and validate with the owning schema package before use.",
        createdAt: snapshot.capturedAt
      }));
    }
  }

  return findings;
};

export const runMemorySemanticsAudit = (snapshot: AuditRepoSnapshot): AuditFinding[] => {
  const findings: AuditFinding[] = [];

  for (const candidate of snapshot.memoryCandidates ?? []) {
    if (candidate.autoPromotesToMemory) {
      findings.push(makeFinding({
        id: `${snapshot.sliceId}:memory:auto-promote:${candidate.id}`,
        category: "memory_semantics",
        severity: "blocking",
        title: "Memory candidate can auto-promote",
        summary: "Reflection or feedback candidates must not mutate Memory Core without review and promotion.",
        evidenceRefs: [candidate.id],
        recommendation: "Route candidate promotion through the review gate and preserve candidate-only semantics.",
        createdAt: snapshot.capturedAt
      }));
    }

    if (candidate.sourceLineageCount === 0 && candidate.sourceClaimCount === 0) {
      findings.push(makeFinding({
        id: `${snapshot.sliceId}:memory:lineage:${candidate.id}`,
        category: "memory_semantics",
        severity: "warning",
        title: "Memory candidate lacks lineage",
        summary: "Memory needs source lineage or source claims before it can become reviewed Memory Core.",
        evidenceRefs: [candidate.id],
        recommendation: "Attach source lineage or keep the candidate as an explicit unsourced operator note where allowed.",
        createdAt: snapshot.capturedAt
      }));
    }

    if (!candidate.hasApplicationGuidance) {
      findings.push(makeFinding({
        id: `${snapshot.sliceId}:memory:guidance:${candidate.id}`,
        category: "memory_semantics",
        severity: "warning",
        title: "Memory candidate lacks application guidance",
        summary: "Memory must describe when and how Codex should apply it.",
        evidenceRefs: [candidate.id],
        recommendation: "Add concise application guidance before promotion review.",
        createdAt: snapshot.capturedAt
      }));
    }

    if (candidate.isTemporal && !candidate.hasInvalidationStrategy) {
      findings.push(makeFinding({
        id: `${snapshot.sliceId}:memory:invalidation:${candidate.id}`,
        category: "memory_semantics",
        severity: "warning",
        title: "Temporal memory candidate lacks invalidation strategy",
        summary: "Temporal memory needs validity or invalidation behavior to avoid stale activation.",
        evidenceRefs: [candidate.id],
        recommendation: "Add validUntil, revisitWhen, or an invalidation rule before promotion review.",
        createdAt: snapshot.capturedAt
      }));
    }
  }

  return findings;
};

export const runSourceGroundingAudit = (snapshot: AuditRepoSnapshot): AuditFinding[] => {
  const findings: AuditFinding[] = [];

  for (const claim of snapshot.sourceClaims ?? []) {
    if (
      !hasText(claim.mechanism) ||
      !hasText(claim.krnImplication) ||
      !hasText(claim.doesNotProve) ||
      !hasText(claim.consumer)
    ) {
      findings.push(makeFinding({
        id: `${snapshot.sliceId}:source-claim:fields:${claim.id}`,
        category: "source_grounding",
        severity: "blocking",
        title: "Source claim lacks source-to-decision fields",
        summary: "Retained sources require mechanism, KRN implication, doesNotProve, and consumer fields.",
        evidenceRefs: [claim.id],
        recommendation: "Complete the source-to-decision fields or reject the source as decorative.",
        createdAt: snapshot.capturedAt
      }));
    }
  }

  for (const decision of snapshot.sourceDecisions ?? []) {
    if (!decision.sourceClaimId) {
      findings.push(makeFinding({
        id: `${snapshot.sliceId}:source-decision:claim:${decision.id}`,
        category: "source_grounding",
        severity: "blocking",
        title: "Source decision lacks source claim",
        summary: "Source-backed decisions must point to source claims rather than decorative references.",
        evidenceRefs: [decision.id],
        recommendation: "Link the decision to a source claim or record it as an unsupported/rejected decision.",
        createdAt: snapshot.capturedAt
      }));
    }

    if (!hasText(decision.falsifier) || !hasText(decision.consumer)) {
      findings.push(makeFinding({
        id: `${snapshot.sliceId}:source-decision:falsifier:${decision.id}`,
        category: "source_grounding",
        severity: "warning",
        title: "Source decision lacks falsifier or consumer",
        summary: "KRN decisions need a consumer and a falsifier to avoid source hoarding.",
        evidenceRefs: [decision.id],
        recommendation: "Add a concrete consumer and falsifier for the decision.",
        createdAt: snapshot.capturedAt
      }));
    }
  }

  return findings;
};

export const runEvalTheaterAudit = (snapshot: AuditRepoSnapshot): AuditFinding[] =>
  (snapshot.evalCandidates ?? [])
    .filter((candidate) => !candidate.protectsRealBehavior || candidate.sourceEvidenceCount === 0)
    .map((candidate) => makeFinding({
      id: `${snapshot.sliceId}:eval:behavior:${candidate.id}`,
      category: "eval",
      severity: "warning",
      title: "Eval candidate lacks protected behavior",
      summary: "Golden memory behavior tests must protect real behavior with evidence, not benchmark theater.",
      evidenceRefs: [candidate.id],
      recommendation: "Define the behavior being protected and attach source evidence before promotion.",
      createdAt: snapshot.capturedAt
    }));

export const runHandoffCompactAudit = (snapshot: AuditRepoSnapshot): AuditFinding[] => {
  const handoff = snapshot.handoff;

  if (!handoff || !handoff.exists) {
    return [makeFinding({
      id: `${snapshot.sliceId}:handoff:missing`,
      category: "handoff",
      severity: "warning",
      title: "Handoff compact missing",
      summary: "A slice handoff should preserve last good state, evidence, rollback, and next action.",
      evidenceRefs: [snapshot.sliceId],
      recommendation: "Create a compact handoff or AuditBundle summary for the slice.",
      createdAt: snapshot.capturedAt
    })];
  }

  const findings: AuditFinding[] = [];
  const checks: readonly [boolean, string, string, string][] = [
    [handoff.includesLastGoodCommit, "last-good-commit", "Handoff omits last good commit", "Record the last verified commit."],
    [handoff.includesChangedFiles, "changed-files", "Handoff omits changed files", "Record changed files or explicitly state none."],
    [handoff.includesVerification, "verification", "Handoff omits verification", "Record verification commands and outcomes."],
    [handoff.includesRollbackPath, "rollback", "Handoff omits rollback path", "Record the rollback path for the slice."],
    [handoff.includesNextAction, "next-action", "Handoff omits next action", "Record the next safest action."]
  ];

  for (const [passed, key, title, recommendation] of checks) {
    if (!passed) {
      findings.push(makeFinding({
        id: `${snapshot.sliceId}:handoff:${key}`,
        category: "handoff",
        severity: "warning",
        title,
        summary: "The compact handoff is missing required resume evidence.",
        evidenceRefs: [snapshot.sliceId],
        recommendation,
        createdAt: snapshot.capturedAt
      }));
    }
  }

  return findings;
};

export const runAuditChecks = (snapshot: AuditRepoSnapshot): AuditCheckResult => ({
  repoSurfaceFindings: runRepoSurfaceAudit(snapshot),
  architectureFindings: runArchitectureDriftAudit(snapshot),
  boundaryFindings: runBoundaryAudit(snapshot),
  typeSafetyFindings: runTypeSafetyAudit(snapshot),
  memorySemanticsFindings: runMemorySemanticsAudit(snapshot),
  sourceGroundingFindings: runSourceGroundingAudit(snapshot),
  evalFindings: runEvalTheaterAudit(snapshot),
  handoffFindings: runHandoffCompactAudit(snapshot)
});
