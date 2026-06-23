import type {
  AuditFinding,
  AuditFindingCategory,
  AuditFindingSeverity,
  AuditFindingStatus,
  SourceSupportType,
  SourceTrustTier
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

export interface AuditMemoryRecordSnapshot {
  id: string;
  summary: string;
  status: "active" | "deprecated" | "stale" | "invalidated" | "superseded";
  confidence?: number;
  positiveFeedbackCount: number;
  negativeFeedbackCount: number;
  sourceLineageCount?: number;
  sourceClaimCount?: number;
  hasApplicationGuidance?: boolean;
  hasInvalidationStrategy: boolean;
  isTemporal?: boolean;
}

export interface AuditSourceClaimSnapshot {
  id: string;
  claim: string;
  mechanism: string;
  krnImplication: string;
  doesNotProve: string;
  consumer: string;
  trustTier?: SourceTrustTier;
  supportType?: SourceSupportType;
  revisitWhen?: string;
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

export interface AuditObservationGroupSnapshot {
  id: string;
  projectId?: string;
  executionRunId?: string;
  source: string;
  summary: string;
}

export interface AuditActivationDecisionSnapshot {
  id: string;
  subjectType: string;
  subjectId: string;
  decision: "included" | "excluded" | "abstained" | "deferred" | "conflict" | "stale";
  reason: string;
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
  memoryRecords?: readonly AuditMemoryRecordSnapshot[];
  sourceClaims?: readonly AuditSourceClaimSnapshot[];
  sourceDecisions?: readonly AuditSourceDecisionSnapshot[];
  evalCandidates?: readonly AuditEvalCandidateSnapshot[];
  observationGroups?: readonly AuditObservationGroupSnapshot[];
  activationDecisions?: readonly AuditActivationDecisionSnapshot[];
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
  verificationFindings: AuditFinding[];
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
const importFromColocatedTestPattern =
  /\b(?:import|export)\b[\s\S]*?\bfrom\s+["'][^"']*(?:\.test|\.spec|\/__tests__\/)[^"']*["']/;
const importFromFixturePathPattern =
  /\b(?:import|export)\b[\s\S]*?\bfrom\s+["'][^"']*(?:tests\/fixtures|\/fixtures\/)[^"']*["']/;
const packageBarrelPathPattern = /^packages\/[^/]+\/src\/(?:.*\/)?index\.ts$/;
const testHelperExportPattern =
  /\bexport\b[\s\S]*?\bfrom\s+["'][^"']*(?:\.test|\.spec|test-helper|testHelper|TestHelper|fixture-helper|fixtureHelper|FixtureHelper)[^"']*["']/;

const decisionGradeSourceSupportTypes = new Set<SourceSupportType>([
  "mechanism",
  "decision",
  "risk",
  "rejection",
  "eval-design",
  "implementation-boundary",
  "contradicts"
]);

const isPastTime = (value: string | undefined, now: string): boolean => {
  if (value === undefined) {
    return false;
  }

  const valueTime = Date.parse(value);
  const nowTime = Date.parse(now);

  if (!Number.isFinite(valueTime) || !Number.isFinite(nowTime)) {
    return false;
  }

  return valueTime < nowTime;
};

export const runRepoSurfaceAudit = (snapshot: AuditRepoSnapshot): AuditFinding[] => {
  const findings: AuditFinding[] = [];

  for (const file of snapshot.files) {
    const filePath = lower(file.path);

    if (
      filePath.includes(`packages/${rejectedResearchSubsystem}`) ||
      filePath.includes(`apps/${rejectedResearchSubsystem}`)
    ) {
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

    if (
      filePath.includes(`packages/${rejectedPatternSubsystem}`) ||
      filePath.includes(`apps/${rejectedPatternSubsystem}`)
    ) {
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

    if (filePath.includes(forbiddenCrawlerPath) || filePath.includes(`source${"crawler"}`)) {
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
    .filter((file) => {
      const rejectedTerms = [
        rejectedPatternSubsystemLabel,
        rejectedResearchSubsystemLabel,
        `meta-${"researcher"} runtime`,
        `auto${"research"} product behavior`
      ];
      const adoptionTerms = [
        "add",
        "build",
        "create",
        "creates",
        "introduce",
        "reintroduce",
        "required",
        "must implement"
      ];
      const rejectionTerms = [
        "do not",
        "no ",
        "must not",
        "cannot",
        "remove",
        "reject",
        "rejected",
        "forbidden",
        "non-goal",
        "non-goals",
        "proves no",
        "without",
        "evidence:",
        "previous",
        "prior"
      ];

      return file.content
        .split("\n")
        .map(lower)
        .some((line) =>
          rejectedTerms.some((term) => line.includes(lower(term))) &&
          adoptionTerms.some((term) => line.includes(term)) &&
          !rejectionTerms.some((term) => line.includes(term))
        );
    })
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
    if (importFromColocatedTestPattern.test(file.content)) {
      findings.push(makeFinding({
        id: `${snapshot.sliceId}:boundary:production-imports-test:${file.path}`,
        category: "boundary",
        severity: "blocking",
        title: "Production imports colocated test file",
        summary: "Colocated tests are allowed only when production code never imports test modules.",
        evidenceRefs: [fileEvidence(file)],
        recommendation: "Move shared behavior into a production module or keep the helper private to tests.",
        createdAt: snapshot.capturedAt
      }));
    }

    if (packageBarrelPathPattern.test(file.path) && testHelperExportPattern.test(file.content)) {
      findings.push(makeFinding({
        id: `${snapshot.sliceId}:boundary:barrel-exports-test-helper:${file.path}`,
        category: "boundary",
        severity: "blocking",
        title: "Package barrel exports test helper",
        summary: "Package public barrels must not expose colocated test helpers, fixture helpers, or spec modules as runtime API.",
        evidenceRefs: [fileEvidence(file)],
        recommendation: "Keep test helpers inside test files or a test-only fixture path that is not exported by the package index.",
        createdAt: snapshot.capturedAt
      }));
    }

    if (importFromFixturePathPattern.test(file.content)) {
      findings.push(makeFinding({
        id: `${snapshot.sliceId}:boundary:production-imports-fixture:${file.path}`,
        category: "boundary",
        severity: "blocking",
        title: "Production imports fixture path",
        summary: "Repo fixtures are test/seed material and must not become runtime truth through production imports.",
        evidenceRefs: [fileEvidence(file)],
        recommendation: "Move runtime data behind a schema/database boundary or keep fixtures in tests and explicit seed scripts.",
        createdAt: snapshot.capturedAt
      }));
    }

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

  for (const memoryRecord of snapshot.memoryRecords ?? []) {
    if (
      memoryRecord.status === "stale" &&
      memoryRecord.confidence !== undefined &&
      memoryRecord.confidence >= 85
    ) {
      findings.push(makeFinding({
        id: `${snapshot.sliceId}:memory:stale-high-confidence:${memoryRecord.id}`,
        category: "memory_semantics",
        severity: "blocking",
        title: "Stale high-confidence memory remains reviewable",
        summary: "High-confidence stale memory must be reviewed, invalidated, or demoted instead of remaining an ambiguous trusted record.",
        evidenceRefs: [memoryRecord.id],
        recommendation: "Route the stale memory through review and update its validity, invalidation status, or confidence before activation.",
        createdAt: snapshot.capturedAt
      }));
    }

    if (
      memoryRecord.status === "active" &&
      memoryRecord.sourceLineageCount === 0 &&
      memoryRecord.sourceClaimCount === 0
    ) {
      findings.push(makeFinding({
        id: `${snapshot.sliceId}:memory:record-lineage:${memoryRecord.id}`,
        category: "memory_semantics",
        severity: "blocking",
        title: "Active memory lacks lineage",
        summary: "Active Memory Core records need source lineage or source claims unless they are explicitly modeled as allowed operator/user preference notes.",
        evidenceRefs: [memoryRecord.id],
        recommendation: "Attach source lineage/source claims or demote the record for review before it can be activated.",
        createdAt: snapshot.capturedAt
      }));
    }

    if (memoryRecord.status === "active" && memoryRecord.negativeFeedbackCount >= 3) {
      findings.push(makeFinding({
        id: `${snapshot.sliceId}:memory:negative-feedback:${memoryRecord.id}`,
        category: "memory_semantics",
        severity: "blocking",
        title: "Active memory has unresolved negative feedback",
        summary: "Repeated hurt/stale feedback must surface a review-required demotion or invalidation action instead of remaining a passive counter.",
        evidenceRefs: [memoryRecord.id],
        recommendation: "Create a review-required demotion/invalidation candidate or invalidate the memory through the governed review path.",
        createdAt: snapshot.capturedAt
      }));
    }

    if (
      memoryRecord.status === "active" &&
      memoryRecord.positiveFeedbackCount === 0 &&
      memoryRecord.negativeFeedbackCount === 0
    ) {
      findings.push(makeFinding({
        id: `${snapshot.sliceId}:memory:no-application-feedback:${memoryRecord.id}`,
        category: "memory_semantics",
        severity: "warning",
        title: "Active memory has no application feedback",
        summary: "Active memory without application feedback has not yet proven usefulness in KRN runs.",
        evidenceRefs: [memoryRecord.id],
        recommendation: "Capture application feedback during activation or treat the record as lower-confidence until it is proven useful.",
        createdAt: snapshot.capturedAt
      }));
    }

    if (memoryRecord.hasApplicationGuidance === false) {
      findings.push(makeFinding({
        id: `${snapshot.sliceId}:memory:record-guidance:${memoryRecord.id}`,
        category: "memory_semantics",
        severity: "warning",
        title: "Memory record lacks application guidance",
        summary: "Memory records must explain when Codex should apply them, not only store a fact.",
        evidenceRefs: [memoryRecord.id],
        recommendation: "Add concise application guidance or demote the record for review.",
        createdAt: snapshot.capturedAt
      }));
    }

    if (memoryRecord.isTemporal === true && !memoryRecord.hasInvalidationStrategy) {
      findings.push(makeFinding({
        id: `${snapshot.sliceId}:memory:record-invalidation:${memoryRecord.id}`,
        category: "memory_semantics",
        severity: "warning",
        title: "Temporal memory record lacks invalidation strategy",
        summary: "Temporal Memory Core records need validity or invalidation behavior to avoid stale activation.",
        evidenceRefs: [memoryRecord.id],
        recommendation: "Add validUntil, revisitWhen, or an invalidation rule before activation depends on this record.",
        createdAt: snapshot.capturedAt
      }));
    }
  }

  return findings;
};

export const runSourceGroundingAudit = (snapshot: AuditRepoSnapshot): AuditFinding[] => {
  const findings: AuditFinding[] = [];
  const decisionsByClaimId = new Map<string, AuditSourceDecisionSnapshot[]>();
  const claimsById = new Map<string, AuditSourceClaimSnapshot>();

  for (const claim of snapshot.sourceClaims ?? []) {
    claimsById.set(claim.id, claim);
  }

  for (const decision of snapshot.sourceDecisions ?? []) {
    if (decision.sourceClaimId === undefined) {
      continue;
    }

    const existing = decisionsByClaimId.get(decision.sourceClaimId) ?? [];
    decisionsByClaimId.set(decision.sourceClaimId, [...existing, decision]);
  }

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

    if (
      claim.supportType !== undefined &&
      !decisionGradeSourceSupportTypes.has(claim.supportType)
    ) {
      findings.push(makeFinding({
        id: `${snapshot.sliceId}:source-claim:decorative-support:${claim.id}`,
        category: "source_grounding",
        severity: "blocking",
        title: "Source claim has decorative support type",
        summary: "Accepted source graph records must support decisions with mechanism, risk, rejection, eval, boundary, or contradiction semantics.",
        evidenceRefs: [claim.id],
        recommendation: "Reject decorative/background sources or rewrite them as decision-grade source claims.",
        createdAt: snapshot.capturedAt
      }));
    }

    if (claim.status === "accepted" && isPastTime(claim.revisitWhen, snapshot.capturedAt)) {
      findings.push(makeFinding({
        id: `${snapshot.sliceId}:source-claim:stale:${claim.id}`,
        category: "source_grounding",
        severity: "warning",
        title: "Accepted source claim is stale",
        summary: "Accepted source claims past revisitWhen need review before they keep guiding memory or activation behavior.",
        evidenceRefs: [claim.id],
        recommendation: "Review, refresh, deprecate, or replace the stale source claim before relying on it.",
        createdAt: snapshot.capturedAt
      }));
    }

    if (
      claim.status === "accepted" &&
      hasText(claim.consumer) &&
      (decisionsByClaimId.get(claim.id)?.length ?? 0) === 0
    ) {
      findings.push(makeFinding({
        id: `${snapshot.sliceId}:source-claim:no-decision:${claim.id}`,
        category: "source_grounding",
        severity: "warning",
        title: "Accepted source claim has no source decision",
        summary: "Accepted source claims without decisions become source hoarding instead of source-to-decision evidence.",
        evidenceRefs: [claim.id],
        recommendation: "Link the claim to a SourceDecision or demote it until a decision consumer exists.",
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

    if (decision.sourceClaimId !== undefined) {
      const sourceClaim = claimsById.get(decision.sourceClaimId);

      if (sourceClaim?.status === "rejected" || sourceClaim?.status === "deprecated") {
        findings.push(makeFinding({
          id: `${snapshot.sliceId}:source-decision:rejected-claim:${decision.id}`,
          category: "source_grounding",
          severity: "blocking",
          title: "Source decision uses rejected claim",
          summary: "Rejected or deprecated SourceClaims must not remain attached to active SourceDecision records.",
          evidenceRefs: [decision.id, decision.sourceClaimId],
          recommendation: "Create a new accepted SourceClaim with evidence or remove the invalid decision support edge.",
          createdAt: snapshot.capturedAt
        }));
      }
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

export const runSliceEvidenceAudit = (snapshot: AuditRepoSnapshot): AuditFinding[] => {
  const findings: AuditFinding[] = [];

  if (snapshot.changedFiles.length === 0) {
    return findings;
  }

  if (snapshot.intendedFiles.length === 0) {
    findings.push(makeFinding({
      id: `${snapshot.sliceId}:verification:intended-files:missing`,
      category: "verification",
      severity: "warning",
      title: "Audit snapshot lacks intended files",
      summary: "Slice audits need intended file scope to distinguish planned changes from drift.",
      evidenceRefs: [snapshot.sliceId],
      recommendation: "Pass intended files from the AuditBundle or explicit audit CLI options.",
      createdAt: snapshot.capturedAt
    }));
  }

  if (snapshot.verificationCommands.length === 0) {
    findings.push(makeFinding({
      id: `${snapshot.sliceId}:verification:commands:missing`,
      category: "verification",
      severity: "warning",
      title: "Audit snapshot lacks verification commands",
      summary: "Slice audits need verification command results to avoid treating file scans as proof of behavior.",
      evidenceRefs: [snapshot.sliceId],
      recommendation: "Pass verification command results from the AuditBundle or explicit audit CLI options.",
      createdAt: snapshot.capturedAt
    }));
  }

  const intended = new Set(snapshot.intendedFiles);

  if (intended.size > 0) {
    for (const changedFile of snapshot.changedFiles) {
      if (!intended.has(changedFile)) {
        findings.push(makeFinding({
          id: `${snapshot.sliceId}:verification:unexpected-file:${changedFile}`,
          category: "verification",
          severity: "warning",
          title: "Changed file outside intended slice scope",
          summary: "A changed file is not listed in the intended slice scope.",
          evidenceRefs: [changedFile],
          recommendation: "Add the file to intended scope or move the change into a separate slice.",
          createdAt: snapshot.capturedAt
        }));
      }
    }
  }

  for (const command of snapshot.verificationCommands) {
    if (command.status === "failed") {
      findings.push(makeFinding({
        id: `${snapshot.sliceId}:verification:command-failed:${command.command}`,
        category: "verification",
        severity: "blocking",
        title: "Verification command failed",
        summary: "A reported verification command failed and must be resolved before the slice can pass.",
        evidenceRefs: [command.command],
        recommendation: "Fix the failure or mark the slice blocked with the failing output.",
        createdAt: snapshot.capturedAt
      }));
    }

    if (command.status === "missing") {
      findings.push(makeFinding({
        id: `${snapshot.sliceId}:verification:command-missing:${command.command}`,
        category: "verification",
        severity: "warning",
        title: "Verification command output missing",
        summary: "A required verification command was listed without captured output/status proof.",
        evidenceRefs: [command.command],
        recommendation: "Run the command and attach the result, or explicitly mark it skipped with reason in the AuditBundle.",
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
  verificationFindings: runSliceEvidenceAudit(snapshot),
  handoffFindings: runHandoffCompactAudit(snapshot)
});
