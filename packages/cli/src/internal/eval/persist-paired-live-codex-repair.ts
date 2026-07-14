import {
  pairedRepairEvalCandidate,
  runPairedRepairChecker
} from "./paired-live-codex-repair.js";
import type {
  HeldOutArmScore
} from "./paired-live-codex-repair.js";
import {
  pairedArmScoreSummary,
  pairedCommandEvidence
} from "./paired-command-evidence.js";
import {
  runEvidenceCaptureCommand
} from "../../run-evidence-capture-command.js";
import {
  runDecisionPacketCommand
} from "../../run-decision-packet-command.js";
import {
  collectEnvironmentFingerprint
} from "../../environment-fingerprint.js";

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

const targetChangedFiles = (
  arm: "baseline" | "krn",
  score: HeldOutArmScore
) => score.changeManifest === undefined
  ? score.changedFiles.map((path) => ({
      status: "modified",
      path: `${arm}/${path}`,
      ownership: "unknown"
    }))
  : [
      ...score.changeManifest.trackedFiles.map((path) => ({
        status: "modified",
        path: `${arm}/${path}`,
        ownership: "unknown"
      })),
      ...score.changeManifest.untrackedFiles.map((path) => ({
        status: "untracked",
        path: `${arm}/${path}`,
        ownership: "unknown"
      }))
    ];

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
  const environmentFingerprint = await collectEnvironmentFingerprint({
    repoRoot: checkerRoot,
    databaseUrl,
    evaluatorVersion: "paired-live-codex-repair.v1",
    checkerVersion: "paired-live-codex-repair-checker.v1"
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
  const commandEvidenceRows = [
    ...(score.baseline.commands === undefined ? [] : [
      pairedCommandEvidence("baseline", "test", score.baseline.commands.test),
      pairedCommandEvidence("baseline", "typecheck", score.baseline.commands.typecheck),
      pairedCommandEvidence("baseline", "diff-check", score.baseline.commands.diffCheck)
    ]),
    ...(score.baseline.runtimeCommand === undefined ? [] : [
      pairedCommandEvidence("baseline", "held-out-runtime", score.baseline.runtimeCommand)
    ]),
    ...(score.krn.commands === undefined ? [] : [
      pairedCommandEvidence("krn", "test", score.krn.commands.test),
      pairedCommandEvidence("krn", "typecheck", score.krn.commands.typecheck),
      pairedCommandEvidence("krn", "diff-check", score.krn.commands.diffCheck)
    ]),
    ...(score.krn.runtimeCommand === undefined ? [] : [
      pairedCommandEvidence("krn", "held-out-runtime", score.krn.runtimeCommand)
    ])
  ];
  const commandOutcomes = commandEvidenceRows.map((row) => row.command);
  const commandOutputArtifacts = commandEvidenceRows.flatMap((row) =>
    row.commandOutputArtifact === undefined ? [] : [row.commandOutputArtifact]
  );
  const targetEvidence = {
    targetRepo: `${baselineRoot};${krnRoot}`,
    mode: "headless_repair",
    dirtyBefore: "unknown",
    dirtyAfter: "dirty",
    ownedChanges: "unknown",
    targetStatusFreshness: "fresh_current_task",
    targetPatchLifecycle: "unknown",
    allowedWrites: ["src/**", "tests/**", "docs/**"],
    forbiddenWrites: ["parent KRN packages", "other target repos", "network", "secrets", "commits", "pushes"],
    changedFiles: [
      ...targetChangedFiles("baseline", score.baseline),
      ...targetChangedFiles("krn", score.krn)
    ],
    commands: commandOutcomes.map((command) => command.command),
    doesNotProve: [
      "The tie does not prove that the DecisionPacket improved the target implementation.",
      "Target patch ownership and lifecycle were not supplied by the checker and remain unknown.",
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
    commandOutputArtifacts,
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
    environmentFingerprint,
    persistedInDecisionPacket: persisted,
    evidenceIdentity,
    score: {
      outcome: score.outcome,
      reason: score.reason,
      baseline: pairedArmScoreSummary(score.baseline),
      krn: pairedArmScoreSummary(score.krn)
    },
    proof: {
      proves: [
        "the actual paired checker outcome was stored as a reviewable EvalCandidate",
        "the persisted evidence retained each arm command status, exit code, duration, and output reference",
        "the persisted target manifest included tracked and untracked paths with unknown ownership unless supplied by the target owner",
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
