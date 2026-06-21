import { z } from "zod";

const MetadataSchema = z.object({}).catchall(z.unknown()).default({});

export const SourceLineageItemSchema = z.object({
  sourceId: z.string().trim().min(1),
  note: z.string().trim().min(1).optional()
});

export const MemoryCandidateInputSchema = z
  .object({
    summary: z.string().trim().min(1),
    body: z.string().trim().min(1),
    owner: z.string().trim().min(1),
    confidence: z.number().int().min(0).max(100),
    applicationGuidance: z.string().trim().min(1),
    sourceLineage: z.array(SourceLineageItemSchema).default([]),
    isUserPreference: z.boolean().default(false),
    metadata: MetadataSchema
  })
  .superRefine((value, context) => {
    if (!value.isUserPreference && value.sourceLineage.length === 0) {
      context.addIssue({
        code: "custom",
        message: "sourceLineage is required unless isUserPreference is true",
        path: ["sourceLineage"]
      });
    }
  });

export type MemoryCandidateInput = z.infer<typeof MemoryCandidateInputSchema>;

export function parseMemoryCandidateInput(input: unknown): MemoryCandidateInput {
  return MemoryCandidateInputSchema.parse(input);
}
