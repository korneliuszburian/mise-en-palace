CREATE TABLE `maintenance_queue_records` (
	`id` text PRIMARY KEY DEFAULT (
  lower(hex(randomblob(4))) || '-' ||
  lower(hex(randomblob(2))) || '-4' ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  substr('89ab', abs(random()) % 4 + 1, 1) ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  lower(hex(randomblob(6)))
) NOT NULL,
	`job_type` text NOT NULL,
	`queue_key` text NOT NULL,
	`status` text DEFAULT 'queued' NOT NULL,
	`payload` text DEFAULT '{}' NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`max_attempts` integer DEFAULT 3 NOT NULL,
	`run_after` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`locked_at` integer,
	`locked_by` text,
	`last_error` text,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	CONSTRAINT "maintenance_queue_records_status_enum_check" CHECK("maintenance_queue_records"."status" in ('queued', 'running', 'succeeded', 'skipped', 'dead_letter')),
	CONSTRAINT "maintenance_queue_records_queue_key_non_empty" CHECK(length(trim("maintenance_queue_records"."queue_key")) > 0)
);
--> statement-breakpoint
CREATE INDEX `maintenance_queue_records_job_type_idx` ON `maintenance_queue_records` (`job_type`);--> statement-breakpoint
CREATE UNIQUE INDEX `maintenance_queue_records_queue_key_unique` ON `maintenance_queue_records` (`queue_key`);--> statement-breakpoint
CREATE INDEX `maintenance_queue_records_status_run_after_idx` ON `maintenance_queue_records` (`status`,`run_after`);--> statement-breakpoint
CREATE TABLE `outbox_events` (
	`id` text PRIMARY KEY DEFAULT (
  lower(hex(randomblob(4))) || '-' ||
  lower(hex(randomblob(2))) || '-4' ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  substr('89ab', abs(random()) % 4 + 1, 1) ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  lower(hex(randomblob(6)))
) NOT NULL,
	`topic` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`payload` text DEFAULT '{}' NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`available_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`locked_at` integer,
	`locked_by` text,
	`last_error` text,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	CONSTRAINT "outbox_events_status_enum_check" CHECK("outbox_events"."status" in ('pending', 'processing', 'completed', 'failed', 'dead_letter'))
);
--> statement-breakpoint
CREATE INDEX `outbox_events_topic_idx` ON `outbox_events` (`topic`);--> statement-breakpoint
CREATE INDEX `outbox_events_status_available_at_idx` ON `outbox_events` (`status`,`available_at`);--> statement-breakpoint
CREATE TABLE `run_events` (
	`id` text PRIMARY KEY DEFAULT (
  lower(hex(randomblob(4))) || '-' ||
  lower(hex(randomblob(2))) || '-4' ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  substr('89ab', abs(random()) % 4 + 1, 1) ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  lower(hex(randomblob(6)))
) NOT NULL,
	`execution_run_id` text,
	`sequence` integer NOT NULL,
	`type` text NOT NULL,
	`severity` text DEFAULT 'info' NOT NULL,
	`message` text NOT NULL,
	`payload` text DEFAULT '{}' NOT NULL,
	`occurred_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`execution_run_id`) REFERENCES `execution_runs`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "run_events_severity_enum_check" CHECK("run_events"."severity" in ('debug', 'info', 'warning', 'error'))
);
--> statement-breakpoint
CREATE INDEX `run_events_execution_run_id_idx` ON `run_events` (`execution_run_id`);--> statement-breakpoint
CREATE INDEX `run_events_type_idx` ON `run_events` (`type`);--> statement-breakpoint
CREATE INDEX `run_events_occurred_at_idx` ON `run_events` (`occurred_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `run_events_execution_sequence_unique` ON `run_events` (`execution_run_id`,`sequence`);--> statement-breakpoint
CREATE TABLE `activation_runtime_proofs` (
	`id` text PRIMARY KEY DEFAULT (
  lower(hex(randomblob(4))) || '-' ||
  lower(hex(randomblob(2))) || '-4' ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  substr('89ab', abs(random()) % 4 + 1, 1) ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  lower(hex(randomblob(6)))
) NOT NULL,
	`proof_kind` text DEFAULT 'activation' NOT NULL,
	`scope_key` text DEFAULT 'activation' NOT NULL,
	`project_id` text,
	`environment_fingerprint_id` text NOT NULL,
	`store_identity` text NOT NULL,
	`status` text NOT NULL,
	`captured_at` integer NOT NULL,
	`cleanup_remaining_marker_count` integer NOT NULL,
	`report` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	CONSTRAINT "activation_runtime_proofs_status_enum_check" CHECK("activation_runtime_proofs"."status" in ('passed', 'failed')),
	CONSTRAINT "activation_runtime_proofs_cleanup_count_nonnegative" CHECK("activation_runtime_proofs"."cleanup_remaining_marker_count" >= 0),
	CONSTRAINT "activation_runtime_proofs_kind_known" CHECK("activation_runtime_proofs"."proof_kind" in ('activation', 'target_repo_harness', 'init_connect', 'codex_adapter'))
);
--> statement-breakpoint
CREATE INDEX `activation_runtime_proofs_lookup_idx` ON `activation_runtime_proofs` (`proof_kind`,`scope_key`,`store_identity`,`environment_fingerprint_id`,`status`,`captured_at`);--> statement-breakpoint
CREATE TABLE `context_assemblies` (
	`id` text PRIMARY KEY DEFAULT (
  lower(hex(randomblob(4))) || '-' ||
  lower(hex(randomblob(2))) || '-4' ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  substr('89ab', abs(random()) % 4 + 1, 1) ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  lower(hex(randomblob(6)))
) NOT NULL,
	`harness_plan_id` text NOT NULL,
	`status` text DEFAULT 'assembled' NOT NULL,
	`token_budget` integer,
	`inclusion_count` integer DEFAULT 0 NOT NULL,
	`exclusion_count` integer DEFAULT 0 NOT NULL,
	`selected_context` text DEFAULT '{}' NOT NULL,
	`excluded_context` text DEFAULT '{}' NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`harness_plan_id`) REFERENCES `harness_plans`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "context_assemblies_status_enum_check" CHECK("context_assemblies"."status" in ('assembled', 'abstained', 'stale', 'superseded'))
);
--> statement-breakpoint
CREATE INDEX `context_assemblies_harness_plan_id_idx` ON `context_assemblies` (`harness_plan_id`);--> statement-breakpoint
CREATE INDEX `context_assemblies_status_idx` ON `context_assemblies` (`status`);--> statement-breakpoint
CREATE TABLE `decision_packet_issuances` (
	`execution_run_id` text PRIMARY KEY NOT NULL,
	`packet_checksum` text NOT NULL,
	`packet_generated_at` integer NOT NULL,
	`source_run_lifecycle_revision` integer NOT NULL,
	`readback` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`execution_run_id`) REFERENCES `execution_runs`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "decision_packet_issuances_packet_checksum_sha256" CHECK(length("decision_packet_issuances"."packet_checksum") = 64 AND "decision_packet_issuances"."packet_checksum" NOT GLOB '*[^0-9a-f]*'),
	CONSTRAINT "decision_packet_issuances_lifecycle_revision_positive" CHECK("decision_packet_issuances"."source_run_lifecycle_revision" > 0),
	CONSTRAINT "decision_packet_issuances_generated_before_persisted" CHECK("decision_packet_issuances"."packet_generated_at" <= "decision_packet_issuances"."created_at")
);
--> statement-breakpoint
CREATE UNIQUE INDEX `decision_packet_issuances_checksum_unique` ON `decision_packet_issuances` (`packet_checksum`);--> statement-breakpoint
CREATE UNIQUE INDEX `decision_packet_issuances_application_identity_unique` ON `decision_packet_issuances` (`execution_run_id`,`packet_checksum`,`packet_generated_at`,`source_run_lifecycle_revision`);--> statement-breakpoint
CREATE TABLE `evidence_bundles` (
	`id` text PRIMARY KEY DEFAULT (
  lower(hex(randomblob(4))) || '-' ||
  lower(hex(randomblob(2))) || '-4' ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  substr('89ab', abs(random()) % 4 + 1, 1) ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  lower(hex(randomblob(6)))
) NOT NULL,
	`execution_run_id` text NOT NULL,
	`capture_identity` text,
	`capture_channel` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`changed_files` text DEFAULT '[]' NOT NULL,
	`commands` text DEFAULT '[]' NOT NULL,
	`diff_risk` text NOT NULL,
	`review_burden` text NOT NULL,
	`rollback_path` text NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`execution_run_id`) REFERENCES `execution_runs`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "evidence_bundles_status_enum_check" CHECK("evidence_bundles"."status" in ('draft', 'captured', 'verified', 'rejected')),
	CONSTRAINT "evidence_bundles_capture_channel_known" CHECK("evidence_bundles"."capture_channel" is null or "evidence_bundles"."capture_channel" in ('evidence_feedback_v1', 'eval_feedback_v1'))
);
--> statement-breakpoint
CREATE INDEX `evidence_bundles_execution_run_id_idx` ON `evidence_bundles` (`execution_run_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `evidence_bundles_execution_capture_identity_unique` ON `evidence_bundles` (`execution_run_id`,`capture_identity`);--> statement-breakpoint
CREATE INDEX `evidence_bundles_status_idx` ON `evidence_bundles` (`status`);--> statement-breakpoint
CREATE TABLE `evidence_command_artifacts` (
	`id` text PRIMARY KEY DEFAULT (
  lower(hex(randomblob(4))) || '-' ||
  lower(hex(randomblob(2))) || '-4' ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  substr('89ab', abs(random()) % 4 + 1, 1) ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  lower(hex(randomblob(6)))
) NOT NULL,
	`evidence_bundle_id` text NOT NULL,
	`command_ordinal` integer NOT NULL,
	`command` text NOT NULL,
	`exit_code` integer NOT NULL,
	`started_at` integer NOT NULL,
	`completed_at` integer NOT NULL,
	`stdout_bytes` blob NOT NULL,
	`stderr_bytes` blob NOT NULL,
	`stdout_total_byte_count` integer NOT NULL,
	`stderr_total_byte_count` integer NOT NULL,
	`stdout_truncated` integer NOT NULL,
	`stderr_truncated` integer NOT NULL,
	`stdout_sha256` text NOT NULL,
	`stderr_sha256` text NOT NULL,
	`artifact_sha256` text NOT NULL,
	`output_ref` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`evidence_bundle_id`) REFERENCES `evidence_bundles`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "evidence_command_artifacts_ordinal_nonnegative" CHECK("evidence_command_artifacts"."command_ordinal" >= 0),
	CONSTRAINT "evidence_command_artifacts_command_nonempty" CHECK(trim("evidence_command_artifacts"."command") <> ''),
	CONSTRAINT "evidence_command_artifacts_timestamp_order" CHECK("evidence_command_artifacts"."completed_at" >= "evidence_command_artifacts"."started_at"),
	CONSTRAINT "evidence_command_artifacts_stdout_byte_count_nonnegative" CHECK("evidence_command_artifacts"."stdout_total_byte_count" >= 0),
	CONSTRAINT "evidence_command_artifacts_stderr_byte_count_nonnegative" CHECK("evidence_command_artifacts"."stderr_total_byte_count" >= 0),
	CONSTRAINT "evidence_command_artifacts_stdout_byte_cap" CHECK(length("evidence_command_artifacts"."stdout_bytes") <= 65536),
	CONSTRAINT "evidence_command_artifacts_stderr_byte_cap" CHECK(length("evidence_command_artifacts"."stderr_bytes") <= 65536),
	CONSTRAINT "evidence_command_artifacts_stdout_byte_count_coherent" CHECK("evidence_command_artifacts"."stdout_total_byte_count" >= length("evidence_command_artifacts"."stdout_bytes")),
	CONSTRAINT "evidence_command_artifacts_stderr_byte_count_coherent" CHECK("evidence_command_artifacts"."stderr_total_byte_count" >= length("evidence_command_artifacts"."stderr_bytes")),
	CONSTRAINT "evidence_command_artifacts_stdout_stored_length_exact" CHECK(length("evidence_command_artifacts"."stdout_bytes") = min("evidence_command_artifacts"."stdout_total_byte_count", 65536)),
	CONSTRAINT "evidence_command_artifacts_stderr_stored_length_exact" CHECK(length("evidence_command_artifacts"."stderr_bytes") = min("evidence_command_artifacts"."stderr_total_byte_count", 65536)),
	CONSTRAINT "evidence_command_artifacts_stdout_truncation_coherent" CHECK("evidence_command_artifacts"."stdout_truncated" = ("evidence_command_artifacts"."stdout_total_byte_count" > length("evidence_command_artifacts"."stdout_bytes"))),
	CONSTRAINT "evidence_command_artifacts_stderr_truncation_coherent" CHECK("evidence_command_artifacts"."stderr_truncated" = ("evidence_command_artifacts"."stderr_total_byte_count" > length("evidence_command_artifacts"."stderr_bytes"))),
	CONSTRAINT "evidence_command_artifacts_stdout_sha256_format" CHECK(length("evidence_command_artifacts"."stdout_sha256") = 64 AND "evidence_command_artifacts"."stdout_sha256" NOT GLOB '*[^0-9a-f]*'),
	CONSTRAINT "evidence_command_artifacts_stderr_sha256_format" CHECK(length("evidence_command_artifacts"."stderr_sha256") = 64 AND "evidence_command_artifacts"."stderr_sha256" NOT GLOB '*[^0-9a-f]*'),
	CONSTRAINT "evidence_command_artifacts_sha256_format" CHECK(length("evidence_command_artifacts"."artifact_sha256") = 64 AND "evidence_command_artifacts"."artifact_sha256" NOT GLOB '*[^0-9a-f]*'),
	CONSTRAINT "evidence_command_artifacts_output_ref_matches_sha256" CHECK("evidence_command_artifacts"."output_ref" = 'command-output:sha256:' || "evidence_command_artifacts"."artifact_sha256")
);
--> statement-breakpoint
CREATE UNIQUE INDEX `evidence_command_artifacts_bundle_ordinal_unique` ON `evidence_command_artifacts` (`evidence_bundle_id`,`command_ordinal`);--> statement-breakpoint
CREATE UNIQUE INDEX `evidence_command_artifacts_bundle_output_ref_unique` ON `evidence_command_artifacts` (`evidence_bundle_id`,`output_ref`);--> statement-breakpoint
CREATE TABLE `execution_runs` (
	`id` text PRIMARY KEY DEFAULT (
  lower(hex(randomblob(4))) || '-' ||
  lower(hex(randomblob(2))) || '-4' ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  substr('89ab', abs(random()) % 4 + 1, 1) ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  lower(hex(randomblob(6)))
) NOT NULL,
	`harness_plan_id` text NOT NULL,
	`adapter` text NOT NULL,
	`status` text DEFAULT 'planned' NOT NULL,
	`lifecycle_revision` integer DEFAULT 1 NOT NULL,
	`started_at` integer,
	`completed_at` integer,
	`metadata` text DEFAULT '{}' NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`harness_plan_id`) REFERENCES `harness_plans`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "execution_runs_status_enum_check" CHECK("execution_runs"."status" in ('planned', 'running', 'succeeded', 'failed', 'blocked', 'cancelled')),
	CONSTRAINT "execution_runs_lifecycle_revision_positive" CHECK("execution_runs"."lifecycle_revision" > 0)
);
--> statement-breakpoint
CREATE INDEX `execution_runs_harness_plan_id_idx` ON `execution_runs` (`harness_plan_id`);--> statement-breakpoint
CREATE INDEX `execution_runs_status_idx` ON `execution_runs` (`status`);--> statement-breakpoint
CREATE INDEX `execution_runs_adapter_idx` ON `execution_runs` (`adapter`);--> statement-breakpoint
CREATE TABLE `feedback_deltas` (
	`id` text PRIMARY KEY DEFAULT (
  lower(hex(randomblob(4))) || '-' ||
  lower(hex(randomblob(2))) || '-4' ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  substr('89ab', abs(random()) % 4 + 1, 1) ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  lower(hex(randomblob(6)))
) NOT NULL,
	`review_assessment_id` text NOT NULL,
	`capture_channel` text,
	`decision_packet_authority_admission` text,
	`status` text DEFAULT 'candidate' NOT NULL,
	`memory_candidates` text DEFAULT '[]' NOT NULL,
	`source_decisions` text DEFAULT '[]' NOT NULL,
	`eval_candidates` text DEFAULT '[]' NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`review_assessment_id`) REFERENCES `review_assessments`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "feedback_deltas_status_enum_check" CHECK("feedback_deltas"."status" in ('candidate', 'accepted', 'rejected', 'applied')),
	CONSTRAINT "feedback_deltas_capture_channel_known" CHECK("feedback_deltas"."capture_channel" is null or "feedback_deltas"."capture_channel" in ('evidence_feedback_v1', 'eval_feedback_v1', 'review_assess_v1')),
	CONSTRAINT "feedback_deltas_decision_packet_authority_admission_known" CHECK("feedback_deltas"."decision_packet_authority_admission" is null or "feedback_deltas"."decision_packet_authority_admission" = 'current_v1')
);
--> statement-breakpoint
CREATE INDEX `feedback_deltas_review_assessment_id_idx` ON `feedback_deltas` (`review_assessment_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `feedback_deltas_review_capture_channel_unique` ON `feedback_deltas` (`review_assessment_id`,`capture_channel`);--> statement-breakpoint
CREATE INDEX `feedback_deltas_status_idx` ON `feedback_deltas` (`status`);--> statement-breakpoint
CREATE TABLE `harness_plans` (
	`id` text PRIMARY KEY DEFAULT (
  lower(hex(randomblob(4))) || '-' ||
  lower(hex(randomblob(2))) || '-4' ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  substr('89ab', abs(random()) % 4 + 1, 1) ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  lower(hex(randomblob(6)))
) NOT NULL,
	`task_contract_id` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`summary` text NOT NULL,
	`next_action` text,
	`metadata` text DEFAULT '{}' NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`task_contract_id`) REFERENCES `task_contracts`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "harness_plans_status_enum_check" CHECK("harness_plans"."status" in ('draft', 'ready', 'running', 'completed', 'blocked'))
);
--> statement-breakpoint
CREATE INDEX `harness_plans_task_contract_id_idx` ON `harness_plans` (`task_contract_id`);--> statement-breakpoint
CREATE INDEX `harness_plans_status_idx` ON `harness_plans` (`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `harness_plans_contract_version_unique` ON `harness_plans` (`task_contract_id`,`version`);--> statement-breakpoint
CREATE TABLE `operator_intents` (
	`id` text PRIMARY KEY DEFAULT (
  lower(hex(randomblob(4))) || '-' ||
  lower(hex(randomblob(2))) || '-4' ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  substr('89ab', abs(random()) % 4 + 1, 1) ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  lower(hex(randomblob(6)))
) NOT NULL,
	`workspace_id` text NOT NULL,
	`project_id` text,
	`source` text NOT NULL,
	`raw_intent` text NOT NULL,
	`normalized_intent` text,
	`status` text DEFAULT 'received' NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "operator_intents_status_enum_check" CHECK("operator_intents"."status" in ('received', 'contracted', 'planned', 'executed', 'reviewed', 'closed'))
);
--> statement-breakpoint
CREATE INDEX `operator_intents_workspace_id_idx` ON `operator_intents` (`workspace_id`);--> statement-breakpoint
CREATE INDEX `operator_intents_project_id_idx` ON `operator_intents` (`project_id`);--> statement-breakpoint
CREATE INDEX `operator_intents_status_idx` ON `operator_intents` (`status`);--> statement-breakpoint
CREATE TABLE `paired_live_eval_evidence` (
	`id` text PRIMARY KEY DEFAULT (
  lower(hex(randomblob(4))) || '-' ||
  lower(hex(randomblob(2))) || '-4' ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  substr('89ab', abs(random()) % 4 + 1, 1) ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  lower(hex(randomblob(6)))
) NOT NULL,
	`project_id` text NOT NULL,
	`run_id` text NOT NULL,
	`feedback_delta_id` text,
	`candidate_id` text NOT NULL,
	`candidate_status` text DEFAULT 'candidate' NOT NULL,
	`title` text NOT NULL,
	`scenario` text NOT NULL,
	`family` text NOT NULL,
	`expected_signal` text NOT NULL,
	`artifact_status` text NOT NULL,
	`outcome` text NOT NULL,
	`usefulness_outcome` text NOT NULL,
	`packet_checksum` text NOT NULL,
	`packet_evidence_ref` text NOT NULL,
	`artifact_hash` text NOT NULL,
	`artifact_ref` text NOT NULL,
	`manifest_hash` text NOT NULL,
	`manifest_ref` text NOT NULL,
	`checker_revision` text NOT NULL,
	`checker_evidence_ref` text NOT NULL,
	`environment_profile_hash` text NOT NULL,
	`environment_evidence_ref` text NOT NULL,
	`source_evidence` text DEFAULT '[]' NOT NULL,
	`evidence_refs` text DEFAULT '[]' NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	CONSTRAINT "paired_live_eval_evidence_candidate_status_known" CHECK("paired_live_eval_evidence"."candidate_status" = 'candidate'),
	CONSTRAINT "paired_live_eval_evidence_artifact_status_known" CHECK("paired_live_eval_evidence"."artifact_status" in ('passed', 'invalid', 'blocked', 'unverified')),
	CONSTRAINT "paired_live_eval_evidence_outcome_known" CHECK("paired_live_eval_evidence"."outcome" in ('win', 'tie', 'loss', 'invalid', 'unknown')),
	CONSTRAINT "paired_live_eval_evidence_usefulness_known" CHECK("paired_live_eval_evidence"."usefulness_outcome" in ('helped', 'neutral', 'hurt', 'unknown')),
	CONSTRAINT "paired_live_eval_evidence_nonpassed_not_helped" CHECK("paired_live_eval_evidence"."artifact_status" = 'passed' or "paired_live_eval_evidence"."usefulness_outcome" <> 'helped'),
	CONSTRAINT "paired_live_eval_evidence_invalid_not_helped" CHECK("paired_live_eval_evidence"."outcome" <> 'invalid' or "paired_live_eval_evidence"."usefulness_outcome" <> 'helped'),
	CONSTRAINT "paired_live_eval_evidence_candidate_prefix" CHECK("paired_live_eval_evidence"."candidate_id" like 'paired-target-repair:%'),
	CONSTRAINT "paired_live_eval_evidence_packet_ref_matches" CHECK("paired_live_eval_evidence"."packet_evidence_ref" = 'packet:' || "paired_live_eval_evidence"."packet_checksum"),
	CONSTRAINT "paired_live_eval_evidence_artifact_ref_matches" CHECK("paired_live_eval_evidence"."artifact_ref" = 'artifact:sha256:' || "paired_live_eval_evidence"."artifact_hash"),
	CONSTRAINT "paired_live_eval_evidence_manifest_ref_matches" CHECK("paired_live_eval_evidence"."manifest_ref" = 'manifest:sha256:' || "paired_live_eval_evidence"."manifest_hash"),
	CONSTRAINT "paired_live_eval_evidence_checker_ref_matches" CHECK("paired_live_eval_evidence"."checker_evidence_ref" = 'checker:' || "paired_live_eval_evidence"."checker_revision"),
	CONSTRAINT "paired_live_eval_evidence_environment_ref_matches" CHECK("paired_live_eval_evidence"."environment_evidence_ref" = 'environment:sha256:' || "paired_live_eval_evidence"."environment_profile_hash"),
	CONSTRAINT "paired_live_eval_evidence_artifact_hash_format" CHECK(length("paired_live_eval_evidence"."artifact_hash") = 64 AND "paired_live_eval_evidence"."artifact_hash" NOT GLOB '*[^0-9a-f]*'),
	CONSTRAINT "paired_live_eval_evidence_manifest_hash_format" CHECK(length("paired_live_eval_evidence"."manifest_hash") = 64 AND "paired_live_eval_evidence"."manifest_hash" NOT GLOB '*[^0-9a-f]*')
);
--> statement-breakpoint
CREATE UNIQUE INDEX `paired_live_eval_evidence_candidate_unique` ON `paired_live_eval_evidence` (`candidate_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `paired_live_eval_evidence_artifact_unique` ON `paired_live_eval_evidence` (`artifact_hash`);--> statement-breakpoint
CREATE INDEX `paired_live_eval_evidence_project_idx` ON `paired_live_eval_evidence` (`project_id`);--> statement-breakpoint
CREATE INDEX `paired_live_eval_evidence_run_idx` ON `paired_live_eval_evidence` (`run_id`);--> statement-breakpoint
CREATE INDEX `paired_live_eval_evidence_outcome_idx` ON `paired_live_eval_evidence` (`project_id`,`scenario`,`outcome`,`usefulness_outcome`);--> statement-breakpoint
CREATE INDEX `paired_live_eval_evidence_created_idx` ON `paired_live_eval_evidence` (`created_at`);--> statement-breakpoint
CREATE TABLE `project_kernels` (
	`id` text PRIMARY KEY DEFAULT (
  lower(hex(randomblob(4))) || '-' ||
  lower(hex(randomblob(2))) || '-4' ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  substr('89ab', abs(random()) % 4 + 1, 1) ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  lower(hex(randomblob(6)))
) NOT NULL,
	`project_id` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`summary` text NOT NULL,
	`active_context_rule` text NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `project_kernels_project_id_idx` ON `project_kernels` (`project_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `project_kernels_project_version_unique` ON `project_kernels` (`project_id`,`version`);--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY DEFAULT (
  lower(hex(randomblob(4))) || '-' ||
  lower(hex(randomblob(2))) || '-4' ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  substr('89ab', abs(random()) % 4 + 1, 1) ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  lower(hex(randomblob(6)))
) NOT NULL,
	`workspace_id` text NOT NULL,
	`slug` text NOT NULL,
	`display_name` text NOT NULL,
	`description` text,
	`metadata` text DEFAULT '{}' NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `projects_workspace_slug_unique` ON `projects` (`workspace_id`,`slug`);--> statement-breakpoint
CREATE INDEX `projects_workspace_id_idx` ON `projects` (`workspace_id`);--> statement-breakpoint
CREATE TABLE `repo_installations` (
	`id` text PRIMARY KEY DEFAULT (
  lower(hex(randomblob(4))) || '-' ||
  lower(hex(randomblob(2))) || '-4' ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  substr('89ab', abs(random()) % 4 + 1, 1) ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  lower(hex(randomblob(6)))
) NOT NULL,
	`project_id` text NOT NULL,
	`provider` text NOT NULL,
	`repo_url` text NOT NULL,
	`default_branch` text NOT NULL,
	`repo_fingerprint` text,
	`local_path_hint` text,
	`metadata` text DEFAULT '{}' NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `repo_installations_project_id_idx` ON `repo_installations` (`project_id`);--> statement-breakpoint
CREATE INDEX `repo_installations_local_path_hint_idx` ON `repo_installations` (`local_path_hint`);--> statement-breakpoint
CREATE UNIQUE INDEX `repo_installations_repo_fingerprint_unique` ON `repo_installations` (`repo_fingerprint`);--> statement-breakpoint
CREATE UNIQUE INDEX `repo_installations_project_repo_unique` ON `repo_installations` (`project_id`,`repo_url`);--> statement-breakpoint
CREATE TABLE `review_assessments` (
	`id` text PRIMARY KEY DEFAULT (
  lower(hex(randomblob(4))) || '-' ||
  lower(hex(randomblob(2))) || '-4' ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  substr('89ab', abs(random()) % 4 + 1, 1) ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  lower(hex(randomblob(6)))
) NOT NULL,
	`evidence_bundle_id` text NOT NULL,
	`capture_channel` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`reviewer` text NOT NULL,
	`summary` text NOT NULL,
	`findings` text DEFAULT '[]' NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`evidence_bundle_id`) REFERENCES `evidence_bundles`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "review_assessments_status_enum_check" CHECK("review_assessments"."status" in ('pending', 'accepted', 'changes_requested', 'rejected')),
	CONSTRAINT "review_assessments_capture_channel_known" CHECK("review_assessments"."capture_channel" is null or "review_assessments"."capture_channel" in ('evidence_feedback_v1', 'eval_feedback_v1', 'review_assess_v1'))
);
--> statement-breakpoint
CREATE INDEX `review_assessments_evidence_bundle_id_idx` ON `review_assessments` (`evidence_bundle_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `review_assessments_evidence_capture_channel_unique` ON `review_assessments` (`evidence_bundle_id`,`capture_channel`);--> statement-breakpoint
CREATE INDEX `review_assessments_status_idx` ON `review_assessments` (`status`);--> statement-breakpoint
CREATE TABLE `task_contracts` (
	`id` text PRIMARY KEY DEFAULT (
  lower(hex(randomblob(4))) || '-' ||
  lower(hex(randomblob(2))) || '-4' ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  substr('89ab', abs(random()) % 4 + 1, 1) ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  lower(hex(randomblob(6)))
) NOT NULL,
	`operator_intent_id` text NOT NULL,
	`project_id` text,
	`title` text NOT NULL,
	`objective` text NOT NULL,
	`constraints` text DEFAULT '[]' NOT NULL,
	`non_goals` text DEFAULT '[]' NOT NULL,
	`acceptance` text DEFAULT '[]' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`operator_intent_id`) REFERENCES `operator_intents`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "task_contracts_status_enum_check" CHECK("task_contracts"."status" in ('draft', 'active', 'superseded', 'closed'))
);
--> statement-breakpoint
CREATE INDEX `task_contracts_operator_intent_id_idx` ON `task_contracts` (`operator_intent_id`);--> statement-breakpoint
CREATE INDEX `task_contracts_project_id_idx` ON `task_contracts` (`project_id`);--> statement-breakpoint
CREATE INDEX `task_contracts_status_idx` ON `task_contracts` (`status`);--> statement-breakpoint
CREATE TABLE `usefulness_applications` (
	`application_id` text PRIMARY KEY NOT NULL,
	`subject_kind` text NOT NULL,
	`subject_id` text NOT NULL,
	`project_id` text NOT NULL,
	`execution_run_id` text NOT NULL,
	`task_contract_id` text NOT NULL,
	`packet_checksum` text NOT NULL,
	`packet_generated_at` integer NOT NULL,
	`source_run_lifecycle_revision` integer NOT NULL,
	`target_state` text,
	`applied_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`execution_run_id`) REFERENCES `execution_runs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`task_contract_id`) REFERENCES `task_contracts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`execution_run_id`,`packet_checksum`,`packet_generated_at`,`source_run_lifecycle_revision`) REFERENCES `decision_packet_issuances`(`execution_run_id`,`packet_checksum`,`packet_generated_at`,`source_run_lifecycle_revision`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "usefulness_applications_subject_kind_enum_check" CHECK("usefulness_applications"."subject_kind" in ('knowledge', 'context_inclusion', 'source_claim', 'source_decision', 'memory_record')),
	CONSTRAINT "usefulness_applications_packet_checksum_sha256" CHECK(length("usefulness_applications"."packet_checksum") = 64 AND "usefulness_applications"."packet_checksum" NOT GLOB '*[^0-9a-f]*'),
	CONSTRAINT "usefulness_applications_lifecycle_revision_positive" CHECK("usefulness_applications"."source_run_lifecycle_revision" > 0),
	CONSTRAINT "usefulness_applications_applied_after_packet" CHECK("usefulness_applications"."applied_at" >= "usefulness_applications"."packet_generated_at")
);
--> statement-breakpoint
CREATE UNIQUE INDEX `usefulness_applications_packet_subject_unique` ON `usefulness_applications` (`execution_run_id`,`packet_checksum`,`subject_kind`,`subject_id`);--> statement-breakpoint
CREATE INDEX `usefulness_applications_project_id_idx` ON `usefulness_applications` (`project_id`);--> statement-breakpoint
CREATE INDEX `usefulness_applications_task_contract_id_idx` ON `usefulness_applications` (`task_contract_id`);--> statement-breakpoint
CREATE TABLE `workspaces` (
	`id` text PRIMARY KEY DEFAULT (
  lower(hex(randomblob(4))) || '-' ||
  lower(hex(randomblob(2))) || '-4' ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  substr('89ab', abs(random()) % 4 + 1, 1) ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  lower(hex(randomblob(6)))
) NOT NULL,
	`slug` text NOT NULL,
	`display_name` text NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `workspaces_slug_unique` ON `workspaces` (`slug`);--> statement-breakpoint
CREATE TABLE `anti_memory_candidates` (
	`id` text PRIMARY KEY DEFAULT (
  lower(hex(randomblob(4))) || '-' ||
  lower(hex(randomblob(2))) || '-4' ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  substr('89ab', abs(random()) % 4 + 1, 1) ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  lower(hex(randomblob(6)))
) NOT NULL,
	`project_id` text NOT NULL,
	`execution_run_id` text,
	`feedback_delta_id` text,
	`proposed_by` text NOT NULL,
	`maintenance_identity` text,
	`key` text NOT NULL,
	`status` text DEFAULT 'candidate' NOT NULL,
	`rejected_claim` text,
	`reason` text,
	`invalidated_by_source_claim_ids` text DEFAULT '[]' NOT NULL,
	`invalidated_by_source_claim_id` text,
	`applies_to` text,
	`may_revisit_when` text,
	`summary` text NOT NULL,
	`body` text NOT NULL,
	`owner` text NOT NULL,
	`confidence` integer NOT NULL,
	`source_lineage` text DEFAULT '[]' NOT NULL,
	`reviewer` text,
	`reviewed_at` integer,
	`rejection_reason` text,
	`valid_from` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`valid_until` integer,
	`metadata` text DEFAULT '{}' NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`execution_run_id`) REFERENCES `execution_runs`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`feedback_delta_id`) REFERENCES `feedback_deltas`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`invalidated_by_source_claim_id`) REFERENCES `source_claims`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "anti_memory_candidates_status_enum_check" CHECK("anti_memory_candidates"."status" in ('proposed', 'candidate', 'accepted', 'rejected', 'applied', 'superseded')),
	CONSTRAINT "anti_memory_candidates_confidence_range" CHECK("anti_memory_candidates"."confidence" >= 0 AND "anti_memory_candidates"."confidence" <= 100),
	CONSTRAINT "anti_memory_candidates_source_evidence_non_empty" CHECK("anti_memory_candidates"."invalidated_by_source_claim_id" IS NOT NULL
  OR json_array_length("anti_memory_candidates"."invalidated_by_source_claim_ids") > 0
  OR json_array_length("anti_memory_candidates"."source_lineage") > 0),
	CONSTRAINT "anti_memory_candidates_temporal_window" CHECK("anti_memory_candidates"."valid_until" IS NULL OR "anti_memory_candidates"."valid_until" > "anti_memory_candidates"."valid_from")
);
--> statement-breakpoint
CREATE INDEX `anti_memory_candidates_project_id_idx` ON `anti_memory_candidates` (`project_id`);--> statement-breakpoint
CREATE INDEX `anti_memory_candidates_execution_run_id_idx` ON `anti_memory_candidates` (`execution_run_id`);--> statement-breakpoint
CREATE INDEX `anti_memory_candidates_feedback_delta_id_idx` ON `anti_memory_candidates` (`feedback_delta_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `anti_memory_candidates_project_maintenance_identity_unique` ON `anti_memory_candidates` (`project_id`,`maintenance_identity`);--> statement-breakpoint
CREATE INDEX `anti_memory_candidates_status_idx` ON `anti_memory_candidates` (`status`);--> statement-breakpoint
CREATE INDEX `anti_memory_candidates_key_idx` ON `anti_memory_candidates` (`key`);--> statement-breakpoint
CREATE INDEX `anti_memory_candidates_valid_until_idx` ON `anti_memory_candidates` (`valid_until`);--> statement-breakpoint
CREATE TABLE `anti_memory_records` (
	`id` text PRIMARY KEY DEFAULT (
  lower(hex(randomblob(4))) || '-' ||
  lower(hex(randomblob(2))) || '-4' ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  substr('89ab', abs(random()) % 4 + 1, 1) ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  lower(hex(randomblob(6)))
) NOT NULL,
	`project_id` text NOT NULL,
	`execution_run_id` text,
	`created_from_candidate_id` text,
	`key` text NOT NULL,
	`rejected_claim` text,
	`reason` text,
	`invalidated_by_source_claim_ids` text DEFAULT '[]' NOT NULL,
	`invalidated_by_source_claim_id` text,
	`applies_to` text,
	`may_revisit_when` text,
	`summary` text NOT NULL,
	`body` text NOT NULL,
	`owner` text NOT NULL,
	`confidence` integer NOT NULL,
	`source_lineage` text DEFAULT '[]' NOT NULL,
	`valid_from` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`valid_until` integer,
	`invalidated_at` integer,
	`invalidation_reason` text,
	`metadata` text DEFAULT '{}' NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`execution_run_id`) REFERENCES `execution_runs`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_from_candidate_id`) REFERENCES `anti_memory_candidates`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`invalidated_by_source_claim_id`) REFERENCES `source_claims`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "anti_memory_records_confidence_range" CHECK("anti_memory_records"."confidence" >= 0 AND "anti_memory_records"."confidence" <= 100),
	CONSTRAINT "anti_memory_records_source_evidence_non_empty" CHECK("anti_memory_records"."invalidated_by_source_claim_id" IS NOT NULL
  OR json_array_length("anti_memory_records"."invalidated_by_source_claim_ids") > 0
  OR json_array_length("anti_memory_records"."source_lineage") > 0),
	CONSTRAINT "anti_memory_records_temporal_window" CHECK("anti_memory_records"."valid_until" IS NULL OR "anti_memory_records"."valid_until" > "anti_memory_records"."valid_from")
);
--> statement-breakpoint
CREATE UNIQUE INDEX `anti_memory_records_project_key_unique` ON `anti_memory_records` (`project_id`,`key`);--> statement-breakpoint
CREATE INDEX `anti_memory_records_created_from_candidate_id_idx` ON `anti_memory_records` (`created_from_candidate_id`);--> statement-breakpoint
CREATE INDEX `anti_memory_records_project_id_idx` ON `anti_memory_records` (`project_id`);--> statement-breakpoint
CREATE INDEX `anti_memory_records_execution_run_id_idx` ON `anti_memory_records` (`execution_run_id`);--> statement-breakpoint
CREATE INDEX `anti_memory_records_invalidated_by_source_claim_id_idx` ON `anti_memory_records` (`invalidated_by_source_claim_id`);--> statement-breakpoint
CREATE INDEX `anti_memory_records_valid_until_idx` ON `anti_memory_records` (`valid_until`);--> statement-breakpoint
CREATE TABLE `memory_applications` (
	`id` text PRIMARY KEY DEFAULT (
  lower(hex(randomblob(4))) || '-' ||
  lower(hex(randomblob(2))) || '-4' ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  substr('89ab', abs(random()) % 4 + 1, 1) ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  lower(hex(randomblob(6)))
) NOT NULL,
	`memory_record_id` text NOT NULL,
	`execution_run_id` text,
	`decision_packet_checksum` text,
	`task_contract_id` text,
	`context_assembly_id` text,
	`expected_use` text NOT NULL,
	`outcome` text,
	`notes` text,
	`metadata` text DEFAULT '{}' NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`memory_record_id`) REFERENCES `memory_records`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`execution_run_id`) REFERENCES `execution_runs`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`task_contract_id`) REFERENCES `task_contracts`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`context_assembly_id`) REFERENCES `context_assemblies`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "memory_applications_outcome_enum_check" CHECK("memory_applications"."outcome" in ('helped', 'hurt', 'neutral', 'stale')),
	CONSTRAINT "memory_applications_packet_checksum_non_empty" CHECK("memory_applications"."decision_packet_checksum" IS NULL OR length(trim("memory_applications"."decision_packet_checksum")) > 0)
);
--> statement-breakpoint
CREATE INDEX `memory_applications_memory_record_id_idx` ON `memory_applications` (`memory_record_id`);--> statement-breakpoint
CREATE INDEX `memory_applications_execution_run_id_idx` ON `memory_applications` (`execution_run_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `memory_applications_packet_identity_unique` ON `memory_applications` (`memory_record_id`,`execution_run_id`,`decision_packet_checksum`);--> statement-breakpoint
CREATE INDEX `memory_applications_task_contract_id_idx` ON `memory_applications` (`task_contract_id`);--> statement-breakpoint
CREATE INDEX `memory_applications_context_assembly_id_idx` ON `memory_applications` (`context_assembly_id`);--> statement-breakpoint
CREATE TABLE `memory_candidates` (
	`id` text PRIMARY KEY DEFAULT (
  lower(hex(randomblob(4))) || '-' ||
  lower(hex(randomblob(2))) || '-4' ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  substr('89ab', abs(random()) % 4 + 1, 1) ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  lower(hex(randomblob(6)))
) NOT NULL,
	`project_id` text NOT NULL,
	`execution_run_id` text,
	`feedback_delta_id` text,
	`proposed_by` text NOT NULL,
	`review_assessment_id` text,
	`revision_review_assessment_id` text,
	`usefulness_application_id` text,
	`kind` text NOT NULL,
	`status` text DEFAULT 'candidate' NOT NULL,
	`summary` text NOT NULL,
	`body` text NOT NULL,
	`owner` text NOT NULL,
	`confidence` integer NOT NULL,
	`application_guidance` text NOT NULL,
	`invalidation_rule` text,
	`source_claim_ids` text DEFAULT '[]' NOT NULL,
	`source_lineage` text NOT NULL,
	`is_user_preference` integer DEFAULT false NOT NULL,
	`reviewer` text,
	`reviewed_at` integer,
	`rejection_reason` text,
	`valid_from` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`valid_until` integer,
	`metadata` text DEFAULT '{}' NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`execution_run_id`) REFERENCES `execution_runs`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`feedback_delta_id`) REFERENCES `feedback_deltas`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`review_assessment_id`) REFERENCES `review_assessments`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`revision_review_assessment_id`) REFERENCES `review_assessments`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`usefulness_application_id`) REFERENCES `usefulness_applications`(`application_id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "memory_candidates_kind_enum_check" CHECK("memory_candidates"."kind" in ('fact', 'preference', 'constraint', 'procedure', 'risk')),
	CONSTRAINT "memory_candidates_status_enum_check" CHECK("memory_candidates"."status" in ('proposed', 'candidate', 'accepted', 'rejected', 'applied', 'superseded')),
	CONSTRAINT "memory_candidates_confidence_range" CHECK("memory_candidates"."confidence" >= 0 AND "memory_candidates"."confidence" <= 100),
	CONSTRAINT "memory_candidates_application_guidance_non_empty" CHECK(length(trim("memory_candidates"."application_guidance")) > 0),
	CONSTRAINT "memory_candidates_source_lineage_non_empty" CHECK(json_array_length("memory_candidates"."source_lineage") > 0),
	CONSTRAINT "memory_candidates_temporal_invalidation_strategy" CHECK("memory_candidates"."valid_until" IS NULL OR (
  "memory_candidates"."valid_until" > "memory_candidates"."valid_from"
  AND "memory_candidates"."invalidation_rule" IS NOT NULL
  AND length(trim("memory_candidates"."invalidation_rule")) > 0
))
);
--> statement-breakpoint
CREATE INDEX `memory_candidates_project_id_idx` ON `memory_candidates` (`project_id`);--> statement-breakpoint
CREATE INDEX `memory_candidates_execution_run_id_idx` ON `memory_candidates` (`execution_run_id`);--> statement-breakpoint
CREATE INDEX `memory_candidates_feedback_delta_id_idx` ON `memory_candidates` (`feedback_delta_id`);--> statement-breakpoint
CREATE INDEX `memory_candidates_review_assessment_id_idx` ON `memory_candidates` (`review_assessment_id`);--> statement-breakpoint
CREATE INDEX `memory_candidates_revision_review_assessment_id_idx` ON `memory_candidates` (`revision_review_assessment_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `memory_candidates_usefulness_application_id_unique` ON `memory_candidates` (`usefulness_application_id`);--> statement-breakpoint
CREATE INDEX `memory_candidates_status_idx` ON `memory_candidates` (`status`);--> statement-breakpoint
CREATE INDEX `memory_candidates_kind_idx` ON `memory_candidates` (`kind`);--> statement-breakpoint
CREATE INDEX `memory_candidates_valid_until_idx` ON `memory_candidates` (`valid_until`);--> statement-breakpoint
CREATE TABLE `memory_feedback_events` (
	`id` text PRIMARY KEY DEFAULT (
  lower(hex(randomblob(4))) || '-' ||
  lower(hex(randomblob(2))) || '-4' ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  substr('89ab', abs(random()) % 4 + 1, 1) ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  lower(hex(randomblob(6)))
) NOT NULL,
	`memory_record_id` text NOT NULL,
	`execution_run_id` text,
	`feedback_delta_id` text,
	`event_type` text,
	`direction` text NOT NULL,
	`note` text NOT NULL,
	`reason` text,
	`evidence_ref` text,
	`metadata` text DEFAULT '{}' NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`memory_record_id`) REFERENCES `memory_records`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`execution_run_id`) REFERENCES `execution_runs`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`feedback_delta_id`) REFERENCES `feedback_deltas`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "memory_feedback_events_event_type_enum_check" CHECK("memory_feedback_events"."event_type" in ('strengthened', 'demoted', 'invalidated', 'corrected', 'stale_detected')),
	CONSTRAINT "memory_feedback_events_direction_enum_check" CHECK("memory_feedback_events"."direction" in ('positive', 'negative', 'correction'))
);
--> statement-breakpoint
CREATE INDEX `memory_feedback_events_memory_record_id_idx` ON `memory_feedback_events` (`memory_record_id`);--> statement-breakpoint
CREATE INDEX `memory_feedback_events_execution_run_id_idx` ON `memory_feedback_events` (`execution_run_id`);--> statement-breakpoint
CREATE INDEX `memory_feedback_events_feedback_delta_id_idx` ON `memory_feedback_events` (`feedback_delta_id`);--> statement-breakpoint
CREATE INDEX `memory_feedback_events_event_type_idx` ON `memory_feedback_events` (`event_type`);--> statement-breakpoint
CREATE INDEX `memory_feedback_events_direction_idx` ON `memory_feedback_events` (`direction`);--> statement-breakpoint
CREATE TABLE `memory_record_versions` (
	`id` text PRIMARY KEY DEFAULT (
  lower(hex(randomblob(4))) || '-' ||
  lower(hex(randomblob(2))) || '-4' ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  substr('89ab', abs(random()) % 4 + 1, 1) ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  lower(hex(randomblob(6)))
) NOT NULL,
	`memory_record_id` text NOT NULL,
	`created_from_candidate_id` text,
	`version` integer NOT NULL,
	`summary` text NOT NULL,
	`body` text NOT NULL,
	`owner` text NOT NULL,
	`confidence` integer NOT NULL,
	`application_guidance` text NOT NULL,
	`invalidation_rule` text,
	`valid_from` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`valid_until` integer,
	`source_lineage` text NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`memory_record_id`) REFERENCES `memory_records`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_from_candidate_id`) REFERENCES `memory_candidates`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "memory_record_versions_confidence_range" CHECK("memory_record_versions"."confidence" >= 0 AND "memory_record_versions"."confidence" <= 100),
	CONSTRAINT "memory_record_versions_application_guidance_non_empty" CHECK(length(trim("memory_record_versions"."application_guidance")) > 0),
	CONSTRAINT "memory_record_versions_source_lineage_non_empty" CHECK(json_array_length("memory_record_versions"."source_lineage") > 0),
	CONSTRAINT "memory_record_versions_temporal_invalidation_strategy" CHECK("memory_record_versions"."valid_until" IS NULL OR (
  "memory_record_versions"."valid_until" > "memory_record_versions"."valid_from"
  AND "memory_record_versions"."invalidation_rule" IS NOT NULL
  AND length(trim("memory_record_versions"."invalidation_rule")) > 0
))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `memory_record_versions_record_version_unique` ON `memory_record_versions` (`memory_record_id`,`version`);--> statement-breakpoint
CREATE INDEX `memory_record_versions_created_from_candidate_id_idx` ON `memory_record_versions` (`created_from_candidate_id`);--> statement-breakpoint
CREATE INDEX `memory_record_versions_memory_record_id_idx` ON `memory_record_versions` (`memory_record_id`);--> statement-breakpoint
CREATE TABLE `memory_records` (
	`id` text PRIMARY KEY DEFAULT (
  lower(hex(randomblob(4))) || '-' ||
  lower(hex(randomblob(2))) || '-4' ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  substr('89ab', abs(random()) % 4 + 1, 1) ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  lower(hex(randomblob(6)))
) NOT NULL,
	`project_id` text NOT NULL,
	`current_version_id` text,
	`key` text NOT NULL,
	`kind` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`summary` text NOT NULL,
	`body` text NOT NULL,
	`owner` text NOT NULL,
	`confidence` integer NOT NULL,
	`application_guidance` text NOT NULL,
	`invalidation_rule` text,
	`source_lineage` text NOT NULL,
	`is_user_preference` integer DEFAULT false NOT NULL,
	`valid_from` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`valid_until` integer,
	`invalidated_at` integer,
	`invalidation_reason` text,
	`positive_feedback_count` integer DEFAULT 0 NOT NULL,
	`negative_feedback_count` integer DEFAULT 0 NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "memory_records_kind_enum_check" CHECK("memory_records"."kind" in ('fact', 'preference', 'constraint', 'procedure', 'risk')),
	CONSTRAINT "memory_records_status_enum_check" CHECK("memory_records"."status" in ('active', 'deprecated', 'stale', 'invalidated', 'superseded')),
	CONSTRAINT "memory_records_confidence_range" CHECK("memory_records"."confidence" >= 0 AND "memory_records"."confidence" <= 100),
	CONSTRAINT "memory_records_application_guidance_non_empty" CHECK(length(trim("memory_records"."application_guidance")) > 0),
	CONSTRAINT "memory_records_source_lineage_non_empty" CHECK(json_array_length("memory_records"."source_lineage") > 0),
	CONSTRAINT "memory_records_temporal_invalidation_strategy" CHECK("memory_records"."valid_until" IS NULL OR (
  "memory_records"."valid_until" > "memory_records"."valid_from"
  AND "memory_records"."invalidation_rule" IS NOT NULL
  AND length(trim("memory_records"."invalidation_rule")) > 0
))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `memory_records_project_key_unique` ON `memory_records` (`project_id`,`key`);--> statement-breakpoint
CREATE INDEX `memory_records_current_version_id_idx` ON `memory_records` (`current_version_id`);--> statement-breakpoint
CREATE INDEX `memory_records_project_id_idx` ON `memory_records` (`project_id`);--> statement-breakpoint
CREATE INDEX `memory_records_kind_idx` ON `memory_records` (`kind`);--> statement-breakpoint
CREATE INDEX `memory_records_status_idx` ON `memory_records` (`status`);--> statement-breakpoint
CREATE INDEX `memory_records_valid_until_idx` ON `memory_records` (`valid_until`);--> statement-breakpoint
CREATE TABLE `observation_claim_edges` (
	`id` text PRIMARY KEY DEFAULT (
  lower(hex(randomblob(4))) || '-' ||
  lower(hex(randomblob(2))) || '-4' ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  substr('89ab', abs(random()) % 4 + 1, 1) ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  lower(hex(randomblob(6)))
) NOT NULL,
	`observation_item_id` text NOT NULL,
	`source_claim_id` text NOT NULL,
	`relation` text NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`observation_item_id`) REFERENCES `observation_items`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`source_claim_id`) REFERENCES `source_claims`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "observation_claim_edges_relation_enum_check" CHECK("observation_claim_edges"."relation" in ('supports', 'contradicts', 'qualifies', 'supersedes'))
);
--> statement-breakpoint
CREATE INDEX `observation_claim_edges_item_id_idx` ON `observation_claim_edges` (`observation_item_id`);--> statement-breakpoint
CREATE INDEX `observation_claim_edges_source_claim_id_idx` ON `observation_claim_edges` (`source_claim_id`);--> statement-breakpoint
CREATE INDEX `observation_claim_edges_relation_idx` ON `observation_claim_edges` (`relation`);--> statement-breakpoint
CREATE TABLE `observation_entity_edges` (
	`id` text PRIMARY KEY DEFAULT (
  lower(hex(randomblob(4))) || '-' ||
  lower(hex(randomblob(2))) || '-4' ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  substr('89ab', abs(random()) % 4 + 1, 1) ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  lower(hex(randomblob(6)))
) NOT NULL,
	`observation_item_id` text NOT NULL,
	`entity_kind` text NOT NULL,
	`entity_id` text NOT NULL,
	`relation` text NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`observation_item_id`) REFERENCES `observation_items`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "observation_entity_edges_entity_kind_enum_check" CHECK("observation_entity_edges"."entity_kind" in ('workspace', 'project', 'repo', 'file', 'package', 'source', 'memory', 'policy', 'eval'))
);
--> statement-breakpoint
CREATE INDEX `observation_entity_edges_item_id_idx` ON `observation_entity_edges` (`observation_item_id`);--> statement-breakpoint
CREATE INDEX `observation_entity_edges_entity_idx` ON `observation_entity_edges` (`entity_kind`,`entity_id`);--> statement-breakpoint
CREATE INDEX `observation_entity_edges_relation_idx` ON `observation_entity_edges` (`relation`);--> statement-breakpoint
CREATE TABLE `observation_feedback_events` (
	`id` text PRIMARY KEY DEFAULT (
  lower(hex(randomblob(4))) || '-' ||
  lower(hex(randomblob(2))) || '-4' ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  substr('89ab', abs(random()) % 4 + 1, 1) ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  lower(hex(randomblob(6)))
) NOT NULL,
	`observation_item_id` text NOT NULL,
	`project_id` text,
	`execution_run_id` text,
	`event_type` text NOT NULL,
	`usefulness` text DEFAULT 'unknown' NOT NULL,
	`note` text,
	`metadata` text DEFAULT '{}' NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`observation_item_id`) REFERENCES `observation_items`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`execution_run_id`) REFERENCES `execution_runs`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "observation_feedback_events_event_type_enum_check" CHECK("observation_feedback_events"."event_type" in ('used', 'ignored', 'helped', 'hurt', 'stale', 'corrected')),
	CONSTRAINT "observation_feedback_events_usefulness_enum_check" CHECK("observation_feedback_events"."usefulness" in ('positive', 'negative', 'neutral', 'unknown'))
);
--> statement-breakpoint
CREATE INDEX `observation_feedback_events_item_id_idx` ON `observation_feedback_events` (`observation_item_id`);--> statement-breakpoint
CREATE INDEX `observation_feedback_events_project_id_idx` ON `observation_feedback_events` (`project_id`);--> statement-breakpoint
CREATE INDEX `observation_feedback_events_execution_run_id_idx` ON `observation_feedback_events` (`execution_run_id`);--> statement-breakpoint
CREATE INDEX `observation_feedback_events_event_type_idx` ON `observation_feedback_events` (`event_type`);--> statement-breakpoint
CREATE INDEX `observation_feedback_events_usefulness_idx` ON `observation_feedback_events` (`usefulness`);--> statement-breakpoint
CREATE TABLE `observation_groups` (
	`id` text PRIMARY KEY DEFAULT (
  lower(hex(randomblob(4))) || '-' ||
  lower(hex(randomblob(2))) || '-4' ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  substr('89ab', abs(random()) % 4 + 1, 1) ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  lower(hex(randomblob(6)))
) NOT NULL,
	`workspace_id` text,
	`project_id` text,
	`execution_run_id` text,
	`task_contract_id` text,
	`target_repo_path` text,
	`scope` text DEFAULT '{}' NOT NULL,
	`title` text NOT NULL,
	`summary` text NOT NULL,
	`source` text NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`execution_run_id`) REFERENCES `execution_runs`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`task_contract_id`) REFERENCES `task_contracts`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `observation_groups_workspace_id_idx` ON `observation_groups` (`workspace_id`);--> statement-breakpoint
CREATE INDEX `observation_groups_project_id_idx` ON `observation_groups` (`project_id`);--> statement-breakpoint
CREATE INDEX `observation_groups_execution_run_id_idx` ON `observation_groups` (`execution_run_id`);--> statement-breakpoint
CREATE INDEX `observation_groups_task_contract_id_idx` ON `observation_groups` (`task_contract_id`);--> statement-breakpoint
CREATE INDEX `observation_groups_created_at_idx` ON `observation_groups` (`created_at`);--> statement-breakpoint
CREATE TABLE `observation_items` (
	`id` text PRIMARY KEY DEFAULT (
  lower(hex(randomblob(4))) || '-' ||
  lower(hex(randomblob(2))) || '-4' ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  substr('89ab', abs(random()) % 4 + 1, 1) ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  lower(hex(randomblob(6)))
) NOT NULL,
	`group_id` text NOT NULL,
	`workspace_id` text,
	`project_id` text,
	`execution_run_id` text,
	`task_contract_id` text,
	`target_repo_path` text,
	`kind` text NOT NULL,
	`status` text DEFAULT 'observed' NOT NULL,
	`priority` text DEFAULT 'medium' NOT NULL,
	`confidence` text DEFAULT 'medium' NOT NULL,
	`provenance_kind` text NOT NULL,
	`subject` text NOT NULL,
	`summary` text NOT NULL,
	`body` text NOT NULL,
	`observed_at` integer NOT NULL,
	`event_time` integer,
	`ingested_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`referenced_at` integer,
	`reference_time` integer,
	`relative_time_base` integer,
	`valid_from` integer,
	`valid_until` integer,
	`invalidated_at` integer,
	`superseded_at` integer,
	`metadata` text DEFAULT '{}' NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`group_id`) REFERENCES `observation_groups`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`execution_run_id`) REFERENCES `execution_runs`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`task_contract_id`) REFERENCES `task_contracts`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "observation_items_kind_enum_check" CHECK("observation_items"."kind" in ('fact', 'decision', 'correction', 'risk', 'procedure', 'conflict', 'slang', 'gap', 'preference', 'operator_note')),
	CONSTRAINT "observation_items_status_enum_check" CHECK("observation_items"."status" in ('observed', 'candidate', 'accepted', 'contested', 'deprecated', 'invalidated', 'superseded')),
	CONSTRAINT "observation_items_priority_enum_check" CHECK("observation_items"."priority" in ('low', 'medium', 'high', 'critical')),
	CONSTRAINT "observation_items_confidence_enum_check" CHECK("observation_items"."confidence" in ('low', 'medium', 'high')),
	CONSTRAINT "observation_items_provenance_kind_enum_check" CHECK("observation_items"."provenance_kind" in ('run_event', 'source_chunk', 'tool_trace', 'diff', 'evidence_bundle', 'review_assessment', 'feedback_delta', 'user_correction', 'user_preference', 'local_operator_note'))
);
--> statement-breakpoint
CREATE INDEX `observation_items_group_id_idx` ON `observation_items` (`group_id`);--> statement-breakpoint
CREATE INDEX `observation_items_workspace_id_idx` ON `observation_items` (`workspace_id`);--> statement-breakpoint
CREATE INDEX `observation_items_project_id_idx` ON `observation_items` (`project_id`);--> statement-breakpoint
CREATE INDEX `observation_items_execution_run_id_idx` ON `observation_items` (`execution_run_id`);--> statement-breakpoint
CREATE INDEX `observation_items_task_contract_id_idx` ON `observation_items` (`task_contract_id`);--> statement-breakpoint
CREATE INDEX `observation_items_kind_idx` ON `observation_items` (`kind`);--> statement-breakpoint
CREATE INDEX `observation_items_status_idx` ON `observation_items` (`status`);--> statement-breakpoint
CREATE INDEX `observation_items_priority_idx` ON `observation_items` (`priority`);--> statement-breakpoint
CREATE INDEX `observation_items_provenance_kind_idx` ON `observation_items` (`provenance_kind`);--> statement-breakpoint
CREATE INDEX `observation_items_observed_at_idx` ON `observation_items` (`observed_at`);--> statement-breakpoint
CREATE INDEX `observation_items_valid_until_idx` ON `observation_items` (`valid_until`);--> statement-breakpoint
CREATE TABLE `observation_source_ranges` (
	`id` text PRIMARY KEY DEFAULT (
  lower(hex(randomblob(4))) || '-' ||
  lower(hex(randomblob(2))) || '-4' ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  substr('89ab', abs(random()) % 4 + 1, 1) ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  lower(hex(randomblob(6)))
) NOT NULL,
	`observation_item_id` text NOT NULL,
	`source_type` text NOT NULL,
	`source_id` text NOT NULL,
	`execution_run_id` text,
	`run_event_id` text,
	`source_chunk_id` text,
	`evidence_bundle_id` text,
	`review_assessment_id` text,
	`feedback_delta_id` text,
	`locator` text NOT NULL,
	`excerpt` text,
	`captured_at` integer NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	FOREIGN KEY (`observation_item_id`) REFERENCES `observation_items`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`execution_run_id`) REFERENCES `execution_runs`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`run_event_id`) REFERENCES `run_events`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`source_chunk_id`) REFERENCES `source_chunks`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`evidence_bundle_id`) REFERENCES `evidence_bundles`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`review_assessment_id`) REFERENCES `review_assessments`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`feedback_delta_id`) REFERENCES `feedback_deltas`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "observation_source_ranges_source_type_enum_check" CHECK("observation_source_ranges"."source_type" in ('run_event', 'source_chunk', 'tool_trace', 'diff', 'evidence_bundle', 'review_assessment', 'feedback_delta', 'operator_input'))
);
--> statement-breakpoint
CREATE INDEX `observation_source_ranges_item_id_idx` ON `observation_source_ranges` (`observation_item_id`);--> statement-breakpoint
CREATE INDEX `observation_source_ranges_source_type_idx` ON `observation_source_ranges` (`source_type`);--> statement-breakpoint
CREATE INDEX `observation_source_ranges_execution_run_id_idx` ON `observation_source_ranges` (`execution_run_id`);--> statement-breakpoint
CREATE INDEX `observation_source_ranges_run_event_id_idx` ON `observation_source_ranges` (`run_event_id`);--> statement-breakpoint
CREATE INDEX `observation_source_ranges_source_chunk_id_idx` ON `observation_source_ranges` (`source_chunk_id`);--> statement-breakpoint
CREATE INDEX `observation_source_ranges_evidence_bundle_id_idx` ON `observation_source_ranges` (`evidence_bundle_id`);--> statement-breakpoint
CREATE INDEX `observation_source_ranges_review_assessment_id_idx` ON `observation_source_ranges` (`review_assessment_id`);--> statement-breakpoint
CREATE INDEX `observation_source_ranges_feedback_delta_id_idx` ON `observation_source_ranges` (`feedback_delta_id`);--> statement-breakpoint
CREATE TABLE `reflection_records` (
	`id` text PRIMARY KEY DEFAULT (
  lower(hex(randomblob(4))) || '-' ||
  lower(hex(randomblob(2))) || '-4' ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  substr('89ab', abs(random()) % 4 + 1, 1) ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  lower(hex(randomblob(6)))
) NOT NULL,
	`project_id` text NOT NULL,
	`execution_run_id` text,
	`task_contract_id` text,
	`status` text DEFAULT 'candidate' NOT NULL,
	`summary` text NOT NULL,
	`scope` text DEFAULT '{}' NOT NULL,
	`input` text DEFAULT '{}' NOT NULL,
	`output` text DEFAULT '{}' NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`execution_run_id`) REFERENCES `execution_runs`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`task_contract_id`) REFERENCES `task_contracts`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "reflection_records_status_enum_check" CHECK("reflection_records"."status" in ('candidate', 'reviewed', 'rejected', 'superseded'))
);
--> statement-breakpoint
CREATE INDEX `reflection_records_project_id_idx` ON `reflection_records` (`project_id`);--> statement-breakpoint
CREATE INDEX `reflection_records_execution_run_id_idx` ON `reflection_records` (`execution_run_id`);--> statement-breakpoint
CREATE INDEX `reflection_records_task_contract_id_idx` ON `reflection_records` (`task_contract_id`);--> statement-breakpoint
CREATE INDEX `reflection_records_status_idx` ON `reflection_records` (`status`);--> statement-breakpoint
CREATE INDEX `reflection_records_created_at_idx` ON `reflection_records` (`created_at`);--> statement-breakpoint
CREATE TABLE `activation_decisions` (
	`id` text PRIMARY KEY DEFAULT (
  lower(hex(randomblob(4))) || '-' ||
  lower(hex(randomblob(2))) || '-4' ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  substr('89ab', abs(random()) % 4 + 1, 1) ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  lower(hex(randomblob(6)))
) NOT NULL,
	`retrieval_run_id` text NOT NULL,
	`retrieval_candidate_id` text,
	`context_assembly_id` text,
	`subject_type` text NOT NULL,
	`subject_id` text NOT NULL,
	`decision` text NOT NULL,
	`reason` text NOT NULL,
	`score` integer,
	`context_budget_cost` integer,
	`expected_decision_impact` text,
	`metadata` text DEFAULT '{}' NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`retrieval_run_id`) REFERENCES `retrieval_runs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`retrieval_candidate_id`) REFERENCES `retrieval_candidates`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`context_assembly_id`) REFERENCES `context_assemblies`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "activation_decisions_subject_type_enum_check" CHECK("activation_decisions"."subject_type" in ('source_artifact', 'source_chunk', 'source_claim', 'memory_record', 'anti_memory_record', 'task_contract', 'search_document', 'owner_file', 'evidence_bundle', 'review_assessment', 'architecture_decision', 'run_event')),
	CONSTRAINT "activation_decisions_decision_enum_check" CHECK("activation_decisions"."decision" in ('included', 'excluded', 'abstained', 'deferred', 'conflict', 'stale'))
);
--> statement-breakpoint
CREATE INDEX `activation_decisions_retrieval_run_id_idx` ON `activation_decisions` (`retrieval_run_id`);--> statement-breakpoint
CREATE INDEX `activation_decisions_retrieval_candidate_id_idx` ON `activation_decisions` (`retrieval_candidate_id`);--> statement-breakpoint
CREATE INDEX `activation_decisions_context_assembly_id_idx` ON `activation_decisions` (`context_assembly_id`);--> statement-breakpoint
CREATE INDEX `activation_decisions_subject_idx` ON `activation_decisions` (`subject_type`,`subject_id`);--> statement-breakpoint
CREATE INDEX `activation_decisions_decision_idx` ON `activation_decisions` (`decision`);--> statement-breakpoint
CREATE TABLE `context_exclusions` (
	`id` text PRIMARY KEY DEFAULT (
  lower(hex(randomblob(4))) || '-' ||
  lower(hex(randomblob(2))) || '-4' ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  substr('89ab', abs(random()) % 4 + 1, 1) ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  lower(hex(randomblob(6)))
) NOT NULL,
	`context_assembly_id` text NOT NULL,
	`subject_type` text NOT NULL,
	`subject_id` text NOT NULL,
	`reason` text NOT NULL,
	`explanation` text NOT NULL,
	`score` integer,
	`trust_tier` text DEFAULT 'medium' NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`context_assembly_id`) REFERENCES `context_assemblies`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "context_exclusions_subject_type_enum_check" CHECK("context_exclusions"."subject_type" in ('source_artifact', 'source_chunk', 'source_claim', 'memory_record', 'anti_memory_record', 'task_contract', 'search_document', 'owner_file', 'evidence_bundle', 'review_assessment', 'architecture_decision', 'run_event')),
	CONSTRAINT "context_exclusions_reason_enum_check" CHECK("context_exclusions"."reason" in ('stale', 'invalidated', 'low_trust', 'low_context_roi', 'over_budget', 'duplicate', 'irrelevant', 'unsafe', 'superseded')),
	CONSTRAINT "context_exclusions_trust_tier_enum_check" CHECK("context_exclusions"."trust_tier" in ('high', 'medium', 'low', 'primary', 'official', 'project-decision', 'source-code', 'paper', 'practitioner', 'secondary', 'hypothesis'))
);
--> statement-breakpoint
CREATE INDEX `context_exclusions_context_assembly_id_idx` ON `context_exclusions` (`context_assembly_id`);--> statement-breakpoint
CREATE INDEX `context_exclusions_subject_idx` ON `context_exclusions` (`subject_type`,`subject_id`);--> statement-breakpoint
CREATE INDEX `context_exclusions_reason_idx` ON `context_exclusions` (`reason`);--> statement-breakpoint
CREATE TABLE `context_items` (
	`id` text PRIMARY KEY DEFAULT (
  lower(hex(randomblob(4))) || '-' ||
  lower(hex(randomblob(2))) || '-4' ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  substr('89ab', abs(random()) % 4 + 1, 1) ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  lower(hex(randomblob(6)))
) NOT NULL,
	`context_assembly_id` text NOT NULL,
	`subject_type` text NOT NULL,
	`subject_id` text NOT NULL,
	`position` integer NOT NULL,
	`reason` text NOT NULL,
	`expected_use` text NOT NULL,
	`token_estimate` integer,
	`trust_tier` text DEFAULT 'medium' NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`context_assembly_id`) REFERENCES `context_assemblies`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "context_items_subject_type_enum_check" CHECK("context_items"."subject_type" in ('source_artifact', 'source_chunk', 'source_claim', 'memory_record', 'anti_memory_record', 'task_contract', 'search_document', 'owner_file', 'evidence_bundle', 'review_assessment', 'architecture_decision', 'run_event')),
	CONSTRAINT "context_items_trust_tier_enum_check" CHECK("context_items"."trust_tier" in ('high', 'medium', 'low', 'primary', 'official', 'project-decision', 'source-code', 'paper', 'practitioner', 'secondary', 'hypothesis'))
);
--> statement-breakpoint
CREATE INDEX `context_items_context_assembly_id_idx` ON `context_items` (`context_assembly_id`);--> statement-breakpoint
CREATE INDEX `context_items_subject_idx` ON `context_items` (`subject_type`,`subject_id`);--> statement-breakpoint
CREATE INDEX `context_items_position_idx` ON `context_items` (`position`);--> statement-breakpoint
CREATE TABLE `embedding_models` (
	`id` text PRIMARY KEY DEFAULT (
  lower(hex(randomblob(4))) || '-' ||
  lower(hex(randomblob(2))) || '-4' ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  substr('89ab', abs(random()) % 4 + 1, 1) ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  lower(hex(randomblob(6)))
) NOT NULL,
	`provider` text NOT NULL,
	`model` text NOT NULL,
	`dimensions` integer NOT NULL,
	`distance_metric` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	CONSTRAINT "embedding_models_status_enum_check" CHECK("embedding_models"."status" in ('active', 'deprecated', 'disabled'))
);
--> statement-breakpoint
CREATE INDEX `embedding_models_provider_model_idx` ON `embedding_models` (`provider`,`model`);--> statement-breakpoint
CREATE INDEX `embedding_models_status_idx` ON `embedding_models` (`status`);--> statement-breakpoint
CREATE TABLE `embeddings` (
	`id` text PRIMARY KEY DEFAULT (
  lower(hex(randomblob(4))) || '-' ||
  lower(hex(randomblob(2))) || '-4' ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  substr('89ab', abs(random()) % 4 + 1, 1) ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  lower(hex(randomblob(6)))
) NOT NULL,
	`project_id` text,
	`embedding_model_id` text NOT NULL,
	`subject_type` text NOT NULL,
	`subject_id` text NOT NULL,
	`source_artifact_id` text,
	`source_chunk_id` text,
	`source_claim_id` text,
	`memory_record_id` text,
	`anti_memory_record_id` text,
	`search_document_id` text,
	`embedding` text NOT NULL,
	`content_hash` text NOT NULL,
	`trust_tier` text DEFAULT 'medium' NOT NULL,
	`validity_status` text DEFAULT 'active' NOT NULL,
	`metadata_filters` text DEFAULT '{}' NOT NULL,
	`valid_from` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`valid_until` integer,
	`invalidated_at` integer,
	`metadata` text DEFAULT '{}' NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`embedding_model_id`) REFERENCES `embedding_models`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`source_artifact_id`) REFERENCES `source_artifacts`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`source_chunk_id`) REFERENCES `source_chunks`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`source_claim_id`) REFERENCES `source_claims`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`memory_record_id`) REFERENCES `memory_records`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`anti_memory_record_id`) REFERENCES `anti_memory_records`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`search_document_id`) REFERENCES `search_documents`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "embeddings_subject_type_enum_check" CHECK("embeddings"."subject_type" in ('source_artifact', 'source_chunk', 'source_claim', 'memory_record', 'anti_memory_record', 'task_contract', 'search_document', 'owner_file', 'evidence_bundle', 'review_assessment', 'architecture_decision', 'run_event')),
	CONSTRAINT "embeddings_trust_tier_enum_check" CHECK("embeddings"."trust_tier" in ('high', 'medium', 'low', 'primary', 'official', 'project-decision', 'source-code', 'paper', 'practitioner', 'secondary', 'hypothesis')),
	CONSTRAINT "embeddings_validity_status_enum_check" CHECK("embeddings"."validity_status" in ('active', 'expired', 'invalidated')),
	CONSTRAINT "embeddings_embedding_dimensions" CHECK(json_array_length("embeddings"."embedding") = 1536)
);
--> statement-breakpoint
CREATE INDEX `embeddings_project_id_idx` ON `embeddings` (`project_id`);--> statement-breakpoint
CREATE INDEX `embeddings_model_id_idx` ON `embeddings` (`embedding_model_id`);--> statement-breakpoint
CREATE INDEX `embeddings_search_document_id_idx` ON `embeddings` (`search_document_id`);--> statement-breakpoint
CREATE INDEX `embeddings_subject_idx` ON `embeddings` (`subject_type`,`subject_id`);--> statement-breakpoint
CREATE INDEX `embeddings_validity_status_idx` ON `embeddings` (`validity_status`);--> statement-breakpoint
CREATE INDEX `embeddings_valid_until_idx` ON `embeddings` (`valid_until`);--> statement-breakpoint
CREATE TABLE `retrieval_candidates` (
	`id` text PRIMARY KEY DEFAULT (
  lower(hex(randomblob(4))) || '-' ||
  lower(hex(randomblob(2))) || '-4' ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  substr('89ab', abs(random()) % 4 + 1, 1) ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  lower(hex(randomblob(6)))
) NOT NULL,
	`retrieval_run_id` text NOT NULL,
	`kind` text NOT NULL,
	`status` text DEFAULT 'candidate' NOT NULL,
	`subject_type` text NOT NULL,
	`subject_id` text NOT NULL,
	`search_document_id` text,
	`trust_tier` text DEFAULT 'medium' NOT NULL,
	`lexical_score` integer,
	`vector_score` integer,
	`graph_score` integer,
	`temporal_score` integer,
	`context_roi_score` integer,
	`total_score` integer,
	`score` integer,
	`reason` text NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`retrieval_run_id`) REFERENCES `retrieval_runs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`search_document_id`) REFERENCES `search_documents`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "retrieval_candidates_kind_enum_check" CHECK("retrieval_candidates"."kind" in ('memory', 'anti_memory', 'source', 'search')),
	CONSTRAINT "retrieval_candidates_status_enum_check" CHECK("retrieval_candidates"."status" in ('candidate', 'included', 'excluded')),
	CONSTRAINT "retrieval_candidates_subject_type_enum_check" CHECK("retrieval_candidates"."subject_type" in ('source_artifact', 'source_chunk', 'source_claim', 'memory_record', 'anti_memory_record', 'task_contract', 'search_document', 'owner_file', 'evidence_bundle', 'review_assessment', 'architecture_decision', 'run_event')),
	CONSTRAINT "retrieval_candidates_trust_tier_enum_check" CHECK("retrieval_candidates"."trust_tier" in ('high', 'medium', 'low', 'primary', 'official', 'project-decision', 'source-code', 'paper', 'practitioner', 'secondary', 'hypothesis'))
);
--> statement-breakpoint
CREATE INDEX `retrieval_candidates_retrieval_run_id_idx` ON `retrieval_candidates` (`retrieval_run_id`);--> statement-breakpoint
CREATE INDEX `retrieval_candidates_status_idx` ON `retrieval_candidates` (`status`);--> statement-breakpoint
CREATE INDEX `retrieval_candidates_subject_idx` ON `retrieval_candidates` (`subject_type`,`subject_id`);--> statement-breakpoint
CREATE INDEX `retrieval_candidates_search_document_id_idx` ON `retrieval_candidates` (`search_document_id`);--> statement-breakpoint
CREATE INDEX `retrieval_candidates_total_score_idx` ON `retrieval_candidates` (`total_score`);--> statement-breakpoint
CREATE TABLE `retrieval_runs` (
	`id` text PRIMARY KEY DEFAULT (
  lower(hex(randomblob(4))) || '-' ||
  lower(hex(randomblob(2))) || '-4' ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  substr('89ab', abs(random()) % 4 + 1, 1) ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  lower(hex(randomblob(6)))
) NOT NULL,
	`project_id` text,
	`execution_run_id` text,
	`task_contract_id` text,
	`status` text DEFAULT 'running' NOT NULL,
	`query` text NOT NULL,
	`mode` text DEFAULT 'mixed' NOT NULL,
	`budget` integer,
	`token_budget` integer,
	`metadata_filters` text DEFAULT '{}' NOT NULL,
	`started_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`completed_at` integer,
	`metadata` text DEFAULT '{}' NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`execution_run_id`) REFERENCES `execution_runs`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`task_contract_id`) REFERENCES `task_contracts`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "retrieval_runs_status_enum_check" CHECK("retrieval_runs"."status" in ('running', 'completed', 'abstained', 'failed')),
	CONSTRAINT "retrieval_runs_mode_enum_check" CHECK("retrieval_runs"."mode" in ('lexical', 'vector', 'hybrid', 'graph', 'mixed'))
);
--> statement-breakpoint
CREATE INDEX `retrieval_runs_project_id_idx` ON `retrieval_runs` (`project_id`);--> statement-breakpoint
CREATE INDEX `retrieval_runs_execution_run_id_idx` ON `retrieval_runs` (`execution_run_id`);--> statement-breakpoint
CREATE INDEX `retrieval_runs_task_contract_id_idx` ON `retrieval_runs` (`task_contract_id`);--> statement-breakpoint
CREATE INDEX `retrieval_runs_status_idx` ON `retrieval_runs` (`status`);--> statement-breakpoint
CREATE TABLE `search_documents` (
	`id` text PRIMARY KEY DEFAULT (
  lower(hex(randomblob(4))) || '-' ||
  lower(hex(randomblob(2))) || '-4' ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  substr('89ab', abs(random()) % 4 + 1, 1) ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  lower(hex(randomblob(6)))
) NOT NULL,
	`project_id` text,
	`subject_type` text NOT NULL,
	`subject_id` text NOT NULL,
	`source_artifact_id` text,
	`source_chunk_id` text,
	`source_claim_id` text,
	`memory_record_id` text,
	`anti_memory_record_id` text,
	`evidence_bundle_id` text,
	`review_assessment_id` text,
	`source_decision_id` text,
	`run_event_id` text,
	`trust_tier` text DEFAULT 'medium' NOT NULL,
	`validity_status` text DEFAULT 'active' NOT NULL,
	`language` text DEFAULT 'english' NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`search_text` text DEFAULT '' NOT NULL,
	`search_vector` text,
	`metadata_filters` text DEFAULT '{}' NOT NULL,
	`valid_from` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`valid_until` integer,
	`invalidated_at` integer,
	`metadata` text DEFAULT '{}' NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`source_artifact_id`) REFERENCES `source_artifacts`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`source_chunk_id`) REFERENCES `source_chunks`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`source_claim_id`) REFERENCES `source_claims`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`memory_record_id`) REFERENCES `memory_records`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`anti_memory_record_id`) REFERENCES `anti_memory_records`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`evidence_bundle_id`) REFERENCES `evidence_bundles`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`review_assessment_id`) REFERENCES `review_assessments`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`source_decision_id`) REFERENCES `source_decisions`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`run_event_id`) REFERENCES `run_events`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "search_documents_subject_type_enum_check" CHECK("search_documents"."subject_type" in ('source_artifact', 'source_chunk', 'source_claim', 'memory_record', 'anti_memory_record', 'task_contract', 'search_document', 'owner_file', 'evidence_bundle', 'review_assessment', 'architecture_decision', 'run_event')),
	CONSTRAINT "search_documents_trust_tier_enum_check" CHECK("search_documents"."trust_tier" in ('high', 'medium', 'low', 'primary', 'official', 'project-decision', 'source-code', 'paper', 'practitioner', 'secondary', 'hypothesis')),
	CONSTRAINT "search_documents_validity_status_enum_check" CHECK("search_documents"."validity_status" in ('active', 'expired', 'invalidated')),
	CONSTRAINT "search_documents_validity_window" CHECK(("search_documents"."valid_until" IS NULL OR "search_documents"."valid_until" > "search_documents"."valid_from")
        AND ("search_documents"."invalidated_at" IS NULL OR "search_documents"."invalidated_at" >= "search_documents"."valid_from")),
	CONSTRAINT "search_documents_validity_status_timestamps" CHECK((
        ("search_documents"."validity_status" = 'invalidated' AND "search_documents"."invalidated_at" IS NOT NULL)
        OR ("search_documents"."validity_status" IN ('active', 'expired') AND "search_documents"."invalidated_at" IS NULL)
      ))
);
--> statement-breakpoint
CREATE INDEX `search_documents_project_id_idx` ON `search_documents` (`project_id`);--> statement-breakpoint
CREATE INDEX `search_documents_subject_idx` ON `search_documents` (`subject_type`,`subject_id`);--> statement-breakpoint
CREATE INDEX `search_documents_evidence_bundle_id_idx` ON `search_documents` (`evidence_bundle_id`);--> statement-breakpoint
CREATE INDEX `search_documents_review_assessment_id_idx` ON `search_documents` (`review_assessment_id`);--> statement-breakpoint
CREATE INDEX `search_documents_source_decision_id_idx` ON `search_documents` (`source_decision_id`);--> statement-breakpoint
CREATE INDEX `search_documents_run_event_id_idx` ON `search_documents` (`run_event_id`);--> statement-breakpoint
CREATE INDEX `search_documents_validity_status_idx` ON `search_documents` (`validity_status`);--> statement-breakpoint
CREATE INDEX `search_documents_valid_until_idx` ON `search_documents` (`valid_until`);--> statement-breakpoint
CREATE TABLE `source_artifacts` (
	`id` text PRIMARY KEY DEFAULT (
  lower(hex(randomblob(4))) || '-' ||
  lower(hex(randomblob(2))) || '-4' ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  substr('89ab', abs(random()) % 4 + 1, 1) ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  lower(hex(randomblob(6)))
) NOT NULL,
	`project_id` text,
	`import_id` text,
	`import_row_id` text,
	`kind` text NOT NULL,
	`trust_tier` text NOT NULL,
	`uri` text NOT NULL,
	`title` text NOT NULL,
	`content_hash` text NOT NULL,
	`captured_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "source_artifacts_kind_enum_check" CHECK("source_artifacts"."kind" in ('doc', 'file', 'url', 'paper', 'run', 'operator_input', 'external_doc')),
	CONSTRAINT "source_artifacts_trust_tier_enum_check" CHECK("source_artifacts"."trust_tier" in ('high', 'medium', 'low', 'primary', 'official', 'project-decision', 'source-code', 'paper', 'practitioner', 'secondary', 'hypothesis')),
	CONSTRAINT "source_artifacts_import_tuple_complete" CHECK((
        ("source_artifacts"."import_id" IS NULL AND "source_artifacts"."import_row_id" IS NULL)
        OR (
          NULLIF(trim("source_artifacts"."import_id"), '') IS NOT NULL
          AND NULLIF(trim("source_artifacts"."import_row_id"), '') IS NOT NULL
        )
      )),
	CONSTRAINT "source_artifacts_import_content_hash_sha256" CHECK("source_artifacts"."import_id" IS NULL OR (length("source_artifacts"."content_hash") = 64 AND "source_artifacts"."content_hash" NOT GLOB '*[^0-9a-f]*'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `source_artifacts_uri_hash_unique` ON `source_artifacts` (`uri`,`content_hash`);--> statement-breakpoint
CREATE UNIQUE INDEX `source_artifacts_project_import_row_unique` ON `source_artifacts` (`project_id`,`import_id`,`import_row_id`);--> statement-breakpoint
CREATE INDEX `source_artifacts_project_id_idx` ON `source_artifacts` (`project_id`);--> statement-breakpoint
CREATE INDEX `source_artifacts_kind_idx` ON `source_artifacts` (`kind`);--> statement-breakpoint
CREATE INDEX `source_artifacts_trust_tier_idx` ON `source_artifacts` (`trust_tier`);--> statement-breakpoint
CREATE TABLE `source_authority_quarantines` (
	`id` text PRIMARY KEY DEFAULT (
  lower(hex(randomblob(4))) || '-' ||
  lower(hex(randomblob(2))) || '-4' ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  substr('89ab', abs(random()) % 4 + 1, 1) ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  lower(hex(randomblob(6)))
) NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`reason` text NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`quarantined_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `source_authority_quarantines_entity_reason_unique` ON `source_authority_quarantines` (`entity_type`,`entity_id`,`reason`);--> statement-breakpoint
CREATE INDEX `source_authority_quarantines_entity_idx` ON `source_authority_quarantines` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE TABLE `source_chunks` (
	`id` text PRIMARY KEY DEFAULT (
  lower(hex(randomblob(4))) || '-' ||
  lower(hex(randomblob(2))) || '-4' ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  substr('89ab', abs(random()) % 4 + 1, 1) ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  lower(hex(randomblob(6)))
) NOT NULL,
	`source_artifact_id` text NOT NULL,
	`ordinal` integer NOT NULL,
	`heading` text,
	`content` text NOT NULL,
	`token_count` integer,
	`content_hash` text NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`source_artifact_id`) REFERENCES `source_artifacts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `source_chunks_id_artifact_unique` ON `source_chunks` (`id`,`source_artifact_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `source_chunks_artifact_ordinal_unique` ON `source_chunks` (`source_artifact_id`,`ordinal`);--> statement-breakpoint
CREATE INDEX `source_chunks_source_artifact_id_idx` ON `source_chunks` (`source_artifact_id`);--> statement-breakpoint
CREATE INDEX `source_chunks_content_hash_idx` ON `source_chunks` (`content_hash`);--> statement-breakpoint
CREATE TABLE `source_claim_edges` (
	`id` text PRIMARY KEY DEFAULT (
  lower(hex(randomblob(4))) || '-' ||
  lower(hex(randomblob(2))) || '-4' ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  substr('89ab', abs(random()) % 4 + 1, 1) ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  lower(hex(randomblob(6)))
) NOT NULL,
	`from_source_claim_id` text NOT NULL,
	`to_source_claim_id` text NOT NULL,
	`kind` text NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`from_source_claim_id`) REFERENCES `source_claims`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`to_source_claim_id`) REFERENCES `source_claims`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "source_claim_edges_kind_enum_check" CHECK("source_claim_edges"."kind" in ('supports', 'contradicts', 'qualifies', 'depends_on', 'supersedes', 'duplicates', 'narrows', 'invalidates', 'expires')),
	CONSTRAINT "source_claim_edges_distinct_claims" CHECK("source_claim_edges"."from_source_claim_id" <> "source_claim_edges"."to_source_claim_id")
);
--> statement-breakpoint
CREATE UNIQUE INDEX `source_claim_edges_semantic_identity_unique` ON `source_claim_edges` (`from_source_claim_id`,`to_source_claim_id`,`kind`);--> statement-breakpoint
CREATE INDEX `source_claim_edges_from_idx` ON `source_claim_edges` (`from_source_claim_id`);--> statement-breakpoint
CREATE INDEX `source_claim_edges_to_idx` ON `source_claim_edges` (`to_source_claim_id`);--> statement-breakpoint
CREATE INDEX `source_claim_edges_kind_idx` ON `source_claim_edges` (`kind`);--> statement-breakpoint
CREATE TABLE `source_claims` (
	`id` text PRIMARY KEY DEFAULT (
  lower(hex(randomblob(4))) || '-' ||
  lower(hex(randomblob(2))) || '-4' ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  substr('89ab', abs(random()) % 4 + 1, 1) ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  lower(hex(randomblob(6)))
) NOT NULL,
	`source_artifact_id` text NOT NULL,
	`source_chunk_id` text,
	`execution_run_id` text,
	`claim` text NOT NULL,
	`mechanism` text NOT NULL,
	`krn_implication` text NOT NULL,
	`does_not_prove` text NOT NULL,
	`trust_tier` text NOT NULL,
	`support_type` text NOT NULL,
	`consumer` text NOT NULL,
	`falsifier` text,
	`revisit_when` text,
	`status` text DEFAULT 'proposed' NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`source_artifact_id`) REFERENCES `source_artifacts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`source_chunk_id`) REFERENCES `source_chunks`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`execution_run_id`) REFERENCES `execution_runs`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`source_chunk_id`,`source_artifact_id`) REFERENCES `source_chunks`(`id`,`source_artifact_id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "source_claims_trust_tier_enum_check" CHECK("source_claims"."trust_tier" in ('high', 'medium', 'low', 'primary', 'official', 'project-decision', 'source-code', 'paper', 'practitioner', 'secondary', 'hypothesis')),
	CONSTRAINT "source_claims_support_type_enum_check" CHECK("source_claims"."support_type" in ('supports', 'contradicts', 'qualifies', 'background', 'does_not_support', 'mechanism', 'decision', 'risk', 'rejection', 'eval-design', 'implementation-boundary')),
	CONSTRAINT "source_claims_status_enum_check" CHECK("source_claims"."status" in ('proposed', 'accepted', 'rejected', 'deprecated'))
);
--> statement-breakpoint
CREATE INDEX `source_claims_source_artifact_id_idx` ON `source_claims` (`source_artifact_id`);--> statement-breakpoint
CREATE INDEX `source_claims_source_chunk_id_idx` ON `source_claims` (`source_chunk_id`);--> statement-breakpoint
CREATE INDEX `source_claims_execution_run_id_idx` ON `source_claims` (`execution_run_id`);--> statement-breakpoint
CREATE INDEX `source_claims_trust_tier_idx` ON `source_claims` (`trust_tier`);--> statement-breakpoint
CREATE INDEX `source_claims_support_type_idx` ON `source_claims` (`support_type`);--> statement-breakpoint
CREATE INDEX `source_claims_consumer_idx` ON `source_claims` (`consumer`);--> statement-breakpoint
CREATE INDEX `source_claims_status_idx` ON `source_claims` (`status`);--> statement-breakpoint
CREATE TABLE `source_decision_edges` (
	`id` text PRIMARY KEY DEFAULT (
  lower(hex(randomblob(4))) || '-' ||
  lower(hex(randomblob(2))) || '-4' ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  substr('89ab', abs(random()) % 4 + 1, 1) ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  lower(hex(randomblob(6)))
) NOT NULL,
	`source_claim_id` text NOT NULL,
	`source_decision_id` text NOT NULL,
	`target_type` text NOT NULL,
	`target_id` text NOT NULL,
	`support_type` text NOT NULL,
	`confidence` text NOT NULL,
	`notes` text NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`source_claim_id`) REFERENCES `source_claims`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`source_decision_id`) REFERENCES `source_decisions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`source_decision_id`,`source_claim_id`) REFERENCES `source_decisions`(`id`,`source_claim_id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "source_decision_edges_target_type_enum_check" CHECK("source_decision_edges"."target_type" in ('harness_run', 'task_contract', 'harness_plan', 'context_assembly', 'evidence_bundle', 'review_assessment', 'feedback_delta', 'architecture_decision', 'memory_record', 'eval_candidate')),
	CONSTRAINT "source_decision_edges_support_type_enum_check" CHECK("source_decision_edges"."support_type" in ('supports', 'contradicts', 'qualifies', 'background', 'does_not_support', 'mechanism', 'decision', 'risk', 'rejection', 'eval-design', 'implementation-boundary')),
	CONSTRAINT "source_decision_edges_confidence_enum_check" CHECK("source_decision_edges"."confidence" in ('low', 'medium', 'high'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `source_decision_edges_identity_unique` ON `source_decision_edges` (`source_claim_id`,`source_decision_id`,`target_type`,`target_id`,`support_type`);--> statement-breakpoint
CREATE INDEX `source_decision_edges_source_claim_id_idx` ON `source_decision_edges` (`source_claim_id`);--> statement-breakpoint
CREATE INDEX `source_decision_edges_source_decision_id_idx` ON `source_decision_edges` (`source_decision_id`);--> statement-breakpoint
CREATE INDEX `source_decision_edges_target_idx` ON `source_decision_edges` (`target_type`,`target_id`);--> statement-breakpoint
CREATE INDEX `source_decision_edges_support_type_idx` ON `source_decision_edges` (`support_type`);--> statement-breakpoint
CREATE INDEX `source_decision_edges_confidence_idx` ON `source_decision_edges` (`confidence`);--> statement-breakpoint
CREATE TABLE `source_decisions` (
	`id` text PRIMARY KEY DEFAULT (
  lower(hex(randomblob(4))) || '-' ||
  lower(hex(randomblob(2))) || '-4' ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  substr('89ab', abs(random()) % 4 + 1, 1) ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  lower(hex(randomblob(6)))
) NOT NULL,
	`project_id` text,
	`source_claim_id` text,
	`status` text NOT NULL,
	`decision` text NOT NULL,
	`rationale` text NOT NULL,
	`falsifier` text NOT NULL,
	`consumer` text NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`source_claim_id`) REFERENCES `source_claims`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "source_decisions_status_enum_check" CHECK("source_decisions"."status" in ('adopt', 'reject', 'defer', 'lab_test'))
);
--> statement-breakpoint
CREATE INDEX `source_decisions_project_id_idx` ON `source_decisions` (`project_id`);--> statement-breakpoint
CREATE INDEX `source_decisions_source_claim_id_idx` ON `source_decisions` (`source_claim_id`);--> statement-breakpoint
CREATE INDEX `source_decisions_status_idx` ON `source_decisions` (`status`);--> statement-breakpoint
CREATE INDEX `source_decisions_consumer_idx` ON `source_decisions` (`consumer`);--> statement-breakpoint
CREATE UNIQUE INDEX `source_decisions_terminal_claim_unique` ON `source_decisions` (`source_claim_id`) WHERE "source_decisions"."status" in ('adopt', 'reject');--> statement-breakpoint
CREATE UNIQUE INDEX `source_decisions_id_claim_unique` ON `source_decisions` (`id`,`source_claim_id`);--> statement-breakpoint
CREATE TABLE `source_rejections` (
	`id` text PRIMARY KEY DEFAULT (
  lower(hex(randomblob(4))) || '-' ||
  lower(hex(randomblob(2))) || '-4' ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  substr('89ab', abs(random()) % 4 + 1, 1) ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  lower(hex(randomblob(6)))
) NOT NULL,
	`project_id` text,
	`execution_run_id` text,
	`source_artifact_id` text,
	`source_claim_id` text,
	`title` text DEFAULT 'untitled source rejection' NOT NULL,
	`attempted_claim` text DEFAULT 'unspecified attempted claim' NOT NULL,
	`rejected_because` text DEFAULT 'unsupported' NOT NULL,
	`reason` text NOT NULL,
	`does_not_prove` text NOT NULL,
	`consumer` text NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`rejected_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`execution_run_id`) REFERENCES `execution_runs`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`source_artifact_id`) REFERENCES `source_artifacts`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`source_claim_id`) REFERENCES `source_claims`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "source_rejections_rejected_because_enum_check" CHECK("source_rejections"."rejected_because" in ('no_mechanism', 'no_consumer', 'decorative', 'stale', 'conflicting', 'unsupported', 'duplicate'))
);
--> statement-breakpoint
CREATE INDEX `source_rejections_project_id_idx` ON `source_rejections` (`project_id`);--> statement-breakpoint
CREATE INDEX `source_rejections_execution_run_id_idx` ON `source_rejections` (`execution_run_id`);--> statement-breakpoint
CREATE INDEX `source_rejections_source_artifact_id_idx` ON `source_rejections` (`source_artifact_id`);--> statement-breakpoint
CREATE INDEX `source_rejections_source_claim_id_idx` ON `source_rejections` (`source_claim_id`);--> statement-breakpoint
CREATE INDEX `source_rejections_consumer_idx` ON `source_rejections` (`consumer`);--> statement-breakpoint
CREATE INDEX `source_rejections_rejected_because_idx` ON `source_rejections` (`rejected_because`);--> statement-breakpoint
CREATE TABLE `source_snapshots` (
	`id` text PRIMARY KEY DEFAULT (
  lower(hex(randomblob(4))) || '-' ||
  lower(hex(randomblob(2))) || '-4' ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  substr('89ab', abs(random()) % 4 + 1, 1) ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  lower(hex(randomblob(6)))
) NOT NULL,
	`source_artifact_id` text NOT NULL,
	`snapshot_uri` text NOT NULL,
	`content_hash` text NOT NULL,
	`captured_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`source_artifact_id`) REFERENCES `source_artifacts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `source_snapshots_artifact_hash_unique` ON `source_snapshots` (`source_artifact_id`,`content_hash`);--> statement-breakpoint
CREATE INDEX `source_snapshots_source_artifact_id_idx` ON `source_snapshots` (`source_artifact_id`);