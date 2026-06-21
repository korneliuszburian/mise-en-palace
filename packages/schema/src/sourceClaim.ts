import { z } from "zod";

const MetadataSchema = z.object({}).catchall(z.unknown()).default({});

export const SourceTrustTierSchema = z.enum(["high", "medium", "low"]);

export const SourceSupportTypeSchema = z.enum([
  "supports",
  "contradicts",
  "qualifies",
  "background",
  "does_not_support"
]);

export const SourceClaimInputSchema = z.object({
  claim: z.string().trim().min(1),
  mechanism: z.string().trim().min(1),
  krnImplication: z.string().trim().min(1),
  doesNotProve: z.string().trim().min(1),
  trustTier: SourceTrustTierSchema,
  supportType: SourceSupportTypeSchema,
  consumer: z.string().trim().min(1),
  metadata: MetadataSchema
});

export type SourceClaimInput = z.infer<typeof SourceClaimInputSchema>;

export function parseSourceClaimInput(input: unknown): SourceClaimInput {
  return SourceClaimInputSchema.parse(input);
}
