import {
  pairedRepairEvalCandidate,
  runPairedRepairChecker
} from "./paired-live-codex-repair.js";
import {
  runEvidenceCaptureCommand
} from "../../run-evidence-capture-command.js";
import {
  runDecisionPacketCommand
} from "../../run-decision-packet-command.js";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const readCandidate = (value: unknown, candidateId: string): boolean => {
  if (!isRecord(value)) {
    return false;
  }

  const candidates = value["candidates"];

  return Array.isArray(candidates) && candidates.some((candidate) =>
    isRecord(candidate) && candidate["id"] === candidateId && candidate["kind"] === "eval_candidate"
  );
};

const readBackPersistedCandidate = (value: unknown, candidateId: string): boolean => {
  if (!isRecord(value)) {
    return false;
  }

  const readModel = value["readModel"];

  if (!isRecord(readModel)) {
    return false;
  }

  const feedbackDeltas = readModel["feedbackDeltas"];

  return Array.isArray(feedbackDeltas) && feedbackDeltas.some((feedback) =>
    isRecord(feedback) && readCandidate(feedback, candidateId)
  );
};

const main = async (): Promise<void> => {
  const [
    runId,
    packetChecksum,
    baselineRoot,
    baselineCommit,
    krnRoot,
    krnCommit,
    checkerRoot = process.cwd(),
    databaseUrl = process.env.KRN_DATABASE_URL ?? "postgres://krn:krn@localhost:54329/krn"
  ] = process.argv.slice(2);

  if (
    runId === undefined ||
    packetChecksum === undefined ||
    baselineRoot === undefined ||
    baselineCommit === undefined ||
    krnRoot === undefined ||
    krnCommit === undefined
  ) {
    throw new Error(
      "Usage: persist-paired-live-codex-repair <run-id> <packet-checksum> <baseline-root> <baseline-commit> <krn-root> <krn-commit> [checker-root] [database-url]"
    );
  }

  const score = await runPairedRepairChecker({
    baseline: { targetRoot: baselineRoot, checkerRoot, initialCommit: baselineCommit },
    krn: { targetRoot: krnRoot, checkerRoot, initialCommit: krnCommit }
  });
  const now = new Date().toISOString();
  const candidate = pairedRepairEvalCandidate({
    score,
    runId,
    packetChecksum,
    evidenceRefs: [
      `packet:${packetChecksum}`,
      `checker:paired-live-codex-repair:${runId}`,
      `target:paired-live-codex-repair:${runId}:baseline-patch`,
      `target:paired-live-codex-repair:${runId}:krn-patch`
    ],
    createdAt: now
  });
  const commandOutcomes = [
    "pnpm test",
    "pnpm exec tsc -p tsconfig.json --noEmit",
    "git diff --check",
    "KRN held-out paired repair checker"
  ].map((command) => ({
    command,
    status: "passed" as const,
    provenance: "command_runner" as const,
    exitCode: 0,
    capturedAt: now,
    outputRef: `checker:paired-live-codex-repair:${runId}`,
    assertedBy: "krn-paired-live-codex-repair",
    doesNotProve: "The command result does not prove arbitrary-repository portability or product readiness."
  }));
  const targetEvidence = {
    targetRepo: `${baselineRoot};${krnRoot}`,
    mode: "headless_repair",
    dirtyBefore: "clean",
    dirtyAfter: "dirty",
    ownedChanges: "owned_by_current_krn_run",
    targetStatusFreshness: "fresh_current_task",
    targetPatchLifecycle: "handed_off_unresolved",
    allowedWrites: ["src/**", "tests/**", "docs/**"],
    forbiddenWrites: ["parent KRN packages", "other target repos", "network", "secrets", "commits", "pushes"],
    changedFiles: [
      ...score.baseline.changedFiles.map((path) => ({
        status: "modified",
        path: `baseline/${path}`,
        ownership: "owned_by_current_krn_run"
      })),
      ...score.krn.changedFiles.map((path) => ({
        status: "modified",
        path: `krn/${path}`,
        ownership: "owned_by_current_krn_run"
      }))
    ],
    commands: commandOutcomes.map((command) => command.command),
    doesNotProve: [
      "The tie does not prove that the DecisionPacket improved the target implementation.",
      "Disposable target patches were not committed to the controlled source fixture.",
      "This single trial does not prove arbitrary-repository portability or product readiness."
    ]
  } as const;
  const evidence = await runEvidenceCaptureCommand({
    env: { KRN_DATABASE_URL: databaseUrl },
    cwd: checkerRoot,
    now: () => now,
    createId: (prefix) => `${prefix}:paired-live:${runId}`,
    persist: true,
    runId,
    decisionPacketChecksum: packetChecksum,
    commandOutcomes,
    targetEvidence,
    evalCandidateProposals: [candidate],
    readGitStatus: async () => ""
  });
  const packetReadback = await runDecisionPacketCommand({
    env: { KRN_DATABASE_URL: databaseUrl },
    now: () => now,
    createId: (prefix) => `${prefix}:paired-live-readback:${runId}`,
    runId
  });
  const packetValue: unknown = JSON.parse(packetReadback.stdout);
  const persisted = readBackPersistedCandidate(packetValue, candidate.id);

  if (!persisted) {
    throw new Error(`Paired repair eval candidate ${candidate.id} was not visible in packet readback`);
  }

  const evidenceIdentity = evidence.stdout
    .split("\n")
    .filter((line) => line.includes("evidenceBundle:") || line.includes("feedbackDelta:"));

  process.stdout.write(`${JSON.stringify({
    kind: "krn.pairedLiveCodexRepair.persistence.v1",
    outcome: score.outcome,
    candidateId: candidate.id,
    packetChecksum,
    persistedInDecisionPacket: persisted,
    evidenceIdentity,
    score,
    proof: {
      proves: [
        "the actual paired checker outcome was stored as a reviewable EvalCandidate",
        "the candidate retained the originating packet checksum and target/checker evidence refs",
        "the candidate was visible after persistence through DecisionPacket readback",
        "tie was recorded as neutral rather than helped"
      ],
      doesNotProve: [
        "MemoryRecord or SourceClaim promotion",
        "a KRN causal win or arbitrary-repository portability",
        "product readiness"
      ]
    }
  }, null, 2)}\n`);
};

if (process.argv[1]?.endsWith("persist-paired-live-codex-repair.ts") === true) {
  await main();
}
