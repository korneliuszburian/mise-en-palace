import {
  z
} from "zod";

export const privateReasoningMetadataKeys = new Set([
  "chainOfThought",
  "chain_of_thought",
  "reasoningTrace",
  "reasoning_trace",
  "privateReasoning",
  "private_reasoning",
  "hiddenReasoning",
  "hidden_reasoning"
]);

export const rejectForbiddenMetadataKeys = (
  value: Record<string, unknown>,
  context: z.RefinementCtx,
  options: {
    keys: ReadonlySet<string>;
    message: string;
  }
): void => {
  for (const key of Object.keys(value)) {
    if (options.keys.has(key)) {
      context.addIssue({
        code: "custom",
        message: options.message,
        path: [key]
      });
    }
  }
};

export const PublicMetadataSchema = z.object({})
  .catchall(z.unknown())
  .superRefine((value, context) => {
    rejectForbiddenMetadataKeys(value, context, {
      keys: privateReasoningMetadataKeys,
      message: "public metadata cannot store private reasoning"
    });
  })
  .default({});

export const MetadataSchema = PublicMetadataSchema;
export const RequiredTextSchema = z.string().trim().min(1);
export const OptionalTextSchema = RequiredTextSchema.optional();
export const TextListSchema = z.array(RequiredTextSchema).default([]);
export const NonEmptyTextListSchema = z.array(RequiredTextSchema).min(1);
