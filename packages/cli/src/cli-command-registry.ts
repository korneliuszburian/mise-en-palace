import type {
  CliCommand,
  ParseArgsResult
} from "./parse-args.js";
import {
  formatRunUsage,
  parseRunArgs
} from "./parse-run-args.js";

type RegisteredTopLevelCommand = "run";
type RegisteredCommandKind =
  | "runShow"
  | "runEvalEvidence"
  | "runEvalPromotionEligibility"
  | "runShowHelp";
export type RegisteredHelpCommandKind = Extract<RegisteredCommandKind, `${string}Help`>;

interface RegisteredCliCommandGroup<K extends RegisteredCommandKind> {
  readonly topLevelCommand: RegisteredTopLevelCommand;
  readonly commandKinds: readonly K[];
  parse(rest: readonly string[]): ParseArgsResult;
  formatHelp(kind: Extract<K, `${string}Help`>): string;
}

const runCommandGroup = {
  topLevelCommand: "run",
  commandKinds: [
    "runShow",
    "runEvalEvidence",
    "runEvalPromotionEligibility",
    "runShowHelp"
  ],
  parse: parseRunArgs,
  formatHelp: (_kind: "runShowHelp") => formatRunUsage()
} satisfies RegisteredCliCommandGroup<
  "runShow" | "runEvalEvidence" | "runEvalPromotionEligibility" | "runShowHelp"
>;

const registeredCliCommandGroups = [
  runCommandGroup
] as const;

const registeredTopLevelCommands: readonly RegisteredTopLevelCommand[] =
  registeredCliCommandGroups.map((group) => group.topLevelCommand)
;

const isRegisteredTopLevelCommand = (
  command: string
): command is RegisteredTopLevelCommand =>
  registeredTopLevelCommands.some((registeredCommand) => registeredCommand === command);

export const parseRegisteredTopLevelCommand = (
  command: string,
  rest: readonly string[]
): ParseArgsResult | undefined => {
  if (!isRegisteredTopLevelCommand(command)) {
    return undefined;
  }

  return runCommandGroup.parse(rest);
};

export const isRegisteredHelpCommandKind = (
  kind: CliCommand["kind"]
): kind is RegisteredHelpCommandKind =>
  kind === "runShowHelp";

export const formatRegisteredCommandHelp = (
  kind: RegisteredHelpCommandKind
): string => runCommandGroup.formatHelp(kind);
