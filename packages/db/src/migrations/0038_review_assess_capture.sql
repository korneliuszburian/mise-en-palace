ALTER TABLE "review_assessments" DROP CONSTRAINT "review_assessments_capture_channel_known";--> statement-breakpoint
ALTER TABLE "review_assessments" ADD CONSTRAINT "review_assessments_capture_channel_known" CHECK ("review_assessments"."capture_channel" is null or "review_assessments"."capture_channel" in ('evidence_feedback_v1', 'eval_feedback_v1', 'review_assess_v1'));--> statement-breakpoint
ALTER TABLE "feedback_deltas" DROP CONSTRAINT "feedback_deltas_capture_channel_known";--> statement-breakpoint
ALTER TABLE "feedback_deltas" ADD CONSTRAINT "feedback_deltas_capture_channel_known" CHECK ("feedback_deltas"."capture_channel" is null or "feedback_deltas"."capture_channel" in ('evidence_feedback_v1', 'eval_feedback_v1', 'review_assess_v1'));
