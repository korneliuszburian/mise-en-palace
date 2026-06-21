import { z } from "zod";

import { OperatorIntentInputSchema } from "./operatorIntent.js";
import { TaskContractInputSchema } from "./taskContract.js";

const MetadataSchema = z.object({}).catchall(z.unknown()).default({});

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
