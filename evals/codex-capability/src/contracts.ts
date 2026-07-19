export type CodexCapabilityEvalArmName = "baseline" | "krn";

export type CodexCapabilityUsageSource =
  | "codex_exec_json"
  | "rollout_budget"
  | "unavailable";

export type CodexCapabilityMcpServer = {
  readonly id: string;
  readonly transport: "stdio" | "streamable_http";
  readonly readOnly: boolean;
};

export type CodexCapabilitySkill = {
  readonly name: string;
  readonly path: string;
};

export type CodexCapabilityManifest = {
  readonly mcpServers: readonly CodexCapabilityMcpServer[];
  readonly skills: readonly CodexCapabilitySkill[];
};

export type CodexCapabilityProfileRef = {
  readonly name: string;
  readonly configPath: string;
};

export type CodexCapabilityProfileEvidence = CodexCapabilityProfileRef & {
  readonly hash: string;
  readonly hashAlgorithm: "sha256";
  readonly source: "checked_in_profile_config";
};

export type CodexCapabilityEvalArm = {
  readonly profile: CodexCapabilityProfileRef;
  readonly capabilities: CodexCapabilityManifest;
};

export type CodexCapabilityEvalGrader = {
  readonly id: string;
  readonly kind: "deterministic_command" | "model_grader" | "human_review";
  readonly command?: string;
  readonly args?: readonly string[];
  readonly rubric?: string;
  readonly proves: string;
  readonly doesNotProve: string;
};

export type CodexCapabilityEvalManifest = {
  readonly kind: "krn.codexCapabilityEvalManifest.v1";
  readonly id: string;
  readonly question: string;
  readonly target: {
    readonly repoPath: string;
    readonly commit: string;
    readonly taskId: string;
    readonly prompt: string;
    readonly timeoutMs: number;
  };
  readonly codex: {
    readonly command: string;
    readonly execBaseArgs: readonly string[];
    readonly model: string;
  };
  readonly arms: {
    readonly baseline: CodexCapabilityEvalArm;
    readonly krn: CodexCapabilityEvalArm;
  };
  readonly graders: readonly CodexCapabilityEvalGrader[];
  readonly usage: {
    readonly source: CodexCapabilityUsageSource;
    readonly requireComparable: boolean;
  };
};

export type CodexCapabilityEvalManifestParseResult =
  | {
      readonly ok: true;
      readonly manifest: CodexCapabilityEvalManifest;
    }
  | {
      readonly ok: false;
      readonly issues: readonly string[];
    };

class CodexCapabilityEvalManifestError extends Error {
  readonly issues: readonly string[];

  constructor(issues: readonly string[]) {
    super(`Invalid Codex capability eval manifest: ${issues.join("; ")}`);
    this.name = "CodexCapabilityEvalManifestError";
    this.issues = issues;
  }
}

export const parseCodexCapabilityEvalManifest = (
  value: unknown
): CodexCapabilityEvalManifest => {
  const result = validateCodexCapabilityEvalManifest(value);
  if (!result.ok) throw new CodexCapabilityEvalManifestError(result.issues);
  return result.manifest;
};

export const validateCodexCapabilityEvalManifest = (
  value: unknown
): CodexCapabilityEvalManifestParseResult => {
  if (!isRecord(value)) {
    return { ok: false, issues: ["manifest must be an object"] };
  }

  const issues = collectManifestIssues(value);
  return toParseResult(value, issues);
};

const collectManifestIssues = (value: Record<string, unknown>): readonly string[] => {
  const issues: string[] = [];
  if (value["kind"] !== "krn.codexCapabilityEvalManifest.v1") {
    issues.push("kind must be krn.codexCapabilityEvalManifest.v1");
  }
  for (const key of ["id", "question"] as const) {
    if (!isPresentString(value[key])) issues.push(`${key} must be a non-empty string`);
  }
  validateTarget(value["target"], issues);
  validateCodex(value["codex"], issues);
  validateArms(value["arms"], issues);
  validateGraders(value["graders"], issues);
  validateUsage(value["usage"], issues);
  return issues;
};

const toParseResult = (
  value: Record<string, unknown>,
  issues: readonly string[]
): CodexCapabilityEvalManifestParseResult => {
  if (issues.length > 0) return { ok: false, issues };
  return {
    ok: true,
    manifest: toManifest(value)
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isPresentString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isStringArray = (value: unknown): value is readonly string[] =>
  Array.isArray(value) && value.every(isPresentString);

const isConcreteGitCommit = (value: unknown): value is string =>
  typeof value === "string" && /^[0-9a-f]{7,40}$/iu.test(value);

const toManifest = (value: Record<string, unknown>): CodexCapabilityEvalManifest => ({
  kind: "krn.codexCapabilityEvalManifest.v1",
  id: readRequiredString(value["id"], "id"),
  question: readRequiredString(value["question"], "question"),
  target: toTarget(readRequiredRecord(value["target"], "target")),
  codex: toCodex(readRequiredRecord(value["codex"], "codex")),
  arms: toArms(readRequiredRecord(value["arms"], "arms")),
  graders: toGraders(value["graders"]),
  usage: toUsage(readRequiredRecord(value["usage"], "usage"))
});

const readRequiredRecord = (
  value: unknown,
  path: string
): Record<string, unknown> => {
  if (!isRecord(value)) throw new Error(`validated manifest missing ${path}`);
  return value;
};

const readRequiredString = (value: unknown, path: string): string => {
  if (!isPresentString(value)) throw new Error(`validated manifest missing ${path}`);
  return value;
};

const readRequiredStringArray = (value: unknown, path: string): readonly string[] => {
  if (!isStringArray(value)) throw new Error(`validated manifest missing ${path}`);
  return [...value];
};

const readRequiredPositiveInteger = (value: unknown, path: string): number => {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    throw new Error(`validated manifest missing ${path}`);
  }
  return value;
};

const readRequiredBoolean = (value: unknown, path: string): boolean => {
  if (typeof value !== "boolean") throw new Error(`validated manifest missing ${path}`);
  return value;
};

const toTarget = (
  value: Record<string, unknown>
): CodexCapabilityEvalManifest["target"] => ({
  repoPath: readRequiredString(value["repoPath"], "target.repoPath"),
  commit: readRequiredString(value["commit"], "target.commit"),
  taskId: readRequiredString(value["taskId"], "target.taskId"),
  prompt: readRequiredString(value["prompt"], "target.prompt"),
  timeoutMs: readRequiredPositiveInteger(value["timeoutMs"], "target.timeoutMs")
});

const toCodex = (
  value: Record<string, unknown>
): CodexCapabilityEvalManifest["codex"] => ({
  command: readRequiredString(value["command"], "codex.command"),
  execBaseArgs: readRequiredStringArray(value["execBaseArgs"], "codex.execBaseArgs"),
  model: readRequiredString(value["model"], "codex.model")
});

const toArms = (
  value: Record<string, unknown>
): CodexCapabilityEvalManifest["arms"] => ({
  baseline: toArm(readRequiredRecord(value["baseline"], "arms.baseline")),
  krn: toArm(readRequiredRecord(value["krn"], "arms.krn"))
});

const toArm = (
  value: Record<string, unknown>
): CodexCapabilityEvalArm => {
  const profile = readRequiredRecord(value["profile"], "arm.profile");
  return {
    profile: {
      name: readRequiredString(profile["name"], "arm.profile.name"),
      configPath: readRequiredString(profile["configPath"], "arm.profile.configPath")
    },
    capabilities: toCapabilities(readRequiredRecord(value["capabilities"], "arm.capabilities"))
  };
};

const toCapabilities = (
  value: Record<string, unknown>
): CodexCapabilityManifest => ({
  mcpServers: toMcpServers(value["mcpServers"]),
  skills: toSkills(value["skills"])
});

const toMcpServers = (value: unknown): readonly CodexCapabilityMcpServer[] => {
  if (!Array.isArray(value)) throw new Error("validated manifest missing mcpServers");
  return value.map((entry, index) => {
    const record = readRequiredRecord(entry, `mcpServers.${index}`);
    return {
      id: readRequiredString(record["id"], `mcpServers.${index}.id`),
      transport: readRequiredMcpTransport(record["transport"], `mcpServers.${index}.transport`),
      readOnly: readRequiredBoolean(record["readOnly"], `mcpServers.${index}.readOnly`)
    };
  });
};

const readRequiredMcpTransport = (
  value: unknown,
  path: string
): CodexCapabilityMcpServer["transport"] => {
  if (value === "stdio" || value === "streamable_http") return value;
  throw new Error(`validated manifest missing ${path}`);
};

const toSkills = (value: unknown): readonly CodexCapabilitySkill[] => {
  if (!Array.isArray(value)) throw new Error("validated manifest missing skills");
  return value.map((entry, index) => {
    const record = readRequiredRecord(entry, `skills.${index}`);
    return {
      name: readRequiredString(record["name"], `skills.${index}.name`),
      path: readRequiredString(record["path"], `skills.${index}.path`)
    };
  });
};

const toGraders = (value: unknown): readonly CodexCapabilityEvalGrader[] => {
  if (!Array.isArray(value)) throw new Error("validated manifest missing graders");
  return value.map(toGrader);
};

const toGrader = (entry: unknown, index: number): CodexCapabilityEvalGrader => {
  const record = readRequiredRecord(entry, `graders.${index}`);
  const command = optionalStringProperty(record, "command");
  const args = optionalStringArrayProperty(record, "args");
  const rubric = optionalStringProperty(record, "rubric");
  return {
    id: readRequiredString(record["id"], `graders.${index}.id`),
    kind: readRequiredGraderKind(record["kind"], `graders.${index}.kind`),
    ...(command === undefined ? {} : { command }),
    ...(args === undefined ? {} : { args }),
    ...(rubric === undefined ? {} : { rubric }),
    proves: readRequiredString(record["proves"], `graders.${index}.proves`),
    doesNotProve: readRequiredString(record["doesNotProve"], `graders.${index}.doesNotProve`)
  };
};

const optionalStringProperty = (
  record: Record<string, unknown>,
  key: string
): string | undefined =>
  isPresentString(record[key]) ? record[key] : undefined;

const optionalStringArrayProperty = (
  record: Record<string, unknown>,
  key: string
): readonly string[] | undefined =>
  isStringArray(record[key]) ? [...record[key]] : undefined;

const readRequiredGraderKind = (
  value: unknown,
  path: string
): CodexCapabilityEvalGrader["kind"] => {
  if (value === "deterministic_command" || value === "model_grader" || value === "human_review") {
    return value;
  }
  throw new Error(`validated manifest missing ${path}`);
};

const toUsage = (
  value: Record<string, unknown>
): CodexCapabilityEvalManifest["usage"] => ({
  source: readRequiredUsageSource(value["source"], "usage.source"),
  requireComparable: readRequiredBoolean(value["requireComparable"], "usage.requireComparable")
});

const readRequiredUsageSource = (
  value: unknown,
  path: string
): CodexCapabilityUsageSource => {
  if (value === "codex_exec_json" || value === "rollout_budget" || value === "unavailable") {
    return value;
  }
  throw new Error(`validated manifest missing ${path}`);
};

const validateTarget = (value: unknown, issues: string[]): void => {
  const record = requireRecordForValidation(value, "target", issues);
  if (record === undefined) return;
  pushRequiredStrings(record, "target", ["repoPath", "commit", "taskId", "prompt"], issues);
  if (isPresentString(record["commit"]) && !isConcreteGitCommit(record["commit"])) {
    pushIssue(issues, "target.commit must be a concrete 7-40 hex git commit, not HEAD or a symbolic ref");
  }
  pushPositiveInteger(record["timeoutMs"], "target.timeoutMs", issues);
};

const validateCodex = (value: unknown, issues: string[]): void => {
  const record = requireRecordForValidation(value, "codex", issues);
  if (record === undefined) return;

  pushRequiredStrings(record, "codex", ["command", "model"], issues);
  if (!isStringArray(record["execBaseArgs"])) {
    pushIssue(issues, "codex.execBaseArgs must be a non-empty string array");
    return;
  }

  validateExecBaseArgs(record["execBaseArgs"], issues);
};

const validateExecBaseArgs = (
  args: readonly string[],
  issues: string[]
): void => {
  pushRequiredArrayMember(args, "exec", "codex.execBaseArgs must include exec", issues);
  pushRequiredArrayMember(args, "--json", "codex.execBaseArgs must include --json so usage and events can be parsed", issues);
  for (const ownedArg of ["--profile", "--model"] as const) pushForbiddenExecArg(args, ownedArg, issues);
};

const validateArms = (value: unknown, issues: string[]): void => {
  const record = requireRecordForValidation(value, "arms", issues);
  if (record === undefined) return;

  validateArm(record["baseline"], "baseline", issues);
  validateArm(record["krn"], "krn", issues);
  validateProfileIsolation(record, issues);
  validateCapabilityIsolation(record, issues);
};

const validateProfileIsolation = (
  arms: Record<string, unknown>,
  issues: string[]
): void => {
  const baselineProfile = profileRecord(arms, "baseline");
  const krnProfile = profileRecord(arms, "krn");
  if (baselineProfile === undefined || krnProfile === undefined) return;

  for (const key of ["name", "configPath"] as const) {
    pushMatchingProfileValue(baselineProfile, krnProfile, key, issues);
  }
};

const validateCapabilityIsolation = (
  arms: Record<string, unknown>,
  issues: string[]
): void => {
  pushBaselineCapabilityViolation(readCapabilitiesFromArms(arms, "baseline"), issues);
  const krnCapabilities = readCapabilitiesFromArms(arms, "krn");
  pushKrnCapabilityViolation(krnCapabilities, issues);
  pushKrnMutableMcpViolations(krnCapabilities, issues);
};

const validateArm = (
  value: unknown,
  name: CodexCapabilityEvalArmName,
  issues: string[]
): void => {
  const record = requireRecordForValidation(value, `arms.${name}`, issues);
  if (record === undefined) return;

  validateArmProfile(record["profile"], name, issues);
  validateArmCapabilities(record["capabilities"], name, issues);
};

const validateArmProfile = (
  value: unknown,
  name: CodexCapabilityEvalArmName,
  issues: string[]
): void => {
  const record = requireRecordForValidation(value, `arms.${name}.profile`, issues);
  if (record === undefined) return;
  pushRequiredStrings(record, `arms.${name}.profile`, ["name", "configPath"], issues);
  pushRepoRelativeProfilePathIssue(record["configPath"], name, issues);
  pushDeclaredProfileHashIssue(record, name, issues);
};

const isRepoRelativePath = (value: string): boolean => {
  const trimmed = value.trim();
  const forbidden = [trimmed.length === 0, trimmed.startsWith("/"), trimmed.startsWith("~"), /^[A-Z]:[\\/]/iu.test(trimmed), trimmed.split(/[\\/]+/u).includes("..")];
  return forbidden.every((entry) => !entry);
};

const pushRepoRelativeProfilePathIssue = (value: unknown, name: CodexCapabilityEvalArmName, issues: string[]): void => {
  if (!isPresentString(value) || isRepoRelativePath(value)) return;
  pushIssue(issues, `arms.${name}.profile.configPath must be a repo-relative path without parent traversal`);
};

const pushDeclaredProfileHashIssue = (profile: Record<string, unknown>, name: CodexCapabilityEvalArmName, issues: string[]): void => {
  if (!("hash" in profile)) return;
  pushIssue(issues, `arms.${name}.profile.hash must not be declared in the manifest; the runner derives it from configPath`);
};

const validateArmCapabilities = (
  value: unknown,
  name: CodexCapabilityEvalArmName,
  issues: string[]
): void => {
  const record = requireRecordForValidation(value, `arms.${name}.capabilities`, issues);
  if (record === undefined) return;

  validateMcpServers(record["mcpServers"], `arms.${name}.capabilities.mcpServers`, issues);
  validateSkills(record["skills"], `arms.${name}.capabilities.skills`, issues);
};

const validateMcpServers = (
  value: unknown,
  path: string,
  issues: string[]
): void =>
  validateObjectArray(value, path, issues, validateMcpServer);

const validateMcpServer = (
  entry: Record<string, unknown>,
  path: string,
  issues: string[]
): void => {
  pushRequiredStrings(entry, path, ["id"], issues);
  pushAllowedValue(entry["transport"], `${path}.transport`, ["stdio", "streamable_http"], issues);
  pushBoolean(entry["readOnly"], `${path}.readOnly`, issues);
};

const validateSkills = (
  value: unknown,
  path: string,
  issues: string[]
): void =>
  validateObjectArray(value, path, issues, validateSkill);

const validateSkill = (
  entry: Record<string, unknown>,
  path: string,
  issues: string[]
): void =>
  pushRequiredStrings(entry, path, ["name", "path"], issues);

const validateObjectArray = (
  value: unknown,
  path: string,
  issues: string[],
  validateEntry: (entry: Record<string, unknown>, path: string, issues: string[]) => void
): void => {
  if (!Array.isArray(value)) {
    pushIssue(issues, `${path} must be an array`);
    return;
  }

  for (const [index, entry] of value.entries()) {
    validateObjectArrayEntry(entry, `${path}.${index}`, issues, validateEntry);
  }
};

const validateObjectArrayEntry = (
  entry: unknown,
  path: string,
  issues: string[],
  validateEntry: (entry: Record<string, unknown>, path: string, issues: string[]) => void
): void => {
  const record = requireRecordForValidation(entry, path, issues);
  if (record === undefined) return;
  validateEntry(record, path, issues);
};

const hasAnyCapability = (capabilities: Record<string, unknown>): boolean =>
  (Array.isArray(capabilities["mcpServers"]) && capabilities["mcpServers"].length > 0) ||
  (Array.isArray(capabilities["skills"]) && capabilities["skills"].length > 0);

const validateGraders = (value: unknown, issues: string[]): void => {
  if (!Array.isArray(value)) {
    pushIssue(issues, "graders must contain at least one grader");
    return;
  }

  if (value.length === 0) pushIssue(issues, "graders must contain at least one grader");
  for (const [index, grader] of value.entries()) validateGraderEntry(grader, index, issues);
  pushDuplicateGraderIds(value, issues);
};

const pushDuplicateGraderIds = (
  graders: readonly unknown[],
  issues: string[]
): void => {
  const ids = graders
    .filter(isRecord)
    .map((grader) => grader["id"])
    .filter(isPresentString);
  if (new Set(ids).size !== ids.length) pushIssue(issues, "grader ids must be unique");
};

const validateGraderEntry = (
  value: unknown,
  index: number,
  issues: string[]
): void => {
  const path = `graders.${index}`;
  const record = requireRecordForValidation(value, path, issues);
  if (record === undefined) return;

  pushRequiredStrings(record, path, ["id", "proves", "doesNotProve"], issues);
  pushAllowedValue(record["kind"], `${path}.kind`, ["deterministic_command", "model_grader", "human_review"], issues);
  validateGraderKindFields(record, path, issues);
};

const validateGraderKindFields = (
  grader: Record<string, unknown>,
  path: string,
  issues: string[]
): void => {
  validateDeterministicGraderFields(grader, path, issues);
  validateReviewGraderFields(grader, path, issues);
};

const validateDeterministicGraderFields = (
  grader: Record<string, unknown>,
  path: string,
  issues: string[]
): void => {
  if (grader["kind"] !== "deterministic_command") return;
  pushRequiredString(grader["command"], `${path}.command`, "must be set for deterministic_command", issues);
  pushOptionalStringArray(grader["args"], `${path}.args`, issues);
};

const validateReviewGraderFields = (
  grader: Record<string, unknown>,
  path: string,
  issues: string[]
): void => {
  if (grader["kind"] !== "model_grader" && grader["kind"] !== "human_review") return;
  pushRequiredString(grader["rubric"], `${path}.rubric`, `must be set for ${String(grader["kind"])}`, issues);
};

const validateUsage = (value: unknown, issues: string[]): void => {
  const record = requireRecordForValidation(value, "usage", issues);
  if (record === undefined) return;

  pushAllowedValue(record["source"], "usage.source", ["codex_exec_json", "rollout_budget", "unavailable"], issues);
  pushBoolean(record["requireComparable"], "usage.requireComparable", issues);
  pushComparableUsageRule(record, issues);
};

const requireRecordForValidation = (
  value: unknown,
  path: string,
  issues: string[]
): Record<string, unknown> | undefined => {
  if (isRecord(value)) return value;
  pushIssue(issues, `${path} must be an object`);
  return undefined;
};

const pushRequiredStrings = (
  record: Record<string, unknown>,
  path: string,
  keys: readonly string[],
  issues: string[]
): void => {
  for (const key of keys) pushRequiredString(record[key], `${path}.${key}`, "must be a non-empty string", issues);
};

const pushRequiredString = (
  value: unknown,
  path: string,
  suffix: string,
  issues: string[]
): void => {
  if (!isPresentString(value)) pushIssue(issues, `${path} ${suffix}`);
};

const pushPositiveInteger = (
  value: unknown,
  path: string,
  issues: string[]
): void => {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) return;
  pushIssue(issues, `${path} must be a positive integer`);
};

const pushBoolean = (
  value: unknown,
  path: string,
  issues: string[]
): void => {
  if (typeof value === "boolean") return;
  pushIssue(issues, `${path} must be boolean`);
};

const pushOptionalStringArray = (
  value: unknown,
  path: string,
  issues: string[]
): void => {
  if (value === undefined || isStringArray(value)) return;
  pushIssue(issues, `${path} must be a string array when set`);
};

const pushAllowedValue = (
  value: unknown,
  path: string,
  allowed: readonly string[],
  issues: string[]
): void => {
  if (typeof value === "string" && allowed.includes(value)) return;
  pushIssue(issues, `${path} must be ${allowed.join(", or ")}`);
};

const pushRequiredArrayMember = (
  values: readonly string[],
  required: string,
  message: string,
  issues: string[]
): void => {
  if (values.includes(required)) return;
  pushIssue(issues, message);
};

const pushForbiddenExecArg = (
  values: readonly string[],
  forbidden: "--profile" | "--model",
  issues: string[]
): void => {
  if (!values.includes(forbidden)) return;
  pushIssue(issues, `codex.execBaseArgs must not include ${forbidden}; the runner owns arm isolation`);
};

const profileRecord = (
  arms: Record<string, unknown>,
  armName: CodexCapabilityEvalArmName
): Record<string, unknown> | undefined => {
  const arm = isRecord(arms[armName]) ? arms[armName] : undefined;
  return arm !== undefined && isRecord(arm["profile"]) ? arm["profile"] : undefined;
};

const pushMatchingProfileValue = (
  baselineProfile: Record<string, unknown>,
  krnProfile: Record<string, unknown>,
  key: "name" | "configPath",
  issues: string[]
): void => {
  if (!isPresentString(baselineProfile[key]) || baselineProfile[key] !== krnProfile[key]) return;
  pushIssue(issues, `arms.baseline.profile.${key} must differ from arms.krn.profile.${key}`);
};

const readCapabilitiesFromArms = (
  arms: Record<string, unknown>,
  armName: CodexCapabilityEvalArmName
): Record<string, unknown> | undefined => {
  const arm = isRecord(arms[armName]) ? arms[armName] : undefined;
  return arm !== undefined && isRecord(arm["capabilities"]) ? arm["capabilities"] : undefined;
};

const pushBaselineCapabilityViolation = (
  capabilities: Record<string, unknown> | undefined,
  issues: string[]
): void => {
  if (capabilities === undefined || !hasAnyCapability(capabilities)) return;
  pushIssue(issues, "baseline arm must not expose KRN MCP servers or skills");
};

const pushKrnCapabilityViolation = (
  capabilities: Record<string, unknown> | undefined,
  issues: string[]
): void => {
  if (capabilities === undefined || hasAnyCapability(capabilities)) return;
  pushIssue(issues, "krn arm must expose at least one KRN MCP server or skill");
};

const pushKrnMutableMcpViolations = (
  capabilities: Record<string, unknown> | undefined,
  issues: string[]
): void => {
  if (capabilities === undefined || !Array.isArray(capabilities["mcpServers"])) return;
  for (const index of mutableMcpServerIndexes(capabilities["mcpServers"])) {
    pushIssue(
      issues,
      `arms.krn.capabilities.mcpServers.${index}.readOnly must be true for KRN context evals`
    );
  }
};

const mutableMcpServerIndexes = (servers: readonly unknown[]): readonly number[] =>
  servers.flatMap((server, index) =>
    isRecord(server) && server["readOnly"] === false ? [index] : []
  );

const pushComparableUsageRule = (
  usage: Record<string, unknown>,
  issues: string[]
): void => {
  if (usage["source"] !== "unavailable" || usage["requireComparable"] !== true) return;
  pushIssue(issues, "usage.requireComparable cannot be true when usage.source is unavailable");
};

const pushIssue = (issues: string[], issue: string): void => {
  issues.push(issue);
};
