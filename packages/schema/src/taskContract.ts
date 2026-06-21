import { z } from "zod";

const MetadataSchema = z.object({}).catchall(z.unknown()).default({});
const StringListSchema = z.array(z.string().trim().min(1)).default([]);

export const TaskContractInputSchema = z.object({
  title: z.string().trim().min(1),
  objective: z.string().trim().min(1),
  constraints: StringListSchema,
  nonGoals: StringListSchema,
  acceptance: StringListSchema,
  metadata: MetadataSchema
});

export type TaskContractInput = z.infer<typeof TaskContractInputSchema>;

export function parseTaskContractInput(input: unknown): TaskContractInput {
  return TaskContractInputSchema.parse(input);
}
