import {
  isCliEntrypoint,
  writeJsonEvalResult
} from "./eval-main.js";
import {
  runDecisionPacketEval
} from "./run-decision-packet-eval.js";
import {
  loadDecisionPacketEvalFixture,
  type DecisionPacketEvalFixture
} from "../../decision-packet-fixture.js";
import type {
  DecisionPacketEvalKind,
  DecisionPacketEvalScorerModel
} from "./decision-packet-eval-shape.js";
import {
  decisionPacketEvalKind,
  decisionPacketEvalScorerModel
} from "./decision-packet-eval-shape.js";

type SecondRepoEvalStatus = "pass" | "fail";

export interface SecondRepoTargetResult {
  readonly targetRepo: string;
  readonly corpusName: string;
  readonly metrics: {
    readonly caseCount: number;
    readonly repoSpecificDecisionCount: number;
    readonly reusableKnowledgeDecisionCount: number;
    readonly rejectedPathCount: number;
    readonly staleDecisionCount: number;
    readonly decisionPacketUsefulRate: number;
    readonly krnWinCount: number;
    readonly notesWinCount: number;
    readonly tieCount: number;
    readonly decisiveComparisonCount: number;
    readonly selfRepoContaminationCount: number;
  };
  readonly decisionPacketStatus: SecondRepoEvalStatus;
  readonly selfRepoContaminationRefs: readonly string[];
}

export interface SecondRepoDecisionPacketEvalResult {
  readonly kind: "krn.secondRepoDecisionPacket.eval.v1";
  readonly status: SecondRepoEvalStatus;
  readonly sourceEvalKind: DecisionPacketEvalKind;
  readonly sourceScorerModel: DecisionPacketEvalScorerModel;
  readonly targetRepo: string;
  readonly targetRepos: readonly string[];
  readonly targetTrial: {
    readonly mode: "observation-only";
    readonly targetDirtyBefore: "not_applicable_fixture";
    readonly targetStatusFreshness: "fresh_current_task";
    readonly targetPatchLifecycle: "none";
    readonly allowedWrites: readonly [];
    readonly forbiddenWrites: readonly string[];
    readonly commands: readonly string[];
    readonly targetDirtyAfter: "not_applicable_fixture";
  };
  readonly repoResults: readonly SecondRepoTargetResult[];
  readonly metrics: {
    readonly repoCount: number;
    readonly caseCount: number;
    readonly repoSpecificDecisionCount: number;
    readonly reusableKnowledgeDecisionCount: number;
    readonly rejectedPathCount: number;
    readonly staleDecisionCount: number;
    readonly krnWinCount: number;
    readonly notesWinCount: number;
    readonly tieCount: number;
    readonly decisiveComparisonCount: number;
    readonly selfRepoContaminationCount: number;
  };
  readonly gaps: readonly string[];
  readonly proof: {
    readonly proves: readonly string[];
    readonly doesNotProve: readonly string[];
  };
}

const defaultFixturePaths = [
  "tests/fixtures/second-repo/weak-json-decision-packet-vs-notes.json",
  "tests/fixtures/second-repo/env-config-decision-packet-vs-notes.json",
  "tests/fixtures/second-repo/async-job-decision-packet-vs-notes.json"
] as const;

const selfRepoEvidencePrefixes = [
  "PLAN.md",
  "GOAL.md",
  "PLANS.md",
  "NOTES.md",
  ".beads/",
  "docs/KRN_",
  "run-evidence/",
  "packages/"
];

const secondRepoEvalCommand = "pnpm eval:second-repo-decision-packet";

const secondRepoEvalGaps = [
  "commercial validation",
  "live Codex execution or obedience",
  "arbitrary repository portability",
  "source truth",
  "that every reusable pattern transfers cleanly",
  "repo-specificity beyond id prefix plus target-repo evidenceRef convention"
] as const;

const isSelfRepoEvidenceRef = (
  evidenceRef: string
): boolean => selfRepoEvidencePrefixes.some((prefix) => evidenceRef.startsWith(prefix));

const isDefinedString = (value: string | undefined): value is string => value !== undefined;

const targetRepoNameFromFixture = (
  fixture: DecisionPacketEvalFixture
): string => {
  const suffixes = [
    "-second-repo",
    "-third-repo",
    "-fourth-repo"
  ] as const;
  const matchedSuffix = suffixes.find((suffix) => fixture.corpusName.endsWith(suffix));

  return matchedSuffix === undefined
    ? fixture.corpusName
    : fixture.corpusName.slice(0, -matchedSuffix.length);
};

const isRepoSpecificDecision = (
  targetRepo: string,
  decision: DecisionPacketEvalFixture["decisions"][number]
): boolean =>
  decision.status === "current" &&
  decision.evidenceRef.startsWith(`tests/fixtures/target-repos/${targetRepo}/`);

const decisionReferenceValues = (
  decision: DecisionPacketEvalFixture["decisions"][number]
): readonly string[] => [
  decision.evidenceRef,
  decision.sourceClaimId,
  decision.sourceDecisionEdgeId,
  decision.sourceRejectionId
].filter(isDefinedString);

const caseReferenceValues = (
  baselineCase: DecisionPacketEvalFixture["cases"][number]
): readonly string[] => [
  ...(baselineCase.expectedDecisionId === undefined ? [] : [baselineCase.expectedDecisionId]),
  ...baselineCase.staleDecisionIds,
  ...baselineCase.rejectedDecisionIds
];

const collectSelfRepoContaminationRefs = (
  fixture: DecisionPacketEvalFixture
): readonly string[] => [
  ...fixture.decisions.flatMap(decisionReferenceValues),
  ...fixture.cases.flatMap(caseReferenceValues)
].filter(isSelfRepoEvidenceRef);

export const runSecondRepoDecisionPacketEval = async (
  fixturePaths: string | readonly string[]
): Promise<SecondRepoDecisionPacketEvalResult> => {
  const paths = typeof fixturePaths === "string" ? [fixturePaths] : fixturePaths;
  const repoResults = await Promise.all(paths.map(async (fixturePath): Promise<SecondRepoTargetResult> => {
    const fixture = loadDecisionPacketEvalFixture(fixturePath);
    const targetRepo = targetRepoNameFromFixture(fixture);
    const decisionPacket = await runDecisionPacketEval(fixture);
    const repoSpecificDecisionCount = fixture.decisions.filter((decision) =>
      isRepoSpecificDecision(targetRepo, decision)
    ).length;
    const reusableKnowledgeDecisionCount = fixture.decisions.filter((decision) =>
      decision.id.startsWith("reuse-") && decision.status === "current"
    ).length;
    const rejectedPathCount = fixture.decisions.filter((decision) =>
      decision.status === "rejected" && decision.sourceRejectionId !== undefined
    ).length;
    const staleDecisionCount = fixture.decisions.filter((decision) =>
      decision.status === "stale"
    ).length;
    const selfRepoContaminationRefs = collectSelfRepoContaminationRefs(fixture);

    return {
      targetRepo,
      corpusName: fixture.corpusName,
      metrics: {
        caseCount: fixture.cases.length,
        repoSpecificDecisionCount,
        reusableKnowledgeDecisionCount,
        rejectedPathCount,
        staleDecisionCount,
        decisionPacketUsefulRate: decisionPacket.metrics.usefulRate,
        krnWinCount: decisionPacket.metrics.krnWinCount,
        notesWinCount: decisionPacket.metrics.notesWinCount,
        tieCount: decisionPacket.metrics.tieCount,
        decisiveComparisonCount: decisionPacket.metrics.decisiveComparisonCount,
        selfRepoContaminationCount: selfRepoContaminationRefs.length
      },
      decisionPacketStatus: decisionPacket.status,
      selfRepoContaminationRefs
    };
  }));

  const targetRepos = repoResults.map((result) => result.targetRepo);
  const totals = repoResults.reduce((sum, result) => ({
    caseCount: sum.caseCount + result.metrics.caseCount,
    repoSpecificDecisionCount: sum.repoSpecificDecisionCount + result.metrics.repoSpecificDecisionCount,
    reusableKnowledgeDecisionCount: sum.reusableKnowledgeDecisionCount + result.metrics.reusableKnowledgeDecisionCount,
    rejectedPathCount: sum.rejectedPathCount + result.metrics.rejectedPathCount,
    staleDecisionCount: sum.staleDecisionCount + result.metrics.staleDecisionCount,
    krnWinCount: sum.krnWinCount + result.metrics.krnWinCount,
    notesWinCount: sum.notesWinCount + result.metrics.notesWinCount,
    tieCount: sum.tieCount + result.metrics.tieCount,
    decisiveComparisonCount: sum.decisiveComparisonCount + result.metrics.decisiveComparisonCount,
    selfRepoContaminationCount: sum.selfRepoContaminationCount + result.metrics.selfRepoContaminationCount
  }), {
    caseCount: 0,
    repoSpecificDecisionCount: 0,
    reusableKnowledgeDecisionCount: 0,
    rejectedPathCount: 0,
    staleDecisionCount: 0,
    krnWinCount: 0,
    notesWinCount: 0,
    tieCount: 0,
    decisiveComparisonCount: 0,
    selfRepoContaminationCount: 0
  });
  const everyRepoPasses = repoResults.every((result) =>
    result.decisionPacketStatus === "pass" &&
    result.metrics.repoSpecificDecisionCount >= 1 &&
    result.metrics.reusableKnowledgeDecisionCount >= 1 &&
    result.metrics.rejectedPathCount >= 1 &&
    result.metrics.staleDecisionCount >= 1 &&
    result.metrics.selfRepoContaminationCount === 0
  );
  const status = paths.length > 0 && everyRepoPasses ? "pass" : "fail";

  return {
    kind: "krn.secondRepoDecisionPacket.eval.v1",
    status,
    sourceEvalKind: decisionPacketEvalKind,
    sourceScorerModel: decisionPacketEvalScorerModel,
    targetRepo: targetRepos[0] ?? "none",
    targetRepos,
    targetTrial: {
      mode: "observation-only",
      targetDirtyBefore: "not_applicable_fixture",
      targetStatusFreshness: "fresh_current_task",
      targetPatchLifecycle: "none",
      allowedWrites: [],
      forbiddenWrites: [
        "target source edits",
        "target commits",
        "target pushes",
        "target cleanup or reset"
      ],
      commands: [secondRepoEvalCommand],
      targetDirtyAfter: "not_applicable_fixture"
    },
    repoResults,
    metrics: {
      repoCount: repoResults.length,
      ...totals
    },
    gaps: [...secondRepoEvalGaps],
    proof: {
      proves: [
        "the decision-packet eval runs on target-repo corpora outside the KRN repo",
        "each target corpus has repo-specific governing decisions",
        "each target corpus includes at least one reusable KRN TypeScript pattern",
        "each target corpus includes stale and rejected-path readback",
        "each target corpus reports KRN-vs-notes comparison outcomes",
        "each target corpus avoids self-repo KRN plan/architecture evidence refs"
      ],
      doesNotProve: [...secondRepoEvalGaps]
    }
  };
};

if (isCliEntrypoint(import.meta.url)) {
  await writeJsonEvalResult(async () =>
    runSecondRepoDecisionPacketEval(process.argv.slice(2).length === 0
      ? defaultFixturePaths
      : process.argv.slice(2))
  );
}
