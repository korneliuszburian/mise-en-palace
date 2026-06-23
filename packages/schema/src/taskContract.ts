import { z } from "zod";
import {
  MetadataSchema,
  RequiredTextSchema,
  TextListSchema
} from "./schemaPrimitives.js";

export const TaskContractInputSchema = z.object({
  title: RequiredTextSchema,
  objective: RequiredTextSchema,
  constraints: TextListSchema,
  nonGoals: TextListSchema,
  acceptance: TextListSchema,
  metadata: MetadataSchema
});

export type TaskContractInput = z.infer<typeof TaskContractInputSchema>;

export function parseTaskContractInput(input: unknown): TaskContractInput {
  return TaskContractInputSchema.parse(input);
}
