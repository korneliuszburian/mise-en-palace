import {
  isCliEntrypoint,
  writeJsonEvalResult
} from "./evalMain.js";
import {
  runDecisionPacketEval
} from "./runDecisionPacketEval.js";
import {
  loadNotesBaselineEvalFixture,
  type NotesBaselineEvalFixture,
  runNotesBaselineEval
} from "./runNotesBaselineEval.js";

type SecondRepoEvalStatus = "pass" | "fail";

export interface SecondRepoTargetResult {
  readonly targetRepo: string;
  readonly corpusName: string;
  readonly metrics: {
    readonly caseCount: number;
    readonly repoSpecificDecisionCount: number;
    readonly reusablePatternDecisionCount: number;
    readonly rejectedPathCount: number;
    readonly staleDecisionCount: number;
    readonly notesKrnWinRate: number;
    readonly decisionPacketUsefulRate: number;
    readonly selfRepoContaminationCount: number;
  };
  readonly notesBaselineStatus: SecondRepoEvalStatus;
  readonly decisionPacketStatus: SecondRepoEvalStatus;
  readonly selfRepoContaminationRefs: readonly string[];
}

export interface SecondRepoDecisionPacketEvalResult {
  readonly kind: "krn.secondRepoDecisionPacket.eval.v1";
  readonly status: SecondRepoEvalStatus;
  readonly targetRepo: string;
  readonly targetRepos: readonly string[];
  readonly repoResults: readonly SecondRepoTargetResult[];
  readonly metrics: {
    readonly repoCount: number;
    readonly caseCount: number;
    readonly repoSpecificDecisionCount: number;
    readonly reusablePatternDecisionCount: number;
    readonly rejectedPathCount: number;
    readonly staleDecisionCount: number;
    readonly selfRepoContaminationCount: number;
  };
  readonly proof: {
    readonly proves: readonly string[];
    readonly doesNotProve: readonly string[];
  };
}

const defaultFixturePaths = [
  "tests/fixtures/second-repo/weak-json-decision-packet-vs-notes.json",
  "tests/fixtures/second-repo/env-config-decision-packet-vs-notes.json"
] as const;

const selfRepoEvidencePrefixes = [
  "PLAN.md",
  "GOAL.md",
  "PLANS.md",
  "NOTES.md",
  ".beads/",
  "docs/KRN_",
  "docs/architecture/",
  "docs/runs/",
  "packages/"
];

const isSelfRepoEvidenceRef = (
  evidenceRef: string
): boolean => selfRepoEvidencePrefixes.some((prefix) => evidenceRef.startsWith(prefix));

const isDefinedString = (value: string | undefined): value is string => value !== undefined;

const targetRepoNameFromFixture = (
  fixture: NotesBaselineEvalFixture
): string => {
  const suffixes = [
    "-second-repo",
    "-third-repo"
  ] as const;
  const matchedSuffix = suffixes.find((suffix) => fixture.corpusName.endsWith(suffix));

  return matchedSuffix === undefined
    ? fixture.corpusName
    : fixture.corpusName.slice(0, -matchedSuffix.length);
};

const isRepoSpecificDecision = (
  targetRepo: string,
  decision: NotesBaselineEvalFixture["decisions"][number]
): boolean =>
  decision.status === "current" &&
  decision.evidenceRef.startsWith(`tests/fixtures/target-repos/${targetRepo}/`);

const decisionReferenceValues = (
  decision: NotesBaselineEvalFixture["decisions"][number]
): readonly string[] => [
  decision.evidenceRef,
  decision.sourceClaimId,
  decision.sourceDecisionEdgeId,
  decision.sourceRejectionId
].filter(isDefinedString);

const caseReferenceValues = (
  baselineCase: NotesBaselineEvalFixture["cases"][number]
): readonly string[] => [
  baselineCase.expectedDecisionId,
  ...baselineCase.staleDecisionIds,
  ...baselineCase.rejectedDecisionIds
];

const collectSelfRepoContaminationRefs = (
  fixture: NotesBaselineEvalFixture
): readonly string[] => [
  ...fixture.decisions.flatMap(decisionReferenceValues),
  ...fixture.cases.flatMap(caseReferenceValues)
].filter(isSelfRepoEvidenceRef);

export const runSecondRepoDecisionPacketEval = (
  fixturePaths: string | readonly string[]
): SecondRepoDecisionPacketEvalResult => {
  const paths = typeof fixturePaths === "string" ? [fixturePaths] : fixturePaths;
  const repoResults = paths.map((fixturePath): SecondRepoTargetResult => {
    const fixture = loadNotesBaselineEvalFixture(fixturePath);
    const targetRepo = targetRepoNameFromFixture(fixture);
    const notesBaseline = runNotesBaselineEval(fixture);
    const decisionPacket = runDecisionPacketEval(fixture);
    const repoSpecificDecisionCount = fixture.decisions.filter((decision) =>
      isRepoSpecificDecision(targetRepo, decision)
    ).length;
    const reusablePatternDecisionCount = fixture.decisions.filter((decision) =>
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
        reusablePatternDecisionCount,
        rejectedPathCount,
        staleDecisionCount,
        notesKrnWinRate: notesBaseline.metrics.krnWinRate,
        decisionPacketUsefulRate: decisionPacket.metrics.usefulRate,
        selfRepoContaminationCount: selfRepoContaminationRefs.length
      },
      notesBaselineStatus: notesBaseline.status,
      decisionPacketStatus: decisionPacket.status,
      selfRepoContaminationRefs
    };
  });

  const targetRepos = repoResults.map((result) => result.targetRepo);
  const totals = repoResults.reduce((sum, result) => ({
    caseCount: sum.caseCount + result.metrics.caseCount,
    repoSpecificDecisionCount: sum.repoSpecificDecisionCount + result.metrics.repoSpecificDecisionCount,
    reusablePatternDecisionCount: sum.reusablePatternDecisionCount + result.metrics.reusablePatternDecisionCount,
    rejectedPathCount: sum.rejectedPathCount + result.metrics.rejectedPathCount,
    staleDecisionCount: sum.staleDecisionCount + result.metrics.staleDecisionCount,
    selfRepoContaminationCount: sum.selfRepoContaminationCount + result.metrics.selfRepoContaminationCount
  }), {
    caseCount: 0,
    repoSpecificDecisionCount: 0,
    reusablePatternDecisionCount: 0,
    rejectedPathCount: 0,
    staleDecisionCount: 0,
    selfRepoContaminationCount: 0
  });
  const everyRepoPasses = repoResults.every((result) =>
    result.notesBaselineStatus === "pass" &&
    result.decisionPacketStatus === "pass" &&
    result.metrics.repoSpecificDecisionCount >= 1 &&
    result.metrics.reusablePatternDecisionCount >= 1 &&
    result.metrics.rejectedPathCount >= 1 &&
    result.metrics.staleDecisionCount >= 1 &&
    result.metrics.selfRepoContaminationCount === 0
  );
  const status = paths.length > 0 && everyRepoPasses ? "pass" : "fail";

  return {
    kind: "krn.secondRepoDecisionPacket.eval.v1",
    status,
    targetRepo: targetRepos[0] ?? "none",
    targetRepos,
    repoResults,
    metrics: {
      repoCount: repoResults.length,
      ...totals
    },
    proof: {
      proves: [
        "the decision-packet and notes-baseline evals run on target-repo corpora outside the KRN repo",
        "each target corpus has repo-specific governing decisions",
        "each target corpus includes at least one reusable KRN TypeScript pattern",
        "each target corpus includes stale and rejected-path readback",
        "each target corpus avoids self-repo KRN plan/architecture evidence refs"
      ],
      doesNotProve: [
        "commercial validation",
        "live Codex execution or obedience",
        "arbitrary repository portability",
        "source truth",
        "that every reusable pattern transfers cleanly",
        "repo-specificity beyond id prefix plus target-repo evidenceRef convention"
      ]
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
