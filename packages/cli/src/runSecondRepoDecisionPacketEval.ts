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

export interface SecondRepoDecisionPacketEvalResult {
  readonly kind: "krn.secondRepoDecisionPacket.eval.v1";
  readonly status: SecondRepoEvalStatus;
  readonly targetRepo: string;
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
  readonly proof: {
    readonly proves: readonly string[];
    readonly doesNotProve: readonly string[];
  };
}

const targetRepoName = "weak-json-boundary-typescript";

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

const targetRepoEvidencePrefix = `tests/fixtures/target-repos/${targetRepoName}/`;

const isRepoSpecificDecision = (
  decision: NotesBaselineEvalFixture["decisions"][number]
): boolean =>
  decision.id.startsWith("weak-json-") &&
  decision.status === "current" &&
  decision.evidenceRef.startsWith(targetRepoEvidencePrefix);

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
  fixturePath: string
): SecondRepoDecisionPacketEvalResult => {
  const fixture = loadNotesBaselineEvalFixture(fixturePath);
  const notesBaseline = runNotesBaselineEval(fixture);
  const decisionPacket = runDecisionPacketEval(fixture);
  const repoSpecificDecisionCount = fixture.decisions.filter(isRepoSpecificDecision).length;
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
  const status =
    fixture.corpusName.includes(targetRepoName) &&
    notesBaseline.status === "pass" &&
    decisionPacket.status === "pass" &&
    repoSpecificDecisionCount >= 1 &&
    reusablePatternDecisionCount >= 1 &&
    rejectedPathCount >= 1 &&
    staleDecisionCount >= 1 &&
    selfRepoContaminationRefs.length === 0
      ? "pass"
      : "fail";

  return {
    kind: "krn.secondRepoDecisionPacket.eval.v1",
    status,
    targetRepo: targetRepoName,
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
    selfRepoContaminationRefs,
    proof: {
      proves: [
        "the decision-packet and notes-baseline evals run on a second target-repo corpus",
        "the second corpus has repo-specific governing decisions",
        "the second corpus includes at least one reusable KRN TypeScript pattern",
        "the second corpus includes rejected-path readback",
        "the second corpus avoids self-repo KRN plan/architecture evidence refs"
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
    runSecondRepoDecisionPacketEval(
      process.argv[2] ?? "tests/fixtures/second-repo/weak-json-decision-packet-vs-notes.json"
    )
  );
}
