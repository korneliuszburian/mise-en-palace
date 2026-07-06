import { z } from "zod";

import { OperatorIntentInputSchema } from "./operator-intent.js";
import { TaskContractInputSchema } from "./task-contract.js";
import {
  MetadataSchema
} from "./schema-primitives.js";

export const HarnessCompileInputSchema = z.object({
  operatorIntent: OperatorIntentInputSchema,
  taskContract: TaskContractInputSchema.optional(),
  tokenBudget: z.number().int().positive().optional(),
  metadata: MetadataSchema
});

export type HarnessCompileInput = z.infer<typeof HarnessCompileInputSchema>;

export function parseHarnessCompileInput(input: unknown): HarnessCompileInput {
  return HarnessCompileInputSchema.parse(input);
}
