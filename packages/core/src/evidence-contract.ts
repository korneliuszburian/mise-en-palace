import type {
  DiffRisk
} from "./evidence-bundle.js";

export interface EvidenceContractCommand {
  command: string;
  required: boolean;
}

export interface EvidenceContract {
  commands: EvidenceContractCommand[];
  diffRisk: DiffRisk;
  reviewBurden: string;
  rollbackPath: string;
  metadata: Record<string, unknown>;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isDiffRisk = (value: unknown): value is DiffRisk =>
  value === "low" || value === "medium" || value === "high";

export const parseEvidenceContract = (value: unknown): EvidenceContract | undefined => {
  if (!isRecord(value) || !Array.isArray(value.commands)) {
    return undefined;
  }

  const commands = value.commands.map((item): EvidenceContractCommand | undefined => {
    if (!isRecord(item) || typeof item.command !== "string" || typeof item.required !== "boolean") {
      return undefined;
    }

    return {
      command: item.command,
      required: item.required
    };
  });

  if (
    commands.length === 0 ||
    commands.some((command) => command === undefined) ||
    !isDiffRisk(value.diffRisk) ||
    typeof value.reviewBurden !== "string" ||
    typeof value.rollbackPath !== "string"
  ) {
    return undefined;
  }

  const validCommands = commands.filter(
    (command): command is EvidenceContractCommand => command !== undefined
  );

  return {
    commands: validCommands,
    diffRisk: value.diffRisk,
    reviewBurden: value.reviewBurden,
    rollbackPath: value.rollbackPath,
    metadata: isRecord(value.metadata) ? value.metadata : {}
  };
};
