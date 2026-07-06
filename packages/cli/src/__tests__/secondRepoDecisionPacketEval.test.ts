import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  runSecondRepoDecisionPacketEval
} from "../runSecondRepoDecisionPacketEval.js";

const fixturePath = fileURLToPath(
  new URL("../../../../tests/fixtures/second-repo/weak-json-decision-packet-vs-notes.json", import.meta.url)
);

const writeFixtureVariant = (
  mutate: (fixture: Record<string, unknown>) => void
): string => {
  const fixture = JSON.parse(readFileSync(fixturePath, "utf8")) as Record<string, unknown>;
  mutate(fixture);
  const dir = mkdtempSync(join(tmpdir(), "krn-second-repo-eval-"));
  const path = join(dir, "fixture.json");
  writeFileSync(path, JSON.stringify(fixture, null, 2));
  return path;
};

describe("runSecondRepoDecisionPacketEval", () => {
  it("passes on the weak-json-boundary TypeScript target corpus", () => {
    const result = runSecondRepoDecisionPacketEval(fixturePath);

    expect(result).toMatchObject({
      kind: "krn.secondRepoDecisionPacket.eval.v1",
      status: "pass",
      targetRepo: "weak-json-boundary-typescript",
      notesBaselineStatus: "pass",
      decisionPacketStatus: "pass",
      metrics: {
        caseCount: 15,
        repoSpecificDecisionCount: 12,
        reusablePatternDecisionCount: 3,
        rejectedPathCount: 5,
        staleDecisionCount: 5,
        notesKrnWinRate: 1,
        decisionPacketUsefulRate: 1,
        selfRepoContaminationCount: 0
      },
      selfRepoContaminationRefs: []
    });
    expect(result.proof.proves).toEqual(expect.arrayContaining([
      "the decision-packet and notes-baseline evals run on a second target-repo corpus",
      "the second corpus includes rejected-path readback"
    ]));
    expect(result.proof.doesNotProve).toEqual(expect.arrayContaining([
      "live Codex execution or obedience",
      "arbitrary repository portability",
      "repo-specificity beyond id prefix plus target-repo evidenceRef convention"
    ]));
  });

  it("fails when a second-repo fixture references self-repo evidence", () => {
    const contaminatedFixturePath = writeFixtureVariant((fixture) => {
      const decisions = fixture["decisions"] as Array<Record<string, unknown>>;
      decisions[0] = {
        ...decisions[0],
        evidenceRef: "docs/runs/2026-07-06-self-repo.md"
      };
    });

    const result = runSecondRepoDecisionPacketEval(contaminatedFixturePath);

    expect(result.status).toBe("fail");
    expect(result.metrics.selfRepoContaminationCount).toBe(1);
    expect(result.selfRepoContaminationRefs).toEqual([
      "docs/runs/2026-07-06-self-repo.md"
    ]);
  });

  it("fails when a case-level reference points back to self-repo evidence", () => {
    const contaminatedFixturePath = writeFixtureVariant((fixture) => {
      const decisions = fixture["decisions"] as Array<Record<string, unknown>>;
      const rejectedDecision = decisions.find((decision) => decision["status"] === "rejected") ?? {};
      decisions.push({
        ...rejectedDecision,
        id: "docs/runs/2026-07-06-case-level-leak.md",
        evidenceRef: "tests/fixtures/target-repos/weak-json-boundary-typescript/src/parser.ts"
      });
      const notes = fixture["notes"] as Array<Record<string, unknown>>;
      notes.push({
        id: "note-case-level-leak",
        decisionId: "docs/runs/2026-07-06-case-level-leak.md",
        text: "Rejected case-level self-repo path leak fixture note."
      });
      const cases = fixture["cases"] as Array<Record<string, unknown>>;
      const firstCase = cases[0] ?? {};
      const rejectedDecisionIds = firstCase["rejectedDecisionIds"] as string[];
      cases[0] = {
        ...firstCase,
        rejectedDecisionIds: [
          ...rejectedDecisionIds,
          "docs/runs/2026-07-06-case-level-leak.md"
        ]
      };
    });

    const result = runSecondRepoDecisionPacketEval(contaminatedFixturePath);

    expect(result.status).toBe("fail");
    expect(result.metrics.selfRepoContaminationCount).toBe(1);
    expect(result.selfRepoContaminationRefs).toEqual([
      "docs/runs/2026-07-06-case-level-leak.md"
    ]);
  });

  it("fails when no target-repo-backed governing decision remains", () => {
    const genericFixturePath = writeFixtureVariant((fixture) => {
      const decisions = fixture["decisions"] as Array<Record<string, unknown>>;
      fixture["decisions"] = decisions.map((decision) =>
        typeof decision["id"] === "string" && decision["id"].startsWith("weak-json-")
          ? {
              ...decision,
              evidenceRef: "docs/standards/typescript-boundary.md"
            }
          : decision
      );
    });

    const result = runSecondRepoDecisionPacketEval(genericFixturePath);

    expect(result.status).toBe("fail");
    expect(result.metrics.repoSpecificDecisionCount).toBe(0);
  });
});
