import { z } from "zod";

const MetadataSchema = z.object({}).catchall(z.unknown()).default({});

export const OperatorIntentSourceSchema = z.enum([
  "goal",
  "cli",
  "api",
  "codex",
  "operator"
]);

export const OperatorIntentInputSchema = z.object({
  rawIntent: z.string().trim().min(1),
  source: OperatorIntentSourceSchema,
  workspaceSlug: z.string().trim().min(1).optional(),
  projectSlug: z.string().trim().min(1).optional(),
  metadata: MetadataSchema
});

export type OperatorIntentInput = z.infer<typeof OperatorIntentInputSchema>;

export function parseOperatorIntentInput(input: unknown): OperatorIntentInput {
  return OperatorIntentInputSchema.parse(input);
}
