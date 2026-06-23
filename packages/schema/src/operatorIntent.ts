import { z } from "zod";
import {
  MetadataSchema,
  OptionalTextSchema,
  RequiredTextSchema
} from "./schemaPrimitives.js";

export const OperatorIntentSourceSchema = z.enum([
  "goal",
  "cli",
  "api",
  "codex",
  "operator"
]);

export const OperatorIntentInputSchema = z.object({
  rawIntent: RequiredTextSchema,
  source: OperatorIntentSourceSchema,
  workspaceSlug: OptionalTextSchema,
  projectSlug: OptionalTextSchema,
  metadata: MetadataSchema
});

export type OperatorIntentInput = z.infer<typeof OperatorIntentInputSchema>;

export function parseOperatorIntentInput(input: unknown): OperatorIntentInput {
  return OperatorIntentInputSchema.parse(input);
}
