PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_memory_feedback_events` (
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
	`run_id` text,
	`packet_checksum` text,
	`outcome` text,
	`idempotency_key` text,
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
	CONSTRAINT "memory_feedback_events_event_type_enum_check" CHECK("__new_memory_feedback_events"."event_type" in ('strengthened', 'demoted', 'invalidated', 'corrected', 'stale_detected')),
	CONSTRAINT "memory_feedback_events_direction_enum_check" CHECK("__new_memory_feedback_events"."direction" in ('positive', 'negative', 'correction')),
	CONSTRAINT "memory_feedback_events_packet_outcome_known" CHECK("__new_memory_feedback_events"."outcome" IS NULL OR "__new_memory_feedback_events"."outcome" IN ('helped', 'hurt', 'stale'))
);
--> statement-breakpoint
INSERT INTO `__new_memory_feedback_events`("id", "memory_record_id", "execution_run_id", "feedback_delta_id", "event_type", "direction", "note", "reason", "evidence_ref", "metadata", "created_at") SELECT "id", "memory_record_id", "execution_run_id", "feedback_delta_id", "event_type", "direction", "note", "reason", "evidence_ref", "metadata", "created_at" FROM `memory_feedback_events`;--> statement-breakpoint
DROP TABLE `memory_feedback_events`;--> statement-breakpoint
ALTER TABLE `__new_memory_feedback_events` RENAME TO `memory_feedback_events`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `memory_feedback_events_memory_record_id_idx` ON `memory_feedback_events` (`memory_record_id`);--> statement-breakpoint
CREATE INDEX `memory_feedback_events_execution_run_id_idx` ON `memory_feedback_events` (`execution_run_id`);--> statement-breakpoint
CREATE INDEX `memory_feedback_events_feedback_delta_id_idx` ON `memory_feedback_events` (`feedback_delta_id`);--> statement-breakpoint
CREATE INDEX `memory_feedback_events_event_type_idx` ON `memory_feedback_events` (`event_type`);--> statement-breakpoint
CREATE INDEX `memory_feedback_events_direction_idx` ON `memory_feedback_events` (`direction`);--> statement-breakpoint
CREATE UNIQUE INDEX `memory_feedback_events_idempotency_key_unique` ON `memory_feedback_events` (`idempotency_key`);--> statement-breakpoint
CREATE INDEX `memory_feedback_events_memory_record_outcome_idx` ON `memory_feedback_events` (`memory_record_id`,`outcome`);
