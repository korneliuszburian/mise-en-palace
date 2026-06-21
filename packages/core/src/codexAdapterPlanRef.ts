import type {
  CodexAdapterPlanRefId,
  HarnessPlanId
} from "./ids.js";
import type { IsoTimestamp } from "./time.js";

export interface CodexAdapterPlanRef {
  id: CodexAdapterPlanRefId;
  harnessPlanId: HarnessPlanId;
  adapterPlanId: string;
  renderedArtifactRef?: string;
  metadata: Record<string, unknown>;
  createdAt: IsoTimestamp;
}
