import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { cp, mkdtemp, readFile, realpath, rename, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import type { EvalCandidateProposal } from "@krn/core";
import {
  createBoundedStreamCollector,
  startCommandDeadline
} from "../../bounded-command-execution.js";
import { runFrontendCourseCardsChecker } from "./frontend-course-cards-checker.js";
import { captureHeldOutTargetState } from "./held-out-target-state.js";

export type PairedRepairOutcome = "win" | "tie" | "loss" | "invalid";
export type PairedRepairUsefulnessOutcome = "helped" | "neutral" | "hurt" | "unknown";
/** Canonical held-out checker identity bound into every new tracked artifact. */
export const pairedLiveCheckerRevision = "paired-live-codex-repair-checker.v5" as const;
export type HeldOutObservation = {
  readonly threw: boolean;
  readonly accepted: boolean;
  readonly savedUserDelta: number;
  readonly resultState: string;
};

export type HeldOutRuntimeObservations = {
  readonly invalidJson: HeldOutObservation;
  readonly missingEmail: HeldOutObservation;
  readonly invalidRole: HeldOutObservation;
  readonly redactionSafe?: boolean;
  readonly enqueueAccepted?: boolean;
  readonly temporalPolicyCurrent?: boolean;
  readonly temporalPolicyThresholdCurrent?: boolean;
  readonly temporalPolicyBelowThresholdDefault?: boolean;
  readonly temporalPolicyNonEuDefault?: boolean;
  readonly validCreation?: boolean;
};

export type CommandResult = {
  readonly command: string;
  readonly args: readonly string[];
  readonly exitCode: number | null;
  readonly timedOut?: boolean;
  readonly stdout: string;
  readonly stderr: string;
  readonly stdoutStoredBytes?: Uint8Array;
  readonly stdoutTotalByteCount?: number;
  readonly stderrStoredBytes?: Uint8Array;
  readonly stderrTotalByteCount?: number;
  readonly startedAt?: string;
  readonly completedAt?: string;
  readonly durationMs?: number;
};

export type TargetChangeManifest = {
  readonly status: "known" | "unknown";
  readonly headMatchesInitialCommit?: boolean;
  readonly trackedFiles: readonly string[];
  readonly untrackedFiles: readonly string[];
  readonly changedFiles: readonly string[];
  readonly forbiddenFiles: readonly string[];
  readonly statusOutput: string;
};

export type HeldOutCheck = {
  readonly name:
  | "family_contract"
  | "preflight"
  | "invalid_json"
  | "missing_email"
  | "invalid_role"
  | "unknown_first"
  | "finite_result_state"
  | "focused_test_control"
  | "focused_tests"
  | "forbidden_files"
  | "target_test"
  | "target_typecheck"
  | "target_diff_check"
  | "held_out_runtime";
  readonly passed: boolean;
  readonly details: string;
};

export const pairedEvalFamilies = [
  "env-config",
  "async-job",
  "weak-json",
  "user-create",
  "temporal-policy-drift",
  "temporal-policy-hidden-source",
  "frontend-course-cards"
] as const;

export type PairedEvalFamily = typeof pairedEvalFamilies[number];

export type HeldOutFamilyContract = {
  readonly family: PairedEvalFamily;
  readonly sourcePaths: readonly string[];
  readonly allowedPrefixes: readonly string[];
  readonly requiredChecks: readonly string[];
};

export const resolvePairedEvalFamily = (scenario: string): PairedEvalFamily => {
  const normalized = scenario.toLowerCase();
  if (normalized.includes("frontend-course-cards")) return "frontend-course-cards";
  if (normalized.includes("env-config")) return "env-config";
  if (normalized.includes("async-job")) return "async-job";
  if (
    normalized.includes("temporal-policy-hidden") ||
    (normalized.includes("temporal-policy") && normalized.includes("hidden-source"))
  ) {
    return "temporal-policy-hidden-source";
  }
  if (normalized.includes("temporal-policy")) return "temporal-policy-drift";
  if (normalized.includes("user-create")) return "user-create";
  return "weak-json";
};

export const pairedEvalFamilyContract = (family: PairedEvalFamily): HeldOutFamilyContract => {
  switch (family) {
    case "env-config":
      return {
        family,
        sourcePaths: ["src/config.ts", "src/configReadback.ts", "tests/config.test.ts"],
        allowedPrefixes: ["src/", "tests/", "docs/"],
        requiredChecks: ["target_test", "target_typecheck", "target_diff_check"]
      };
    case "async-job":
      return {
        family,
        sourcePaths: ["src/jobQueue.ts", "tests/jobQueue.test.ts"],
        allowedPrefixes: ["src/", "tests/", "docs/"],
        requiredChecks: ["target_test", "target_typecheck", "target_diff_check"]
      };
    case "temporal-policy-drift":
    case "temporal-policy-hidden-source":
      return {
        family,
        sourcePaths: ["src/payoutPolicy.ts", "tests/payoutPolicy.test.ts", "docs/payout-policy-contract.md"],
        allowedPrefixes: ["src/", "tests/", "docs/"],
        requiredChecks: ["held_out_runtime", "target_test", "target_typecheck", "target_diff_check"]
      };
    case "weak-json":
      return {
        family,
        sourcePaths: ["src/config.ts", "src/userService.ts", "tests/userService.test.ts"],
        allowedPrefixes: ["src/", "tests/", "docs/"],
        requiredChecks: ["held_out_runtime", "target_test", "target_typecheck", "target_diff_check"]
      };
    case "user-create":
      return {
        family,
        sourcePaths: ["src/config.ts", "src/userService.ts", "tests/userService.test.ts"],
        allowedPrefixes: ["src/", "tests/", "docs/"],
        requiredChecks: ["held_out_runtime", "target_test", "target_typecheck", "target_diff_check"]
      };
    case "frontend-course-cards":
      return {
        family,
        sourcePaths: [
          "index.html",
          "css/blocks/course-card.css",
          "css/compositions/grid.css",
          "css/compositions/flow.css",
          "css/compositions/wrapper.css",
          "css/utilities/region.css",
          "css/global.css"
        ],
        allowedPrefixes: ["index.html", "css/blocks/course-card.css", "css/global.css"],
        requiredChecks: ["held_out_runtime", "target_test", "target_diff_check"]
      };
  }
};

export type HeldOutArmScore = {
  readonly status: "pass" | "fail" | "invalid";
  readonly score: number;
  readonly checks: readonly HeldOutCheck[];
  readonly changedFiles: readonly string[];
  readonly changeManifest?: TargetChangeManifest;
  readonly commands?: {
    readonly test: CommandResult;
    readonly typecheck: CommandResult;
    readonly diffCheck: CommandResult;
  };
  readonly runtimeCommand?: CommandResult;
  readonly runtimeFailureReason?: HeldOutRuntimeFailureReason;
  readonly focusedTestControl?: CommandResult;
  readonly focusedTestMutations?: readonly FocusedTestMutationProof[];
};

export type HeldOutRuntimeFailureReason =
  | "runtime_permissions_unsupported"
  | "runtime_command_failed"
  | "runtime_export_unavailable"
  | "runtime_observer_failed"
  | "runtime_envelope_malformed";

export type FocusedTestMutationName = "invalid_json" | "missing_email" | "invalid_role";

export type FocusedTestMutationProof = {
  readonly name: FocusedTestMutationName;
  readonly command: CommandResult;
};

export type PairedRepairScore = {
  readonly outcome: PairedRepairOutcome;
  readonly baseline: HeldOutArmScore;
  readonly krn: HeldOutArmScore;
  readonly reason: string;
};

export const pairedRepairUsefulnessOutcome = (
  outcome: PairedRepairOutcome
): PairedRepairUsefulnessOutcome => {
  switch (outcome) {
    case "win":
      return "helped";
    case "tie":
      return "neutral";
    case "loss":
      return "hurt";
    case "invalid":
      return "unknown";
  }
};

export const pairedRepairEvalCandidate = (input: {
  readonly score: PairedRepairScore;
  readonly runId: string;
  readonly packetChecksum: string;
  readonly evidenceRefs: readonly string[];
  readonly createdAt: string;
  readonly scenario?: string;
  readonly projectId?: string;
  readonly liveOutput?: {
    readonly decisionId: string | readonly string[];
    readonly rejectedPath: string;
    readonly staleBoundary: string;
    readonly nonProof: string;
    readonly action: string;
  };
  readonly liveOutputValidation?: {
    readonly valid: boolean;
    readonly reasons: readonly string[];
  };
}): EvalCandidateProposal => ({
  id: `paired-target-repair:${input.runId}`,
  ...(input.projectId === undefined ? {} : { projectId: input.projectId }),
  status: "candidate",
  title: `Paired target repair outcome: ${input.score.outcome}`,
  scenario: input.scenario ?? "weak-json-boundary-typescript current-shell Codex repair",
  expectedSignal: "Only a predeclared KRN win may be classified as helped.",
  sourceEvidence: [...input.evidenceRefs],
  metadata: {
    evaluationKind: "paired_live_codex_repair",
    outcome: input.score.outcome,
    usefulnessOutcome: pairedRepairUsefulnessOutcome(input.score.outcome),
    baselineScore: input.score.baseline.score,
    krnScore: input.score.krn.score,
    baselineStatus: input.score.baseline.status,
    krnStatus: input.score.krn.status,
    packetChecksum: input.packetChecksum,
    packetEvidenceRef: `packet:${input.packetChecksum}`,
    evidenceRefs: [...input.evidenceRefs],
    ...(input.liveOutput === undefined ? {} : { liveOutput: input.liveOutput }),
    ...(input.liveOutputValidation === undefined ? {} : { liveOutputValidation: input.liveOutputValidation }),
    doesNotProve: [
      "A single paired trial does not prove arbitrary-repository portability.",
      "A tie, loss, or invalid trial does not prove memory usefulness.",
      "The candidate is reviewable evidence and does not mutate MemoryRecord or SourceClaim truth."
    ]
  },
  createdAt: input.createdAt
});

export type PairedRepairPrompts = {
  readonly baseline: string;
  readonly krn: string;
  readonly delta: {
    readonly generated: true;
    readonly baselineHash: string;
    readonly krnHash: string;
    readonly deltaHash: string;
    readonly deltaBytes: number;
    readonly packetOnlyByConstruction: true;
  };
};

/** Machine-visible prefix for the live obedience envelope. */
export const liveCodexObedienceMarker = "KRN_OBEDIENCE_JSON:" as const;

type TargetSourceFiles = Readonly<Record<string, string | undefined>>;

export type TargetRepairScoreInput = {
  readonly family?: PairedEvalFamily;
  readonly sourceFiles: TargetSourceFiles;
  readonly changedFiles: readonly string[];
  readonly changeManifest?: TargetChangeManifest;
  readonly commands: {
    readonly test: CommandResult;
    readonly typecheck: CommandResult;
    readonly diffCheck: CommandResult;
  };
  readonly runtimeCommand?: CommandResult;
  readonly runtimeFailureReason?: HeldOutRuntimeFailureReason;
  readonly focusedTestControl?: CommandResult;
  readonly focusedTestMutations?: readonly FocusedTestMutationProof[];
  readonly runtimeAvailable: boolean;
  readonly observations: HeldOutRuntimeObservations;
};

export type HeldOutCheckerInput = {
  readonly targetRoot: string;
  readonly checkerRoot: string;
  readonly initialCommit: string;
  readonly family?: PairedEvalFamily;
};

type FamilyPromptGuidance = readonly [string, string, string];

const familyPromptGuidance = (family: PairedEvalFamily): FamilyPromptGuidance => {
  switch (family) {
    case "async-job":
      return [
        "Repair the externally observable async job enqueue and lease boundary in this controlled TypeScript target.",
        "Use the task and target job contract to make the smallest surgical repair. Meet every observable acceptance requirement without assuming an implementation shape. Preserve the existing package shape; do not add frameworks, schedulers, daemons, dashboards, queue services, or unrelated cleanup.",
        "Preserve existing focused tests and add coverage only when it strengthens the job boundary contract: unknown input narrowing, non-empty idempotency key, finite retry budget, explicit lease timeout, finite job states, and injected-clock lease behavior."
      ];
    case "env-config":
      return [
        "Repair the externally observable environment configuration boundary in this controlled TypeScript target.",
        "Use the task and target config contract to make the smallest surgical repair. Meet every observable acceptance requirement without assuming an implementation shape. Preserve the existing package shape; do not add frameworks, network calls, secret stores, or unrelated cleanup.",
        "Preserve existing focused tests and add coverage only when it strengthens the config boundary contract: supported runtime modes, explicit invalid-config behavior, and secret-safe readback."
      ];
    case "user-create":
      return [
        "Repair the externally observable user-creation boundary in this controlled TypeScript target.",
        "Use the task and target contract to make the smallest surgical repair. Meet every observable acceptance requirement without assuming an implementation shape. Preserve the existing package shape; do not add frameworks or unrelated cleanup.",
        "Preserve existing focused tests and their distinct invalid-input vectors; do not weaken, replace, or collapse a missing-property, malformed-JSON, or unsupported-role assertion. Add coverage only when it strengthens the existing contract."
      ];
    case "temporal-policy-drift":
      return [
        "Repair the externally observable temporal payout-policy boundary in this controlled TypeScript target.",
        "Use the target docs plus any supplied current org/source authority to make the smallest surgical repair. Local target docs may be stale when a bounded current authority is supplied. Preserve the existing package shape; do not add workflow engines, dashboards, schedulers, external services, or unrelated cleanup.",
        "Preserve existing focused tests and add coverage only when it strengthens the payout-policy boundary: EU high-risk policy-review action, valid-from readback, stale legacy action absence, and rejected shortcut absence. Do not invent current policy text when no current authority is supplied."
      ];
    case "temporal-policy-hidden-source":
      return [
        "Repair the externally observable target-hidden temporal payout-policy boundary in this controlled TypeScript target.",
        "Treat local target docs as potentially stale. Use a current org/source authority only when it is supplied through bounded KRN context; without that authority, report that the current policy cannot be inferred instead of inventing a new action or effective date. Preserve the existing package shape; do not add workflow engines, dashboards, schedulers, external services, or unrelated cleanup.",
        "Preserve existing focused tests and add coverage only when it strengthens the payout-policy boundary: current authority application, stale legacy action rejection, threshold behavior, default fallback behavior, and rejected shortcut absence. Do not leak or guess the hidden current policy from the prompt."
      ];
    case "weak-json":
      return [
        "Repair the externally observable weak JSON/user-creation boundary in this controlled TypeScript target.",
        "Use the task and target contract to make the smallest surgical repair. Meet every observable acceptance requirement without assuming an implementation shape. Preserve the existing package shape; do not add frameworks or unrelated cleanup.",
        "Preserve existing focused tests and their distinct invalid-input vectors; do not weaken, replace, or collapse a missing-property, malformed-JSON, or unsupported-role assertion. Add coverage only when it strengthens the existing contract."
      ];
    case "frontend-course-cards":
      return [
        "Build the supplied course collection into a resilient reusable frontend card section.",
        "Preserve all supplied content, links, source order, and semantics. Keep the visual language consistent with the starter tokens, support variable content and card counts across narrow and wide viewports, and minimize duplication and special cases. Do not copy an external implementation or hardcode checker-specific content.",
        "Keep the change inside the preregistered HTML, course-card stylesheet, and global CSS entry. The held-out checker will exercise the dependency-free public build and varied content and viewport conditions. Do not add tests, dependencies, or framework configuration."
      ];
  }
};

const basePrompt = (
  task: string,
  family: PairedEvalFamily = "weak-json"
): string => {
  const familyGuidance = familyPromptGuidance(family);
  const verificationGuidance = family === "frontend-course-cards"
    ? "Run the target CSS build and HTML validation command before finishing. Do not stage, commit, or push."
    : "Run the target test command and TypeScript typecheck before finishing. Do not stage, commit, or push.";
  return [
    familyGuidance[0],
    "Read AGENTS.md and the contract documentation present in the target first. Do not assume a filename that is not present. Work only in the allowed target files and do not touch the parent repository, other repos, generated caches, secrets, or network.",
    familyGuidance[1],
    familyGuidance[2],
    "If the runtime offers a read-only context tool, inspect it before editing; do not assume its presence or invent one, and never treat tool availability as authority by itself.",
    verificationGuidance,
    "At the end, report changed files, commands and outcomes, what the checks prove, and what they do not prove. Do not claim product readiness.",
    `Task: ${task}`
  ].join("\n");
};

const obedienceEnvelopeInstruction = [
  `After the repair report, emit one final machine line beginning with ${liveCodexObedienceMarker} followed immediately by a JSON object and no markdown wrapper.`,
  "The object must have exactly these non-empty fields: decisionId (one governing decision id or an array of them), rejectedPath (the packet rejected path or an explicit no-rejected-path statement), staleBoundary (a string that names every id in the union of packet.staleDecisionIds and packet.staleKnowledgeIds, or an explicit no-stale statement), nonProof, and action (the bounded next action).",
  "The nonProof field must preserve the compact packet proof boundary: start from a sentence or phrase in packet.doesNotProve or packet.nonProofs, and use packet.evidenceGaps, packet.sourceConsensus.doesNotProve, packet.abstentionScore.doesNotProve, or an explicit unknown-boundary statement only to clarify that same boundary without inventing authority.",
  "Do not take nonProof only from the outer readback proof, do not use a generic live-obedience phrase as the entire value, and do not claim product readiness.",
  "Do not emit an array for staleBoundary and do not invent ids or claims outside the packet."
].join(" ");

const krnCapabilityObedienceContract = (contextToolRunId: string | undefined): readonly string[] =>
  contextToolRunId === undefined
    ? []
    : [
      "Use the configured $krn-memory-core skill for the KRN Memory Core boundary before deciding or editing; if the skill cannot be loaded, report that failure normally.",
      `KRN arm configured capability: call the krn_decision_packet MCP tool directly with runId ${contextToolRunId} before target inspection or editing. Do not first infer availability from MCP resource or resource-template catalogs; those catalogs are not substitutes for the configured tool call.`,
      "KRN arm measurement contract: if the krn_decision_packet tool returns a DecisionPacket, use only that returned packet for the final bounded obedience line. This line is measurement evidence, not new authority.",
      "If the direct tool call errors or the tool is unavailable, do not invent packet ids or substitute target docs; report the failure normally. The tracked runner will keep the trial invalid until a configured MCP tool-call event and bounded packet-derived obedience line are present.",
      obedienceEnvelopeInstruction
    ];

const sha256 = (value: string): string =>
  createHash("sha256").update(value).digest("hex");

export const buildPairedRepairPrompts = (input: {
  readonly task: string;
  readonly decisionPacket: unknown;
  readonly includeDecisionPacket?: boolean;
  readonly contextToolRunId?: string;
  readonly family?: PairedEvalFamily;
}): PairedRepairPrompts => {
  const baseline = basePrompt(input.task, input.family ?? "weak-json");
  const includeDecisionPacket = input.includeDecisionPacket ?? true;
  const krn = includeDecisionPacket
    ? [
      baseline,
      "",
      "The KRN arm receives this read-only DecisionPacket through the krn_decision_packet MCP transport. Treat it as bounded context only; obey its abstention/evidence-gap and non-proof fields. Do not infer authority from packet receipt.",
      "BEGIN KRN DECISION PACKET",
      JSON.stringify(input.decisionPacket),
      "END KRN DECISION PACKET",
      "Treat packet.rejectedPathIds as the complete rejected-path authority. If that array is empty, emit an explicit no-rejected-path statement even when context exclusions or source rejection records contain rejected material; do not promote those records into a rejected path. Treat the union of packet.staleDecisionIds and packet.staleKnowledgeIds as the complete stale boundary; if both arrays are empty, emit an explicit no-stale statement.",
      obedienceEnvelopeInstruction
    ].join("\n")
    : [
      baseline,
      ...krnCapabilityObedienceContract(input.contextToolRunId)
    ].join("\n");

  return {
    baseline,
    krn,
    delta: {
      generated: true,
      baselineHash: sha256(baseline),
      krnHash: sha256(krn),
      deltaHash: sha256(krn.slice(baseline.length)),
      deltaBytes: Buffer.byteLength(krn) - Buffer.byteLength(baseline),
      packetOnlyByConstruction: true
    }
  };
};

const passed = (result: CommandResult): boolean => result.exitCode === 0;

const observationPassed = (observation: HeldOutObservation): boolean =>
  !observation.threw &&
  !observation.accepted &&
  observation.savedUserDelta === 0 &&
  observation.resultState !== "null" &&
  observation.resultState !== "undefined";

const runtimeObservationPassed = (
  family: PairedEvalFamily,
  observations: HeldOutRuntimeObservations
): boolean => {
  switch (family) {
    case "env-config":
      return observations.redactionSafe === true;
    case "async-job":
      return observations.enqueueAccepted === true;
    case "temporal-policy-drift":
    case "temporal-policy-hidden-source":
      return observations.temporalPolicyCurrent === true &&
        observations.temporalPolicyThresholdCurrent === true &&
        observations.temporalPolicyBelowThresholdDefault === true &&
        observations.temporalPolicyNonEuDefault === true;
    case "weak-json":
      return observationPassed(observations.invalidJson) &&
        observationPassed(observations.missingEmail) &&
        observationPassed(observations.invalidRole);
    case "user-create":
      return observations.validCreation === true &&
        observationPassed(observations.invalidJson) &&
        observationPassed(observations.missingEmail) &&
        observationPassed(observations.invalidRole);
    case "frontend-course-cards":
      return false;
  }
};

const source = (files: TargetSourceFiles, path: string): string => files[path] ?? "";

const envConfigSourceContractPassed = (input: {
  readonly config: string;
  readonly readback: string;
  readonly tests: string;
}): boolean =>
  /mode\s*!==\s*["']development["'][\s\S]*mode\s*!==\s*["']staging["'][\s\S]*mode\s*!==\s*["']production["']/.test(input.config) &&
  /secretKeyPattern\.test\(key\)[\s\S]*\[redacted\]/.test(input.readback) &&
  /invalid_config/.test(input.tests);

const asyncJobSourceContractPassed = (job: string): boolean =>
  /idempotencyKey/.test(job) &&
  /retryBudget/.test(job) &&
  /leaseTimeoutMs/.test(job) &&
  /dead_lettered/.test(job) &&
  (/(?:interface|type)\s+\w*Clock\b/.test(job) || /nowMs\s*:\s*\(\)\s*=>/.test(job) || /now\s*\(\)\s*:\s*number/.test(job));

const temporalPolicyDriftSourceContractPassed = (payoutPolicy: string): boolean =>
  /hold_for_policy_review/.test(payoutPolicy) &&
  /2026-06-01/.test(payoutPolicy) &&
  !/legacy_hold/.test(payoutPolicy) &&
  !/auto_approve/.test(payoutPolicy);

const userCreateSourceContractPassed = (service: string): boolean =>
  /(?:status|state|kind)\s*[:?]/.test(service) &&
  !/CreatedUser\s*\|\s*null/.test(service) &&
  /admin/.test(service) &&
  /member/.test(service);

const familySourceContractPassed = (
  family: PairedEvalFamily,
  files: TargetSourceFiles
): boolean => {
  const tests = Object.values(files).filter((value): value is string => value !== undefined).join("\n");
  switch (family) {
    case "env-config":
      return envConfigSourceContractPassed({
        config: source(files, "src/config.ts"),
        readback: source(files, "src/configReadback.ts"),
        tests
      });
    case "async-job":
      return asyncJobSourceContractPassed(source(files, "src/jobQueue.ts"));
    case "temporal-policy-drift":
    case "temporal-policy-hidden-source":
      return temporalPolicyDriftSourceContractPassed(source(files, "src/payoutPolicy.ts"));
    case "user-create":
      return userCreateSourceContractPassed(source(files, "src/userService.ts"));
    case "weak-json":
      return false;
    case "frontend-course-cards":
      return false;
  }
};

const checkFamilyContract = (
  family: PairedEvalFamily,
  files: TargetSourceFiles,
  commands: TargetRepairScoreInput["commands"],
  runtimeAvailable: boolean,
  runtimeFailureReason: HeldOutRuntimeFailureReason | undefined,
  observations: HeldOutRuntimeObservations
): HeldOutCheck => {
  const passedContract = familySourceContractPassed(family, files);
  const passedCommands = commands.test.exitCode === 0 && commands.typecheck.exitCode === 0 && commands.diffCheck.exitCode === 0;
  const passed = passedContract && passedCommands && runtimeAvailable && runtimeObservationPassed(family, observations);
  return {
    name: "family_contract",
    passed,
    details: passed
      ? `${family} family contract and public verification commands passed.`
      : `${family} family contract, runtime observer, or public verification commands failed${runtimeFailureReason === undefined ? "" : ` (${runtimeFailureReason})`}.`
  };
};

const checkUnknownFirst = (files: TargetSourceFiles): HeldOutCheck => {
  const config = source(files, "src/config.ts");
  const hasUnknownBoundary =
    /parseJsonConfig\s*\([^)]*\)\s*:\s*unknown/.test(config) ||
    /value\s*:\s*unknown/.test(config);
  const hasAnyBoundary = /parseJsonConfig\s*\([^)]*\)\s*:\s*any/.test(config);

  return {
    name: "unknown_first",
    passed: hasUnknownBoundary && !hasAnyBoundary,
    details: hasUnknownBoundary && !hasAnyBoundary
      ? "JSON boundary is unknown-first."
      : "External JSON output is not proven unknown-first."
  };
};

const checkFiniteResult = (files: TargetSourceFiles): HeldOutCheck => {
  const service = source(files, "src/userService.ts");
  const hasNamedResult = /(?:export\s+)?type\s+CreateUserResult\b/.test(service);
  const hasNullableReturn = /CreatedUser\s*\|\s*null/.test(service);
  const hasDiscriminator = /\b(?:ok|kind|status)\s*[:?]/.test(service);
  const isPassed = hasNamedResult && hasDiscriminator && !hasNullableReturn;

  return {
    name: "finite_result_state",
    passed: isPassed,
    details: isPassed
      ? "Create-user output has a named finite result state."
      : "Create-user output still relies on an unproven nullable or implicit state."
  };
};

const checkRejectedObservation = (
  name: Extract<HeldOutCheck["name"], "invalid_json" | "missing_email" | "invalid_role">,
  observation: HeldOutObservation,
  passedDetails: string,
  failedDetails: string
): HeldOutCheck => {
  const isPassed = observationPassed(observation);
  return {
    name,
    passed: isPassed,
    details: isPassed ? passedDetails : failedDetails
  };
};

const checkFocusedTests = (
  changedFiles: readonly string[],
  control: CommandResult | undefined,
  mutations: readonly FocusedTestMutationProof[] | undefined
): HeldOutCheck => {
  const requiredMutations: readonly FocusedTestMutationName[] = [
    "invalid_json",
    "missing_email",
    "invalid_role"
  ];
  const passedMutations = new Set(
    (mutations ?? [])
      .filter((mutation) => mutation.command.exitCode === 0)
      .map((mutation) => mutation.name)
  );
  const missingMutations = requiredMutations.filter((name) => !passedMutations.has(name));
  const changedFocusedTest = changedFiles.includes("tests/userService.test.ts");
  const controlPassed = control?.exitCode === 0;
  const isPassed = changedFocusedTest && controlPassed && missingMutations.length === 0;

  return {
    name: "focused_tests",
    passed: isPassed,
    details: isPassed
      ? "Focused tests killed malformed-JSON, missing-email, and unsupported-role mutants."
      : changedFocusedTest
        ? controlPassed
          ? `Focused tests did not kill mutants: ${missingMutations.join(", ")}.`
          : "The unmutated focused-test control failed in the held-out runtime."
        : "The focused public-seam test file was not changed."
  };
};

const checkFocusedTestControl = (control: CommandResult | undefined): HeldOutCheck => ({
  name: "focused_test_control",
  passed: control?.exitCode === 0,
  details: control?.exitCode === 0
    ? "The unmutated focused-test control passed in the held-out runtime."
    : "The unmutated focused-test control was unavailable or failed."
});

const checkAllowedFiles = (changedFiles: readonly string[]): HeldOutCheck => {
  const forbidden = changedFiles.filter((path) =>
    !path.startsWith("src/") &&
    !path.startsWith("tests/") &&
    !path.startsWith("docs/")
  );

  return {
    name: "forbidden_files",
    passed: forbidden.length === 0,
    details: forbidden.length === 0
      ? "All changed files are inside the target write boundary."
      : `Forbidden changed files: ${forbidden.join(", ")}`
  };
};

const knownChangeManifest = (changedFiles: readonly string[]): TargetChangeManifest => {
  const uniqueFiles = [...new Set(changedFiles)];
  const forbiddenFiles = uniqueFiles.filter((path) =>
    !path.startsWith("src/") &&
    !path.startsWith("tests/") &&
    !path.startsWith("docs/")
  );

  return {
    status: "known",
    headMatchesInitialCommit: true,
    trackedFiles: uniqueFiles,
    untrackedFiles: [],
    changedFiles: uniqueFiles,
    forbiddenFiles,
    statusOutput: ""
  };
};

const targetStatusHasStagedChanges = (statusOutput: string): boolean =>
  statusOutput.split("\n").some((line) =>
    line.length >= 2 && line[0] !== " " && line[0] !== "?" && line[0] !== "!"
  );

export const targetChangeManifestClaimsOwnedChanges = (
  manifest: TargetChangeManifest | undefined
): manifest is TargetChangeManifest & { status: "known" } =>
  manifest?.status === "known" &&
  manifest.headMatchesInitialCommit === true &&
  manifest.untrackedFiles.length === 0 &&
  manifest.forbiddenFiles.length === 0 &&
  !targetStatusHasStagedChanges(manifest.statusOutput);

const checkPreflight = (manifest: TargetChangeManifest): HeldOutCheck => {
  const isPassed = targetChangeManifestClaimsOwnedChanges(manifest);

  return {
    name: "preflight",
    passed: isPassed,
    details: isPassed
      ? "Target change manifest was captured before target execution."
      : manifest.status === "unknown"
        ? "Target change manifest could not be captured before target execution."
        : manifest.headMatchesInitialCommit === false
          ? "Target HEAD changed from the initial commit, so worktree-only verification cannot prove the committed patch."
        : manifest.untrackedFiles.length > 0
          ? `Target contains untracked files that git diff --check cannot inspect: ${manifest.untrackedFiles.join(", ")}`
        : targetStatusHasStagedChanges(manifest.statusOutput)
          ? "Target index contains staged changes, so git diff --check cannot prove the full patch."
        : `Forbidden target changes were detected before execution: ${manifest.forbiddenFiles.join(", ")}`
  };
};

const checkTargetCommands = (
  commands: TargetRepairScoreInput["commands"]
): readonly HeldOutCheck[] => [
  {
    name: "target_test",
    passed: passed(commands.test),
    details: passed(commands.test) ? "Target test command passed." : "Target test command failed."
  },
  {
    name: "target_typecheck",
    passed: passed(commands.typecheck),
    details: passed(commands.typecheck) ? "Target typecheck passed." : "Target typecheck failed."
  },
  {
    name: "target_diff_check",
    passed: passed(commands.diffCheck),
    details: passed(commands.diffCheck) ? "Target diff check passed." : "Target diff check failed."
  }
];

const weakJsonRequiredForValidity = new Set<HeldOutCheck["name"]>([
  "preflight",
  "forbidden_files",
  "target_test",
  "target_typecheck",
  "target_diff_check",
  "held_out_runtime",
  "focused_test_control"
]);

const weakJsonBehaviorChecks = new Set<HeldOutCheck["name"]>([
  "invalid_json",
  "missing_email",
  "invalid_role"
]);

const weakJsonRepairContractChecks = new Set<HeldOutCheck["name"]>([
  ...weakJsonBehaviorChecks,
  "unknown_first",
  "finite_result_state",
  "focused_tests"
]);

const scoreFamilyTargetRepair = (
  input: TargetRepairScoreInput,
  family: Exclude<PairedEvalFamily, "weak-json">,
  changeManifest: TargetChangeManifest
): HeldOutArmScore => {
  const checks: HeldOutCheck[] = [
    checkPreflight(changeManifest),
    checkFamilyContract(family, input.sourceFiles, input.commands, input.runtimeAvailable, input.runtimeFailureReason, input.observations),
    checkAllowedFiles(input.changedFiles),
    ...checkTargetCommands(input.commands),
    {
      name: "held_out_runtime",
      passed: input.runtimeAvailable,
      details: !input.runtimeAvailable
        ? "Family-specific held-out runtime observer was unavailable or malformed."
        : runtimeObservationPassed(family, input.observations)
          ? "Family-specific held-out runtime observer passed."
          : "Family-specific held-out runtime observer completed and measured a contract failure."
    }
  ];
  const invalid = checks.some((check) =>
    ["preflight", "forbidden_files", "target_test", "target_typecheck", "target_diff_check", "held_out_runtime"].includes(check.name) && !check.passed
  );
  const contract = checks.find((check) => check.name === "family_contract");
  return {
    status: invalid ? "invalid" : contract?.passed === true ? "pass" : "fail",
    score: checks.filter((check) => check.passed).length,
    checks,
    changedFiles: [...input.changedFiles],
    changeManifest,
    commands: input.commands,
    ...(input.runtimeCommand === undefined ? {} : { runtimeCommand: input.runtimeCommand }),
    ...(input.runtimeFailureReason === undefined ? {} : { runtimeFailureReason: input.runtimeFailureReason })
  };
};

const scoreWeakJsonTargetRepair = (
  input: TargetRepairScoreInput,
  changeManifest: TargetChangeManifest
): HeldOutArmScore => {
  const checks: HeldOutCheck[] = [
    checkPreflight(changeManifest),
    checkRejectedObservation(
      "invalid_json",
      input.observations.invalidJson,
      "Malformed JSON is rejected without saving a user.",
      "Malformed JSON was thrown, accepted, or produced a non-finite result."
    ),
    checkRejectedObservation(
      "missing_email",
      input.observations.missingEmail,
      "Missing email is rejected without saving a user.",
      "Missing email was accepted, thrown, or produced a non-finite result."
    ),
    checkRejectedObservation(
      "invalid_role",
      input.observations.invalidRole,
      "Invalid role is rejected without saving a user.",
      "Invalid role was accepted, thrown, or produced a non-finite result."
    ),
    checkUnknownFirst(input.sourceFiles),
    checkFiniteResult(input.sourceFiles),
    checkFocusedTestControl(input.focusedTestControl),
    checkFocusedTests(
      input.changedFiles,
      input.focusedTestControl,
      input.focusedTestMutations
    ),
    checkAllowedFiles(input.changedFiles),
    ...checkTargetCommands(input.commands),
    {
      name: "held_out_runtime",
      passed: input.runtimeAvailable,
      details: input.runtimeAvailable
        ? "Held-out checker compiled and exercised the target outside its root."
        : "Held-out checker could not compile and exercise the target."
    }
  ];
  const invalid = checks.some((check) =>
    weakJsonRequiredForValidity.has(check.name) && !check.passed
  );
  const satisfiesRepairContract = checks.every((check) =>
    !weakJsonRepairContractChecks.has(check.name) || check.passed
  );
  const score = checks.filter((check) =>
    weakJsonBehaviorChecks.has(check.name) && check.passed
  ).length;

  return {
    status: invalid
      ? "invalid"
      : satisfiesRepairContract ? "pass" : "fail",
    score,
    checks,
    changedFiles: [...input.changedFiles],
    changeManifest,
    commands: input.commands,
    ...(input.runtimeCommand === undefined ? {} : { runtimeCommand: input.runtimeCommand }),
    ...(input.runtimeFailureReason === undefined ? {} : { runtimeFailureReason: input.runtimeFailureReason }),
    ...(input.focusedTestControl === undefined
      ? {}
      : { focusedTestControl: input.focusedTestControl }),
    ...(input.focusedTestMutations === undefined
      ? {}
      : { focusedTestMutations: input.focusedTestMutations })
  };
};

export const scoreTargetRepair = (
  input: TargetRepairScoreInput
): HeldOutArmScore => {
  const changeManifest = input.changeManifest ?? knownChangeManifest(input.changedFiles);
  const family = input.family ?? "weak-json";
  return family === "weak-json"
    ? scoreWeakJsonTargetRepair(input, changeManifest)
    : scoreFamilyTargetRepair(input, family, changeManifest);
};

export const scorePairedRepairs = (input: {
  readonly baseline: HeldOutArmScore;
  readonly krn: HeldOutArmScore;
}): PairedRepairScore => {
  if (input.baseline.status === "invalid" || input.krn.status === "invalid") {
    return {
      outcome: "invalid",
      baseline: input.baseline,
      krn: input.krn,
      reason: "At least one arm failed the checker validity boundary."
    };
  }

  if (input.baseline.status === "fail" && input.krn.status === "pass") {
    return {
      outcome: "win",
      baseline: input.baseline,
      krn: input.krn,
      reason: "KRN satisfied the repair contract while the equal-contract baseline did not."
    };
  }

  if (input.baseline.status === "pass" && input.krn.status === "fail") {
    return {
      outcome: "loss",
      baseline: input.baseline,
      krn: input.krn,
      reason: "KRN failed the repair contract while the equal-contract baseline satisfied it."
    };
  }

  if (input.baseline.status === "fail" && input.krn.status === "fail") {
    return {
      outcome: "invalid",
      baseline: input.baseline,
      krn: input.krn,
      reason: "Neither arm satisfied the repair contract."
    };
  }

  if (input.krn.score > input.baseline.score) {
    return {
      outcome: "win",
      baseline: input.baseline,
      krn: input.krn,
      reason: "KRN passed more held-out checks than the equal-contract baseline."
    };
  }

  if (input.krn.score < input.baseline.score) {
    return {
      outcome: "loss",
      baseline: input.baseline,
      krn: input.krn,
      reason: "KRN passed fewer held-out checks than the equal-contract baseline."
    };
  }

  return {
    outcome: "tie",
    baseline: input.baseline,
    krn: input.krn,
    reason: "Both arms passed the same number of held-out checks."
  };
};

export type RunCommandOptions = {
  readonly env?: NodeJS.ProcessEnv;
  readonly timeoutMs?: number;
  readonly input?: string;
};

export const runCommand = (
  command: string,
  args: readonly string[],
  cwd: string,
  options: RunCommandOptions = {}
): Promise<CommandResult> => new Promise((resolve) => {
  const startedAtMilliseconds = Date.now();
  const startedAt = new Date(startedAtMilliseconds).toISOString();
  const child = spawn(command, args, {
    cwd,
    env: options.env,
    stdio: ["pipe", "pipe", "pipe"]
  });
  const stdoutCapture = createBoundedStreamCollector();
  const stderrCapture = createBoundedStreamCollector();
  let stdout = "";
  let stderr = "";
  let settled = false;
  let timedOut = false;
  const clearCommandDeadline = startCommandDeadline(
    child,
    options.timeoutMs,
    () => {
      timedOut = true;
    }
  );

  const finish = (exitCode: number | null): void => {
    if (settled) return;
    settled = true;
    clearCommandDeadline();
    const stdoutSnapshot = stdoutCapture.snapshot();
    const stderrSnapshot = stderrCapture.snapshot();
    const commandResult: CommandResult = {
      command,
      args: [...args],
      exitCode: timedOut ? null : exitCode,
      timedOut,
      stdout,
      stderr: timedOut ? `${stderr}command timed out` : stderr,
      stdoutTotalByteCount: stdoutSnapshot.totalByteCount,
      stderrTotalByteCount: stderrSnapshot.totalByteCount,
      startedAt,
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAtMilliseconds
    };

    Object.defineProperties(commandResult, {
      stdoutStoredBytes: {
        value: stdoutSnapshot.bytes,
        enumerable: false
      },
      stderrStoredBytes: {
        value: stderrSnapshot.bytes,
        enumerable: false
      }
    });

    resolve(commandResult);
  };

  if (options.input === undefined) child.stdin.end();
  else child.stdin.end(options.input);

  child.stdout.on("data", (chunk: Buffer) => {
    stdoutCapture.append(chunk);
    stdout += chunk.toString();
  });
  child.stderr.on("data", (chunk: Buffer) => {
    stderrCapture.append(chunk);
    stderr += chunk.toString();
  });
  child.on("error", (error: Error) => {
    stderr = `${stderr}${error.message}`;
    finish(null);
  });
  child.on("close", finish);
});

const targetEnvironment = (sandboxRoot: string): NodeJS.ProcessEnv => ({
  PATH: process.env.PATH,
  CI: process.env.CI ?? "1",
  NODE_ENV: "test",
  HOME: sandboxRoot,
  TMPDIR: sandboxRoot,
  TMP: sandboxRoot,
  TEMP: sandboxRoot
});

const targetCommandTimeoutMs = 120_000;

const targetPreflight = async (input: HeldOutCheckerInput): Promise<TargetChangeManifest> => {
  return captureHeldOutTargetState(
    input,
    runCommand,
    (path) => path.startsWith("src/") || path.startsWith("tests/") || path.startsWith("docs/")
  );
};

const readTargetSourceFiles = async (
  targetRoot: string,
  family: PairedEvalFamily = "weak-json"
): Promise<TargetSourceFiles> => Object.fromEntries(
  await Promise.all([
    ...pairedEvalFamilyContract(family).sourcePaths
  ].map(async (path) => {
    try {
      return [path, await readFile(join(targetRoot, path), "utf8")] as const;
    } catch {
      return [path, undefined] as const;
    }
  }))
);

const unknownObservation = (): HeldOutObservation => ({
  threw: true,
  accepted: false,
  savedUserDelta: 0,
  resultState: "unavailable"
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const runtimeWorkerMarker = "KRN_HELD_OUT_RUNTIME:";

const isHeldOutRuntimeFailureReason = (value: unknown): value is HeldOutRuntimeFailureReason =>
  value === "runtime_permissions_unsupported" ||
  value === "runtime_command_failed" ||
  value === "runtime_export_unavailable" ||
  value === "runtime_observer_failed" ||
  value === "runtime_envelope_malformed";

export type HeldOutRuntimePermissionFlag = "--permission" | "--experimental-permission";

export const selectHeldOutRuntimePermissionFlag = (
  flags: ReadonlySet<string> = process.allowedNodeEnvironmentFlags
): HeldOutRuntimePermissionFlag | undefined => {
  if (flags.has("--permission")) return "--permission";
  if (flags.has("--experimental-permission")) return "--experimental-permission";
  return undefined;
};

const runtimeWorkerSource = `
import { writeSync } from "node:fs";

const marker = "KRN_HELD_OUT_RUNTIME:";
const isRecord = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
const observeInput = (createUser, listUsers, raw, idClock) => {
  const before = listUsers();
  const beforeCount = Array.isArray(before) ? before.length : 0;
  try {
    const result = idClock === undefined
      ? createUser(raw, {})
      : createUser(raw, {}, idClock);
    const after = listUsers();
    const afterCount = Array.isArray(after) ? after.length : beforeCount;
    const resultRecord = isRecord(result) ? result : undefined;
    const accepted = resultRecord?.ok === true || resultRecord?.kind === "created" || resultRecord?.status === "created" || resultRecord?.state === "created";
    const resultState = resultRecord === undefined
      ? String(result)
      : typeof resultRecord.ok === "boolean"
        ? "ok:" + String(resultRecord.ok)
        : typeof resultRecord.kind === "string"
          ? "kind:" + resultRecord.kind
          : typeof resultRecord.status === "string"
            ? "status:" + resultRecord.status
            : typeof resultRecord.state === "string"
              ? "state:" + resultRecord.state
              : "object";
    return { threw: false, accepted, savedUserDelta: afterCount - beforeCount, resultState };
  } catch {
    return { threw: true, accepted: false, savedUserDelta: 0, resultState: "thrown" };
  }
};
try {
  const family = process.argv[2];
  const moduleValue = await import(process.argv[3]);
  const service = isRecord(moduleValue) ? moduleValue : {};
  if (family === "env-config") {
    let redactionSafe = false;
    try {
      if (typeof service.redactConfigReadback === "function") {
        const env = Object.defineProperty({}, "CLIENT_SECRET", { enumerable: true, get() { throw new Error("secret value read"); } });
        const output = service.redactConfigReadback(env);
        redactionSafe = isRecord(output) && output.CLIENT_SECRET === "[redacted]";
      }
    } catch {
      // A target throwing while reading the guarded secret is an observed contract failure,
      // not an unavailable held-out observer.
    }
    writeSync(1, marker + JSON.stringify({ runtimeAvailable: true, observations: { redactionSafe } }) + "\\n");
  } else if (family === "async-job") {
    let enqueueAccepted = false;
    try {
      if (typeof service.enqueueJob === "function") {
        const input = { id: "held-out", idempotencyKey: "  tenant:1  ", retryBudget: 1, leaseTimeoutMs: 1000 };
        const clock = { now: () => 123, nowMs: () => 123 };
        const output = service.enqueueJob(input, clock);
        const processed = typeof service.leaseJob === "function"
          ? service.leaseJob(output, clock)
          : output;
        const key = isRecord(output) && typeof output.idempotencyKey === "string"
          ? output.idempotencyKey
          : undefined;
        const processedNumericValues = isRecord(processed)
          ? Object.values(processed).filter((value) => typeof value === "number")
          : [];
        // The contract is about a clock-derived lease value, not one property
        // spelling. Accept legacy names and equivalent Ms-suffixed readback.
        const clockObserved = typeof service.leaseJob !== "function" || (
          processedNumericValues.includes(123) || processedNumericValues.includes(1123)
        );
        enqueueAccepted = key !== undefined && key.trim().length > 0 && clockObserved;
      }
    } catch {
      // A target rejection is an observed contract failure, not an unavailable observer.
    }
    writeSync(1, marker + JSON.stringify({ runtimeAvailable: true, observations: { enqueueAccepted } }) + "\\n");
  } else if (family === "temporal-policy-drift" || family === "temporal-policy-hidden-source") {
    let temporalPolicyCurrent = false;
    let temporalPolicyThresholdCurrent = false;
    let temporalPolicyBelowThresholdDefault = false;
    let temporalPolicyNonEuDefault = false;
    try {
      if (typeof service.decidePayoutPolicy === "function") {
        const actionIs = (output, expectedAction) => {
          const record = isRecord(output) ? output : undefined;
          const action = [record?.action, record?.status, record?.kind, record?.state]
            .find((value) => value === expectedAction);
          return action === expectedAction;
        };
        const decisionMatches = (output, expectedAction, expectedValidFrom) => {
          const record = isRecord(output) ? output : undefined;
          const validFrom = [record?.validFrom, record?.effectiveFrom]
            .find((value) => value === expectedValidFrom);
          return actionIs(output, expectedAction) && validFrom === expectedValidFrom;
        };
        temporalPolicyCurrent = decisionMatches(service.decidePayoutPolicy({
          region: "EU",
          riskScore: 95,
          requestedAt: "2026-06-15"
        }), "hold_for_policy_review", "2026-06-01");
        temporalPolicyThresholdCurrent = decisionMatches(service.decidePayoutPolicy({
          region: "EU",
          riskScore: 80,
          requestedAt: "2026-06-15"
        }), "hold_for_policy_review", "2026-06-01");
        temporalPolicyBelowThresholdDefault = actionIs(service.decidePayoutPolicy({
          region: "EU",
          riskScore: 79,
          requestedAt: "2026-06-15"
        }), "manual_review");
        temporalPolicyNonEuDefault = actionIs(service.decidePayoutPolicy({
          region: "US",
          riskScore: 95,
          requestedAt: "2026-06-15"
        }), "manual_review");
      }
    } catch {
      // A target rejection is an observed contract failure, not an unavailable observer.
    }
    writeSync(1, marker + JSON.stringify({
      runtimeAvailable: true,
      observations: {
        temporalPolicyCurrent,
        temporalPolicyThresholdCurrent,
        temporalPolicyBelowThresholdDefault,
        temporalPolicyNonEuDefault
      }
    }) + "\\n");
  } else {
  const createUser = service.createUserFromJson;
  const listUsers = service.listSavedUsers;
  if (typeof createUser !== "function" || typeof listUsers !== "function") {
    throw new Error("held-out target exports are unavailable");
  }
  const idClock = family === "user-create" ? () => 123 : undefined;
  const observations = {
    invalidJson: observeInput(createUser, listUsers, "{", idClock),
    missingEmail: observeInput(createUser, listUsers, JSON.stringify({ role: "admin" }), idClock),
    invalidRole: observeInput(createUser, listUsers, JSON.stringify({ email: "held-out@example.com", role: "owner" }), idClock)
  };
  let validCreation = false;
  if (family === "user-create") {
    try {
      const explicit = createUser(JSON.stringify({ email: "held-out@example.com", role: "member" }), { DEFAULT_ROLE: "admin" }, idClock);
      const configured = createUser(JSON.stringify({ email: "held-out-default@example.com" }), { DEFAULT_ROLE: "admin" }, idClock);
      const explicitRecord = isRecord(explicit) ? explicit : undefined;
      const configuredRecord = isRecord(configured) ? configured : undefined;
      const explicitUser = explicitRecord && isRecord(explicitRecord.user) ? explicitRecord.user : explicitRecord;
      const configuredUser = configuredRecord && isRecord(configuredRecord.user) ? configuredRecord.user : configuredRecord;
      validCreation = (explicitRecord?.ok === true || explicitRecord?.kind === "created" || explicitRecord?.status === "created" || explicitRecord?.state === "created") &&
        (configuredRecord?.ok === true || configuredRecord?.kind === "created" || configuredRecord?.status === "created" || configuredRecord?.state === "created") &&
        explicitUser?.role === "member" && configuredUser?.role === "admin";
    } catch {
      validCreation = false;
    }
  }
  writeSync(1, marker + JSON.stringify({ runtimeAvailable: true, observations: { ...observations, validCreation } }) + "\\n");
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  const reason = message.includes("export unavailable")
    ? "runtime_export_unavailable"
    : "runtime_observer_failed";
  writeSync(1, marker + JSON.stringify({ runtimeAvailable: false, reason }) + "\\n");
  process.exitCode = 1;
}
`;

const unknownRuntimeObservations = (): HeldOutRuntimeObservations => ({
  invalidJson: unknownObservation(),
  missingEmail: unknownObservation(),
  invalidRole: unknownObservation(),
  redactionSafe: false,
  enqueueAccepted: false,
  temporalPolicyCurrent: false,
  temporalPolicyThresholdCurrent: false,
  temporalPolicyBelowThresholdDefault: false,
  temporalPolicyNonEuDefault: false
});

const runtimeModulePathFor = (family: PairedEvalFamily): string => {
  switch (family) {
    case "env-config":
      return "src/configReadback.js";
    case "async-job":
      return "src/jobQueue.js";
    case "temporal-policy-drift":
    case "temporal-policy-hidden-source":
      return "src/payoutPolicy.js";
    case "weak-json":
    case "user-create":
      return "src/userService.js";
    case "frontend-course-cards":
      throw new Error("frontend-course-cards uses its dedicated browser observer");
  }
};

const parseFamilyRuntimeObservations = (
  family: PairedEvalFamily,
  observations: Record<string, unknown>
): HeldOutRuntimeObservations => {
  switch (family) {
    case "env-config":
      return {
        ...unknownRuntimeObservations(),
        redactionSafe: observations["redactionSafe"] === true
      };
    case "async-job":
      return {
        ...unknownRuntimeObservations(),
        enqueueAccepted: observations["enqueueAccepted"] === true
      };
    case "temporal-policy-drift":
    case "temporal-policy-hidden-source":
      return {
        ...unknownRuntimeObservations(),
        temporalPolicyCurrent: observations["temporalPolicyCurrent"] === true,
        temporalPolicyThresholdCurrent: observations["temporalPolicyThresholdCurrent"] === true,
        temporalPolicyBelowThresholdDefault: observations["temporalPolicyBelowThresholdDefault"] === true,
        temporalPolicyNonEuDefault: observations["temporalPolicyNonEuDefault"] === true
      };
    case "weak-json":
    case "user-create":
      return {
        invalidJson: observations["invalidJson"] as HeldOutObservation,
        missingEmail: observations["missingEmail"] as HeldOutObservation,
        invalidRole: observations["invalidRole"] as HeldOutObservation,
        redactionSafe: false,
        enqueueAccepted: false,
        temporalPolicyCurrent: false,
        temporalPolicyThresholdCurrent: false,
        temporalPolicyBelowThresholdDefault: false,
        temporalPolicyNonEuDefault: false,
        ...(family === "user-create"
          ? { validCreation: observations["validCreation"] === true }
          : {})
      };
    case "frontend-course-cards":
      throw new Error("frontend-course-cards observations are scored by its dedicated checker");
  }
};

type HeldOutRuntimeWorkerResult = {
  readonly command: CommandResult;
  readonly runtimeAvailable: boolean;
  readonly failureReason?: HeldOutRuntimeFailureReason;
  readonly observations: HeldOutRuntimeObservations;
};

const unsupportedRuntimePermissionResult = (): HeldOutRuntimeWorkerResult => {
  const now = new Date().toISOString();
  return {
    command: {
      command: process.execPath,
      args: [],
      exitCode: null,
      stdout: "",
      stderr: "held-out runtime unavailable: Node filesystem permissions are unsupported",
      startedAt: now,
      completedAt: now,
      durationMs: 0
    },
    runtimeAvailable: false,
    failureReason: "runtime_permissions_unsupported",
    observations: unknownRuntimeObservations()
  };
};

const unavailableRuntimeWorkerResult = (
  command: CommandResult,
  failureReason: HeldOutRuntimeFailureReason
): HeldOutRuntimeWorkerResult => ({
  command,
  runtimeAvailable: false,
  failureReason,
  observations: unknownRuntimeObservations()
});

const latestRuntimeWorkerMarkerPayload = (
  stdout: string
): string | undefined => stdout
  .split("\n")
  .reverse()
  .find((line) => line.startsWith(runtimeWorkerMarker))
  ?.slice(runtimeWorkerMarker.length);

const hasUserRuntimeObservationShape = (
  family: PairedEvalFamily,
  observations: Record<string, unknown>
): boolean =>
  (family !== "weak-json" && family !== "user-create") || (
    isRecord(observations["invalidJson"]) &&
    isRecord(observations["missingEmail"]) &&
    isRecord(observations["invalidRole"])
  );

const runtimeEnvelopeFailureReason = (
  parsed: unknown
): HeldOutRuntimeFailureReason =>
  isRecord(parsed) && isHeldOutRuntimeFailureReason(parsed["reason"])
    ? parsed["reason"]
    : "runtime_envelope_malformed";

const parseRuntimeWorkerResult = (
  command: CommandResult,
  family: PairedEvalFamily
): HeldOutRuntimeWorkerResult => {
  const markerPayload = latestRuntimeWorkerMarkerPayload(command.stdout);
  if (markerPayload === undefined) {
    return unavailableRuntimeWorkerResult(command, "runtime_command_failed");
  }

  try {
    const parsed: unknown = JSON.parse(markerPayload);
    if (!isRecord(parsed) || parsed["runtimeAvailable"] !== true || !isRecord(parsed["observations"])) {
      return unavailableRuntimeWorkerResult(command, runtimeEnvelopeFailureReason(parsed));
    }
    if (command.exitCode !== 0) {
      return unavailableRuntimeWorkerResult(command, "runtime_command_failed");
    }
    const observations = parsed["observations"];
    if (!hasUserRuntimeObservationShape(family, observations)) {
      throw new Error("Malformed held-out observations");
    }

    return {
      command,
      runtimeAvailable: true,
      observations: parseFamilyRuntimeObservations(family, observations)
    };
  } catch {
    return unavailableRuntimeWorkerResult(command, "runtime_envelope_malformed");
  }
};

export const runHeldOutRuntimeWorker = async (
  compileRoot: string,
  checkerRoot: string,
  sandboxRoot: string,
  family: PairedEvalFamily
): Promise<HeldOutRuntimeWorkerResult> => {
  const permissionFlag = selectHeldOutRuntimePermissionFlag();
  if (permissionFlag === undefined) {
    return unsupportedRuntimePermissionResult();
  }
  const workerPath = join(sandboxRoot, "held-out-runtime-worker.mjs");
  await writeFile(workerPath, runtimeWorkerSource, { encoding: "utf8", flag: "wx", mode: 0o600 });
  const [canonicalCompileRoot, canonicalWorkerPath] = await Promise.all([
    realpath(compileRoot),
    realpath(workerPath)
  ]);
  const modulePath = runtimeModulePathFor(family);
  const targetModuleUrl = `${pathToFileURL(join(canonicalCompileRoot, modulePath)).href}?checker=${Date.now()}`;
  const command = await runCommand(
    process.execPath,
    [
      permissionFlag,
      `--allow-fs-read=${canonicalCompileRoot}`,
      `--allow-fs-read=${canonicalWorkerPath}`,
      canonicalWorkerPath,
      family,
      targetModuleUrl
    ],
    checkerRoot,
    {
      env: targetEnvironment(sandboxRoot),
      timeoutMs: targetCommandTimeoutMs
    }
  );
  return parseRuntimeWorkerResult(command, family);
};

const focusedTestMutationNames: readonly FocusedTestMutationName[] = [
  "invalid_json",
  "missing_email",
  "invalid_role"
];

const focusedTestMutationMarker = (name: FocusedTestMutationName): string =>
  `KRN_FOCUSED_TEST_MUTATION:${name}`;

const parseJsonUnknown = (raw: string): unknown => {
  const parsed: unknown = JSON.parse(raw);
  return parsed;
};

const focusedTestMutationModule = (name: FocusedTestMutationName): string => `
import { writeSync } from "node:fs";
import * as original from "./index.original.js";
export * from "./index.original.js";

const mutationName = ${JSON.stringify(name)};
const marker = ${JSON.stringify(focusedTestMutationMarker(name))};
const isRecord = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
const parseJson = ${parseJsonUnknown.toString()};
const parsedRecord = (raw) => {
  try {
    const parsed = parseJson(raw);
    return isRecord(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
};
const isMalformedJson = (raw) => {
  try {
    parseJson(raw);
    return false;
  } catch {
    return true;
  }
};
const mutatedRaw = (raw) => {
  if (mutationName === "invalid_json") {
    return isMalformedJson(raw)
      ? JSON.stringify({ email: "krn-mutant@example.com", role: "admin" })
      : undefined;
  }
  const parsed = parsedRecord(raw);
  if (parsed === undefined) return undefined;
  if (mutationName === "missing_email") {
    return "email" in parsed
      ? undefined
      : JSON.stringify({ ...parsed, email: "krn-mutant@example.com" });
  }
  return "role" in parsed && parsed.role !== "admin" && parsed.role !== "member"
    ? JSON.stringify({ ...parsed, role: "admin" })
    : undefined;
};

export const createUserFromJson = (...args) => {
  const [raw] = args;
  const replacement = mutatedRaw(raw);
  if (replacement === undefined) return original.createUserFromJson(...args);
  writeSync(1, marker + "\\n");
  return original.createUserFromJson(replacement, ...args.slice(1));
};
`;

const skippedFocusedTestMutations = (reason: string): readonly FocusedTestMutationProof[] =>
  focusedTestMutationNames.map((name) => ({
    name,
    command: {
      command: "held-out focused-test mutation",
      args: [name],
      exitCode: null,
      stdout: "",
      stderr: `skipped: ${reason}`,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      durationMs: 0
    }
  }));

const skippedFocusedTestControl = (reason: string): CommandResult => ({
  command: "held-out focused-test control",
  args: [],
  exitCode: null,
  stdout: "",
  stderr: `skipped: ${reason}`,
  startedAt: new Date().toISOString(),
  completedAt: new Date().toISOString(),
  durationMs: 0
});

const mutationProofCommand = (
  name: FocusedTestMutationName,
  result: CommandResult,
  controlPassed: boolean
): CommandResult => {
  const markerObserved = result.stdout.split("\n").includes(focusedTestMutationMarker(name));
  const mutationKilled = controlPassed &&
    markerObserved &&
    result.exitCode !== null &&
    result.exitCode !== 0;
  return {
    command: "held-out focused-test mutation",
    args: [name],
    exitCode: mutationKilled ? 0 : 1,
    stdout: [
      `mutationMarkerObserved=${String(markerObserved)}`,
      `unmutatedControlPassed=${String(controlPassed)}`,
      `mutatedTestExitCode=${String(result.exitCode)}`,
      result.stdout
    ].join("\n"),
    stderr: result.stderr,
    ...(result.startedAt === undefined ? {} : { startedAt: result.startedAt }),
    ...(result.completedAt === undefined ? {} : { completedAt: result.completedAt }),
    ...(result.durationMs === undefined ? {} : { durationMs: result.durationMs })
  };
};

const failedMutationSetup = (name: FocusedTestMutationName, error: unknown): CommandResult => {
  const observedAt = new Date().toISOString();
  return {
    command: "held-out focused-test mutation setup",
    args: [name],
    exitCode: 1,
    stdout: "",
    stderr: error instanceof Error ? error.message : String(error),
    startedAt: observedAt,
    completedAt: observedAt,
    durationMs: 0
  };
};

const runPermissionedFocusedTest = async (
  root: string,
  checkerRoot: string,
  sandboxRoot: string,
  permissionFlag: HeldOutRuntimePermissionFlag
): Promise<CommandResult> => {
  const canonicalRoot = await realpath(root);
  return runCommand(
    process.execPath,
    [
      permissionFlag,
      `--allow-fs-read=${canonicalRoot}`,
      join(canonicalRoot, "tests/userService.test.js")
    ],
    checkerRoot,
    {
      env: targetEnvironment(sandboxRoot),
      timeoutMs: targetCommandTimeoutMs
    }
  );
};

export const runFocusedTestMutationSuite = async (
  compileRoot: string,
  checkerRoot: string,
  sandboxRoot: string
): Promise<{
  readonly control: CommandResult;
  readonly mutations: readonly FocusedTestMutationProof[];
}> => {
  const permissionFlag = selectHeldOutRuntimePermissionFlag();
  if (permissionFlag === undefined) {
    return {
      control: skippedFocusedTestControl("Node filesystem permissions are unsupported"),
      mutations: skippedFocusedTestMutations("Node filesystem permissions are unsupported")
    };
  }

  const control = await runPermissionedFocusedTest(
    compileRoot,
    checkerRoot,
    sandboxRoot,
    permissionFlag
  );
  const mutations = await Promise.all(focusedTestMutationNames.map(async (name) => {
    let result: CommandResult;
    try {
      const mutationRoot = join(sandboxRoot, `focused-test-${name}`);
      await cp(compileRoot, mutationRoot, { recursive: true });
      const indexPath = join(mutationRoot, "src/index.js");
      await rename(indexPath, join(mutationRoot, "src/index.original.js"));
      await writeFile(indexPath, focusedTestMutationModule(name), {
        encoding: "utf8",
        flag: "wx",
        mode: 0o600
      });
      result = await runPermissionedFocusedTest(
        mutationRoot,
        checkerRoot,
        sandboxRoot,
        permissionFlag
      );
    } catch (error) {
      result = failedMutationSetup(name, error);
    }
    return { name, command: mutationProofCommand(name, result, control.exitCode === 0) };
  }));
  return { control, mutations };
};

export const runHeldOutTargetRepairChecker = async (
  input: HeldOutCheckerInput
): Promise<HeldOutArmScore> => {
  const family = input.family ?? "weak-json";
  if (family === "frontend-course-cards") {
    return runFrontendCourseCardsChecker(input, runCommand);
  }
  const preflight = await targetPreflight(input);
  const sourceFiles = await readTargetSourceFiles(input.targetRoot, family);
  const skipped = (command: string): CommandResult => ({
    command,
    args: [],
    exitCode: null,
    stdout: "",
    stderr: "skipped because target preflight was invalid",
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    durationMs: 0
  });

  if (!targetChangeManifestClaimsOwnedChanges(preflight)) {
    return scoreTargetRepair({
      family,
      sourceFiles,
      changedFiles: preflight.changedFiles,
      changeManifest: preflight,
      commands: {
        test: skipped("pnpm test"),
        typecheck: skipped("pnpm typecheck"),
        diffCheck: skipped("git diff --check")
      },
      runtimeAvailable: false,
      ...(family === "weak-json"
        ? {
            focusedTestControl: skippedFocusedTestControl("target preflight was invalid"),
            focusedTestMutations: skippedFocusedTestMutations("target preflight was invalid")
          }
        : {}),
      observations: unknownRuntimeObservations()
    });
  }

  const sandboxRoot = await mkdtemp(join(tmpdir(), "krn-paired-sandbox-"));
  const environment = targetEnvironment(sandboxRoot);
  const [test, typecheck, diffCheck] = await Promise.all([
    runCommand("pnpm", ["test"], input.targetRoot, {
      env: environment,
      timeoutMs: targetCommandTimeoutMs
    }),
    runCommand("pnpm", ["typecheck"], input.targetRoot, {
      env: environment,
      timeoutMs: targetCommandTimeoutMs
    }),
    runCommand("git", ["diff", "--check"], input.targetRoot, {
      env: environment,
      timeoutMs: targetCommandTimeoutMs
    })
  ]);
  const compileRoot = await mkdtemp(join(tmpdir(), "krn-paired-repair-"));
  try {
  const compile = await runCommand(
    "pnpm",
    [
      "exec",
      "tsc",
      "-p",
      join(input.targetRoot, "tsconfig.json"),
      "--outDir",
      compileRoot,
      "--noEmit",
      "false"
    ],
    input.checkerRoot,
    {
      env: environment,
      timeoutMs: targetCommandTimeoutMs
    }
  );
  let runtimeAvailable = false;
  let runtimeFailureReason: HeldOutRuntimeFailureReason | undefined;
  let observations = unknownRuntimeObservations();
  let runtimeCommand = skipped("held-out runtime");
  let focusedTestControl: CommandResult | undefined = family === "weak-json"
    ? skippedFocusedTestControl("target compilation failed")
    : undefined;
  let focusedTestMutations: readonly FocusedTestMutationProof[] | undefined = family === "weak-json"
    ? skippedFocusedTestMutations("target compilation failed")
    : undefined;

  if (compile.exitCode === 0) {
    const [runtime, mutationSuite] = family === "weak-json"
      ? await Promise.all([
          runHeldOutRuntimeWorker(compileRoot, input.checkerRoot, sandboxRoot, family),
          runFocusedTestMutationSuite(compileRoot, input.checkerRoot, sandboxRoot)
        ])
      : [
          await runHeldOutRuntimeWorker(compileRoot, input.checkerRoot, sandboxRoot, family),
          undefined
        ] as const;
    runtimeAvailable = runtime.runtimeAvailable;
    runtimeFailureReason = runtime.failureReason;
    runtimeCommand = runtime.command;
    observations = runtime.observations;
    if (mutationSuite !== undefined) {
      focusedTestControl = mutationSuite.control;
      focusedTestMutations = mutationSuite.mutations;
    }
  }

  const postflight = await targetPreflight(input);
  const finalManifest: TargetChangeManifest = {
    ...postflight,
    changedFiles: [...new Set([...preflight.changedFiles, ...postflight.changedFiles])],
    forbiddenFiles: [...new Set([...preflight.forbiddenFiles, ...postflight.forbiddenFiles])]
  };

  return scoreTargetRepair({
    family,
    sourceFiles,
    changedFiles: finalManifest.changedFiles,
    changeManifest: finalManifest,
    commands: { test, typecheck, diffCheck },
    runtimeCommand,
    ...(runtimeFailureReason === undefined ? {} : { runtimeFailureReason }),
    ...(focusedTestControl === undefined ? {} : { focusedTestControl }),
    ...(focusedTestMutations === undefined ? {} : { focusedTestMutations }),
    runtimeAvailable,
    observations
  });
  } finally {
    await rm(compileRoot, { recursive: true, force: true });
    await rm(sandboxRoot, { recursive: true, force: true });
  }
};

export const runPairedRepairChecker = async (input: {
  readonly baseline: HeldOutCheckerInput;
  readonly krn: HeldOutCheckerInput;
}): Promise<PairedRepairScore> => {
  const [baseline, krn] = await Promise.all([
    runHeldOutTargetRepairChecker(input.baseline),
    runHeldOutTargetRepairChecker(input.krn)
  ]);

  return scorePairedRepairs({ baseline, krn });
};
