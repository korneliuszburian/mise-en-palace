import {
  bigint,
  boolean,
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm/sql";

import {
  activationRuntimeProofStatuses,
  contextAssemblyStatuses,
  evidenceBundleStatuses,
  executionRunStatuses,
  feedbackDeltaStatuses,
  harnessPlanStatuses,
  operatorIntentStatuses,
  persistedUsefulnessApplicationSubjectKinds,
  reviewAssessmentStatuses,
  taskContractStatuses
} from "@krn/core";
import type { UsefulnessApplicationTargetState } from "@krn/core";

import {
  byteaColumn,
  createdAtColumn,
  jsonListColumn,
  jsonObjectColumn,
  metadataColumn,
  updatedAtColumn
} from "./columns.js";

export const operatorIntentStatus = pgEnum("operator_intent_status", operatorIntentStatuses);

export const taskContractStatus = pgEnum("task_contract_status", taskContractStatuses);

export const harnessPlanStatus = pgEnum("harness_plan_status", harnessPlanStatuses);

export const contextAssemblyStatus = pgEnum("context_assembly_status", contextAssemblyStatuses);

export const executionRunStatus = pgEnum("execution_run_status", executionRunStatuses);

export const evidenceBundleStatus = pgEnum("evidence_bundle_status", evidenceBundleStatuses);

export const activationRuntimeProofStatus = pgEnum(
  "activation_runtime_proof_status",
  activationRuntimeProofStatuses
);

export const reviewAssessmentStatus = pgEnum("review_assessment_status", reviewAssessmentStatuses);

export const feedbackDeltaStatus = pgEnum("feedback_delta_status", feedbackDeltaStatuses);

export const usefulnessApplicationSubjectKind = pgEnum(
  "usefulness_application_subject_kind",
  persistedUsefulnessApplicationSubjectKinds
);

export const workspaces = pgTable(
  "workspaces",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    displayName: text("display_name").notNull(),
    metadata: metadataColumn(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn()
  },
  (table) => [
    uniqueIndex("workspaces_slug_unique").on(table.slug)
  ]
);

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    displayName: text("display_name").notNull(),
    description: text("description"),
    metadata: metadataColumn(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn()
  },
  (table) => [
    uniqueIndex("projects_workspace_slug_unique").on(table.workspaceId, table.slug),
    index("projects_workspace_id_idx").on(table.workspaceId)
  ]
);

export const repoInstallations = pgTable(
  "repo_installations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    repoUrl: text("repo_url").notNull(),
    defaultBranch: text("default_branch").notNull(),
    repoFingerprint: text("repo_fingerprint"),
    localPathHint: text("local_path_hint"),
    metadata: metadataColumn(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn()
  },
  (table) => [
    index("repo_installations_project_id_idx").on(table.projectId),
    index("repo_installations_local_path_hint_idx").on(table.localPathHint),
    uniqueIndex("repo_installations_repo_fingerprint_unique").on(table.repoFingerprint),
    uniqueIndex("repo_installations_project_repo_unique").on(table.projectId, table.repoUrl)
  ]
);

export const projectKernels = pgTable(
  "project_kernels",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    version: integer("version").notNull().default(1),
    summary: text("summary").notNull(),
    activeContextRule: text("active_context_rule").notNull(),
    metadata: metadataColumn(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn()
  },
  (table) => [
    index("project_kernels_project_id_idx").on(table.projectId),
    uniqueIndex("project_kernels_project_version_unique").on(table.projectId, table.version)
  ]
);

export const operatorIntents = pgTable(
  "operator_intents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
    source: text("source").notNull(),
    rawIntent: text("raw_intent").notNull(),
    normalizedIntent: text("normalized_intent"),
    status: operatorIntentStatus("status").notNull().default("received"),
    metadata: metadataColumn(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn()
  },
  (table) => [
    index("operator_intents_workspace_id_idx").on(table.workspaceId),
    index("operator_intents_project_id_idx").on(table.projectId),
    index("operator_intents_status_idx").on(table.status)
  ]
);

export const taskContracts = pgTable(
  "task_contracts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    operatorIntentId: uuid("operator_intent_id")
      .notNull()
      .references(() => operatorIntents.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    objective: text("objective").notNull(),
    constraints: jsonListColumn("constraints"),
    nonGoals: jsonListColumn("non_goals"),
    acceptance: jsonListColumn("acceptance"),
    status: taskContractStatus("status").notNull().default("draft"),
    metadata: metadataColumn(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn()
  },
  (table) => [
    index("task_contracts_operator_intent_id_idx").on(table.operatorIntentId),
    index("task_contracts_project_id_idx").on(table.projectId),
    index("task_contracts_status_idx").on(table.status)
  ]
);

export const harnessPlans = pgTable(
  "harness_plans",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    taskContractId: uuid("task_contract_id")
      .notNull()
      .references(() => taskContracts.id, { onDelete: "cascade" }),
    version: integer("version").notNull().default(1),
    status: harnessPlanStatus("status").notNull().default("draft"),
    summary: text("summary").notNull(),
    nextAction: text("next_action"),
    metadata: metadataColumn(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn()
  },
  (table) => [
    index("harness_plans_task_contract_id_idx").on(table.taskContractId),
    index("harness_plans_status_idx").on(table.status),
    uniqueIndex("harness_plans_contract_version_unique").on(table.taskContractId, table.version)
  ]
);

export const contextAssemblies = pgTable(
  "context_assemblies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    harnessPlanId: uuid("harness_plan_id")
      .notNull()
      .references(() => harnessPlans.id, { onDelete: "cascade" }),
    status: contextAssemblyStatus("status").notNull().default("assembled"),
    tokenBudget: integer("token_budget"),
    inclusionCount: integer("inclusion_count").notNull().default(0),
    exclusionCount: integer("exclusion_count").notNull().default(0),
    selectedContext: jsonObjectColumn("selected_context"),
    excludedContext: jsonObjectColumn("excluded_context"),
    metadata: metadataColumn(),
    createdAt: createdAtColumn()
  },
  (table) => [
    index("context_assemblies_harness_plan_id_idx").on(table.harnessPlanId),
    index("context_assemblies_status_idx").on(table.status)
  ]
);

export const executionRuns = pgTable(
  "execution_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    harnessPlanId: uuid("harness_plan_id")
      .notNull()
      .references(() => harnessPlans.id, { onDelete: "cascade" }),
    adapter: text("adapter").notNull(),
    status: executionRunStatus("status").notNull().default("planned"),
    lifecycleRevision: integer("lifecycle_revision").notNull().default(1),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    metadata: metadataColumn(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn()
  },
  (table) => [
    index("execution_runs_harness_plan_id_idx").on(table.harnessPlanId),
    index("execution_runs_status_idx").on(table.status),
    index("execution_runs_adapter_idx").on(table.adapter),
    check("execution_runs_lifecycle_revision_positive", sql`${table.lifecycleRevision} > 0`)
  ]
);

export const decisionPacketIssuances = pgTable(
  "decision_packet_issuances",
  {
    executionRunId: uuid("execution_run_id")
      .primaryKey()
      .references(() => executionRuns.id, { onDelete: "cascade" }),
    packetChecksum: text("packet_checksum").notNull(),
    packetGeneratedAt: timestamp("packet_generated_at", { withTimezone: true }).notNull(),
    sourceRunLifecycleRevision: integer("source_run_lifecycle_revision").notNull(),
    readback: jsonb("readback").notNull(),
    createdAt: createdAtColumn()
  },
  (table) => [
    uniqueIndex("decision_packet_issuances_checksum_unique").on(table.packetChecksum),
    uniqueIndex("decision_packet_issuances_application_identity_unique").on(
      table.executionRunId,
      table.packetChecksum,
      table.packetGeneratedAt,
      table.sourceRunLifecycleRevision
    ),
    check(
      "decision_packet_issuances_packet_checksum_sha256",
      sql`${table.packetChecksum} ~ '^[0-9a-f]{64}$'`
    ),
    check(
      "decision_packet_issuances_lifecycle_revision_positive",
      sql`${table.sourceRunLifecycleRevision} > 0`
    ),
    check(
      "decision_packet_issuances_generated_before_persisted",
      sql`${table.packetGeneratedAt} <= ${table.createdAt}`
    )
  ]
);

export const usefulnessApplications = pgTable(
  "usefulness_applications",
  {
    applicationId: text("application_id").primaryKey(),
    subjectKind: usefulnessApplicationSubjectKind("subject_kind").notNull(),
    subjectId: text("subject_id").notNull(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    executionRunId: uuid("execution_run_id")
      .notNull()
      .references(() => executionRuns.id, { onDelete: "cascade" }),
    taskContractId: uuid("task_contract_id")
      .notNull()
      .references(() => taskContracts.id, { onDelete: "cascade" }),
    packetChecksum: text("packet_checksum").notNull(),
    packetGeneratedAt: timestamp("packet_generated_at", { withTimezone: true }).notNull(),
    sourceRunLifecycleRevision: integer("source_run_lifecycle_revision").notNull(),
    targetState: jsonb("target_state").$type<UsefulnessApplicationTargetState>(),
    appliedAt: timestamp("applied_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: createdAtColumn()
  },
  (table) => [
    foreignKey({
      columns: [
        table.executionRunId,
        table.packetChecksum,
        table.packetGeneratedAt,
        table.sourceRunLifecycleRevision
      ],
      foreignColumns: [
        decisionPacketIssuances.executionRunId,
        decisionPacketIssuances.packetChecksum,
        decisionPacketIssuances.packetGeneratedAt,
        decisionPacketIssuances.sourceRunLifecycleRevision
      ],
      name: "usefulness_applications_decision_packet_issuance_fk"
    }).onDelete("cascade"),
    uniqueIndex("usefulness_applications_packet_subject_unique").on(
      table.executionRunId,
      table.packetChecksum,
      table.subjectKind,
      table.subjectId
    ),
    index("usefulness_applications_project_id_idx").on(table.projectId),
    index("usefulness_applications_task_contract_id_idx").on(table.taskContractId),
    check(
      "usefulness_applications_packet_checksum_sha256",
      sql`${table.packetChecksum} ~ '^[0-9a-f]{64}$'`
    ),
    check(
      "usefulness_applications_lifecycle_revision_positive",
      sql`${table.sourceRunLifecycleRevision} > 0`
    ),
    check(
      "usefulness_applications_applied_after_packet",
      sql`${table.appliedAt} >= ${table.packetGeneratedAt}`
    )
  ]
);

export const evidenceBundles = pgTable(
  "evidence_bundles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    executionRunId: uuid("execution_run_id")
      .notNull()
      .references(() => executionRuns.id, { onDelete: "cascade" }),
    captureIdentity: text("capture_identity"),
    captureChannel: text("capture_channel"),
    status: evidenceBundleStatus("status").notNull().default("draft"),
    changedFiles: jsonListColumn("changed_files"),
    commands: jsonListColumn("commands"),
    diffRisk: text("diff_risk").notNull(),
    reviewBurden: text("review_burden").notNull(),
    rollbackPath: text("rollback_path").notNull(),
    metadata: metadataColumn(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn()
  },
  (table) => [
    index("evidence_bundles_execution_run_id_idx").on(table.executionRunId),
    uniqueIndex("evidence_bundles_execution_capture_identity_unique").on(
      table.executionRunId,
      table.captureIdentity
    ),
    check(
      "evidence_bundles_capture_channel_known",
      sql`${table.captureChannel} is null or ${table.captureChannel} in ('evidence_feedback_v1', 'eval_feedback_v1')`
    ),
    index("evidence_bundles_status_idx").on(table.status)
  ]
);

export const activationRuntimeProofs = pgTable(
  "activation_runtime_proofs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    proofKind: text("proof_kind").notNull().default("activation"),
    scopeKey: text("scope_key").notNull().default("activation"),
    projectId: text("project_id"),
    environmentFingerprintId: text("environment_fingerprint_id").notNull(),
    storeIdentity: text("store_identity").notNull(),
    status: activationRuntimeProofStatus("status").notNull(),
    capturedAt: timestamp("captured_at", { withTimezone: true }).notNull(),
    cleanupRemainingMarkerCount: integer("cleanup_remaining_marker_count").notNull(),
    report: jsonb("report").notNull(),
    createdAt: createdAtColumn()
  },
  (table) => [
    index("activation_runtime_proofs_lookup_idx").on(
      table.proofKind,
      table.scopeKey,
      table.storeIdentity,
      table.environmentFingerprintId,
      table.status,
      table.capturedAt
    ),
    check(
      "activation_runtime_proofs_cleanup_count_nonnegative",
      sql`${table.cleanupRemainingMarkerCount} >= 0`
    ),
    check(
      "activation_runtime_proofs_kind_known",
      sql`${table.proofKind} in ('activation', 'target_repo_harness', 'init_connect', 'codex_adapter')`
    )
  ]
);

export const evidenceCommandArtifacts = pgTable(
  "evidence_command_artifacts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    evidenceBundleId: uuid("evidence_bundle_id")
      .notNull()
      .references(() => evidenceBundles.id, { onDelete: "cascade" }),
    commandOrdinal: integer("command_ordinal").notNull(),
    command: text("command").notNull(),
    exitCode: integer("exit_code").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }).notNull(),
    stdoutBytes: byteaColumn("stdout_bytes").notNull(),
    stderrBytes: byteaColumn("stderr_bytes").notNull(),
    stdoutTotalByteCount: bigint("stdout_total_byte_count", { mode: "number" }).notNull(),
    stderrTotalByteCount: bigint("stderr_total_byte_count", { mode: "number" }).notNull(),
    stdoutTruncated: boolean("stdout_truncated").notNull(),
    stderrTruncated: boolean("stderr_truncated").notNull(),
    stdoutSha256: text("stdout_sha256").notNull(),
    stderrSha256: text("stderr_sha256").notNull(),
    artifactSha256: text("artifact_sha256").notNull(),
    outputRef: text("output_ref").notNull(),
    createdAt: createdAtColumn()
  },
  (table) => [
    uniqueIndex("evidence_command_artifacts_bundle_ordinal_unique").on(
      table.evidenceBundleId,
      table.commandOrdinal
    ),
    uniqueIndex("evidence_command_artifacts_bundle_output_ref_unique").on(
      table.evidenceBundleId,
      table.outputRef
    ),
    check(
      "evidence_command_artifacts_ordinal_nonnegative",
      sql`${table.commandOrdinal} >= 0`
    ),
    check(
      "evidence_command_artifacts_command_nonempty",
      sql`btrim(${table.command}) <> ''`
    ),
    check(
      "evidence_command_artifacts_timestamp_order",
      sql`${table.completedAt} >= ${table.startedAt}`
    ),
    check(
      "evidence_command_artifacts_stdout_byte_count_nonnegative",
      sql`${table.stdoutTotalByteCount} >= 0`
    ),
    check(
      "evidence_command_artifacts_stderr_byte_count_nonnegative",
      sql`${table.stderrTotalByteCount} >= 0`
    ),
    check(
      "evidence_command_artifacts_stdout_byte_cap",
      sql`octet_length(${table.stdoutBytes}) <= 65536`
    ),
    check(
      "evidence_command_artifacts_stderr_byte_cap",
      sql`octet_length(${table.stderrBytes}) <= 65536`
    ),
    check(
      "evidence_command_artifacts_stdout_byte_count_coherent",
      sql`${table.stdoutTotalByteCount} >= octet_length(${table.stdoutBytes})`
    ),
    check(
      "evidence_command_artifacts_stderr_byte_count_coherent",
      sql`${table.stderrTotalByteCount} >= octet_length(${table.stderrBytes})`
    ),
    check(
      "evidence_command_artifacts_stdout_stored_length_exact",
      sql`octet_length(${table.stdoutBytes}) = least(${table.stdoutTotalByteCount}, 65536)`
    ),
    check(
      "evidence_command_artifacts_stderr_stored_length_exact",
      sql`octet_length(${table.stderrBytes}) = least(${table.stderrTotalByteCount}, 65536)`
    ),
    check(
      "evidence_command_artifacts_stdout_truncation_coherent",
      sql`${table.stdoutTruncated} = (${table.stdoutTotalByteCount} > octet_length(${table.stdoutBytes}))`
    ),
    check(
      "evidence_command_artifacts_stderr_truncation_coherent",
      sql`${table.stderrTruncated} = (${table.stderrTotalByteCount} > octet_length(${table.stderrBytes}))`
    ),
    check(
      "evidence_command_artifacts_stdout_sha256_format",
      sql`${table.stdoutSha256} ~ '^[0-9a-f]{64}$'`
    ),
    check(
      "evidence_command_artifacts_stderr_sha256_format",
      sql`${table.stderrSha256} ~ '^[0-9a-f]{64}$'`
    ),
    check(
      "evidence_command_artifacts_sha256_format",
      sql`${table.artifactSha256} ~ '^[0-9a-f]{64}$'`
    ),
    check(
      "evidence_command_artifacts_output_ref_matches_sha256",
      sql`${table.outputRef} = 'command-output:sha256:' || ${table.artifactSha256}`
    )
  ]
);

export const reviewAssessments = pgTable(
  "review_assessments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    evidenceBundleId: uuid("evidence_bundle_id")
      .notNull()
      .references(() => evidenceBundles.id, { onDelete: "cascade" }),
    captureChannel: text("capture_channel"),
    status: reviewAssessmentStatus("status").notNull().default("pending"),
    reviewer: text("reviewer").notNull(),
    summary: text("summary").notNull(),
    findings: jsonListColumn("findings"),
    metadata: metadataColumn(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn()
  },
  (table) => [
    index("review_assessments_evidence_bundle_id_idx").on(table.evidenceBundleId),
    uniqueIndex("review_assessments_evidence_capture_channel_unique").on(
      table.evidenceBundleId,
      table.captureChannel
    ),
    check(
      "review_assessments_capture_channel_known",
      sql`${table.captureChannel} is null or ${table.captureChannel} in ('evidence_feedback_v1', 'eval_feedback_v1', 'review_assess_v1')`
    ),
    index("review_assessments_status_idx").on(table.status)
  ]
);

export const feedbackDeltas = pgTable(
  "feedback_deltas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reviewAssessmentId: uuid("review_assessment_id")
      .notNull()
      .references(() => reviewAssessments.id, { onDelete: "cascade" }),
    captureChannel: text("capture_channel"),
    decisionPacketAuthorityAdmission: text("decision_packet_authority_admission"),
    status: feedbackDeltaStatus("status").notNull().default("candidate"),
    memoryCandidates: jsonListColumn("memory_candidates"),
    sourceDecisions: jsonListColumn("source_decisions"),
    evalCandidates: jsonListColumn("eval_candidates"),
    metadata: metadataColumn(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn()
  },
  (table) => [
    index("feedback_deltas_review_assessment_id_idx").on(table.reviewAssessmentId),
    uniqueIndex("feedback_deltas_review_capture_channel_unique").on(
      table.reviewAssessmentId,
      table.captureChannel
    ),
    check(
      "feedback_deltas_capture_channel_known",
      sql`${table.captureChannel} is null or ${table.captureChannel} in ('evidence_feedback_v1', 'eval_feedback_v1', 'review_assess_v1')`
    ),
    check(
      "feedback_deltas_decision_packet_authority_admission_known",
      sql`${table.decisionPacketAuthorityAdmission} is null or ${table.decisionPacketAuthorityAdmission} = 'current_v1'`
    ),
    index("feedback_deltas_status_idx").on(table.status)
  ]
);

export const pairedLiveEvalEvidence = pgTable(
  "paired_live_eval_evidence",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id").notNull(),
    runId: uuid("run_id").notNull(),
    feedbackDeltaId: uuid("feedback_delta_id"),
    candidateId: text("candidate_id").notNull(),
    candidateStatus: text("candidate_status").notNull().default("candidate"),
    title: text("title").notNull(),
    scenario: text("scenario").notNull(),
    family: text("family").notNull(),
    expectedSignal: text("expected_signal").notNull(),
    artifactStatus: text("artifact_status").notNull(),
    outcome: text("outcome").notNull(),
    usefulnessOutcome: text("usefulness_outcome").notNull(),
    packetChecksum: text("packet_checksum").notNull(),
    packetEvidenceRef: text("packet_evidence_ref").notNull(),
    artifactHash: text("artifact_hash").notNull(),
    artifactRef: text("artifact_ref").notNull(),
    manifestHash: text("manifest_hash").notNull(),
    manifestRef: text("manifest_ref").notNull(),
    checkerRevision: text("checker_revision").notNull(),
    checkerEvidenceRef: text("checker_evidence_ref").notNull(),
    environmentProfileHash: text("environment_profile_hash").notNull(),
    environmentEvidenceRef: text("environment_evidence_ref").notNull(),
    sourceEvidence: jsonListColumn("source_evidence"),
    evidenceRefs: jsonListColumn("evidence_refs"),
    metadata: metadataColumn(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn()
  },
  (table) => [
    uniqueIndex("paired_live_eval_evidence_candidate_unique").on(table.candidateId),
    uniqueIndex("paired_live_eval_evidence_artifact_unique").on(table.artifactHash),
    index("paired_live_eval_evidence_project_idx").on(table.projectId),
    index("paired_live_eval_evidence_run_idx").on(table.runId),
    index("paired_live_eval_evidence_outcome_idx").on(
      table.projectId,
      table.scenario,
      table.outcome,
      table.usefulnessOutcome
    ),
    index("paired_live_eval_evidence_created_idx").on(table.createdAt),
    check(
      "paired_live_eval_evidence_candidate_status_known",
      sql`${table.candidateStatus} = 'candidate'`
    ),
    check(
      "paired_live_eval_evidence_artifact_status_known",
      sql`${table.artifactStatus} in ('passed', 'invalid', 'blocked', 'unverified')`
    ),
    check(
      "paired_live_eval_evidence_outcome_known",
      sql`${table.outcome} in ('win', 'tie', 'loss', 'invalid', 'unknown')`
    ),
    check(
      "paired_live_eval_evidence_usefulness_known",
      sql`${table.usefulnessOutcome} in ('helped', 'neutral', 'hurt', 'unknown')`
    ),
    check(
      "paired_live_eval_evidence_nonpassed_not_helped",
      sql`${table.artifactStatus} = 'passed' or ${table.usefulnessOutcome} <> 'helped'`
    ),
    check(
      "paired_live_eval_evidence_invalid_not_helped",
      sql`${table.outcome} <> 'invalid' or ${table.usefulnessOutcome} <> 'helped'`
    ),
    check(
      "paired_live_eval_evidence_candidate_prefix",
      sql`${table.candidateId} like 'paired-target-repair:%'`
    ),
    check(
      "paired_live_eval_evidence_packet_ref_matches",
      sql`${table.packetEvidenceRef} = 'packet:' || ${table.packetChecksum}`
    ),
    check(
      "paired_live_eval_evidence_artifact_ref_matches",
      sql`${table.artifactRef} = 'artifact:sha256:' || ${table.artifactHash}`
    ),
    check(
      "paired_live_eval_evidence_manifest_ref_matches",
      sql`${table.manifestRef} = 'manifest:sha256:' || ${table.manifestHash}`
    ),
    check(
      "paired_live_eval_evidence_checker_ref_matches",
      sql`${table.checkerEvidenceRef} = 'checker:' || ${table.checkerRevision}`
    ),
    check(
      "paired_live_eval_evidence_environment_ref_matches",
      sql`${table.environmentEvidenceRef} = 'environment:sha256:' || ${table.environmentProfileHash}`
    ),
    check(
      "paired_live_eval_evidence_artifact_hash_format",
      sql`${table.artifactHash} ~ '^[0-9a-f]{64}$'`
    ),
    check(
      "paired_live_eval_evidence_manifest_hash_format",
      sql`${table.manifestHash} ~ '^[0-9a-f]{64}$'`
    )
  ]
);
