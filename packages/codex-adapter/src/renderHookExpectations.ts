import type {
  EvidenceContract
} from "@krn/harness";

export const renderHookExpectations = (evidenceContract: EvidenceContract): string[] =>
  evidenceContract.commands
    .filter((command) => command.required)
    .map((command) => command.command);
