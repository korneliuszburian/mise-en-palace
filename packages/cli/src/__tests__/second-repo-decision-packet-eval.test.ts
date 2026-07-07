import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  runSecondRepoDecisionPacketEval
} from "../internal/eval/run-second-repo-decision-packet-eval.js";

const fixturePath = fileURLToPath(
  new URL("../../../../tests/fixtures/second-repo/weak-json-decision-packet-vs-notes.json", import.meta.url)
);
const thirdRepoFixturePath = fileURLToPath(
  new URL("../../../../tests/fixtures/second-repo/env-config-decision-packet-vs-notes.json", import.meta.url)
);
const fourthRepoFixturePath = fileURLToPath(
  new URL("../../../../tests/fixtures/second-repo/async-job-decision-packet-vs-notes.json", import.meta.url)
);

const writeFixtureVariant = (
  mutate: (fixture: Record<string, unknown>) => void,
  sourcePath = fixturePath
): string => {
  const fixture = JSON.parse(readFileSync(sourcePath, "utf8")) as Record<string, unknown>;
  mutate(fixture);
  const dir = mkdtempSync(join(tmpdir(), "krn-second-repo-eval-"));
  const path = join(dir, "fixture.json");
  writeFileSync(path, JSON.stringify(fixture, null, 2));
  return path;
};

describe("runSecondRepoDecisionPacketEval", () => {
  it("passes on the weak-json-boundary TypeScript target corpus", async () => {
    const result = await runSecondRepoDecisionPacketEval(fixturePath);

    expect(result).toMatchObject({
      kind: "krn.secondRepoDecisionPacket.eval.v1",
      status: "pass",
      targetRepo: "weak-json-boundary-typescript",
      targetRepos: ["weak-json-boundary-typescript"],
      metrics: {
        repoCount: 1,
        caseCount: 15,
        repoSpecificDecisionCount: 12,
        reusableKnowledgeDecisionCount: 3,
        rejectedPathCount: 5,
        staleDecisionCount: 5,
        selfRepoContaminationCount: 0
      }
    });
    expect(result.repoResults[0]).toMatchObject({
      targetRepo: "weak-json-boundary-typescript",
      decisionPacketStatus: "pass",
      metrics: {
        decisionPacketUsefulRate: 1
      },
      selfRepoContaminationRefs: []
    });
    expect(result.proof.proves).toEqual(expect.arrayContaining([
      "the decision-packet eval runs on target-repo corpora outside the KRN repo",
      "each target corpus includes stale and rejected-path readback"
    ]));
    expect(result.proof.doesNotProve).toEqual(expect.arrayContaining([
      "live Codex execution or obedience",
      "arbitrary repository portability",
      "repo-specificity beyond id prefix plus target-repo evidenceRef convention"
    ]));
  });

  it("passes with per-repo metrics across second, third, and fourth target corpora", async () => {
    const result = await runSecondRepoDecisionPacketEval([
      fixturePath,
      thirdRepoFixturePath,
      fourthRepoFixturePath
    ]);

    expect(result.status).toBe("pass");
    expect(result.targetRepos).toEqual([
      "weak-json-boundary-typescript",
      "env-config-contract-typescript",
      "async-job-boundary-typescript"
    ]);
    expect(result.metrics).toMatchObject({
      repoCount: 3,
      caseCount: 45,
      repoSpecificDecisionCount: 28,
      reusableKnowledgeDecisionCount: 9,
      rejectedPathCount: 11,
      staleDecisionCount: 9,
      selfRepoContaminationCount: 0
    });
    expect(result.repoResults.map((repo) => ({
      targetRepo: repo.targetRepo,
      decisionPacketStatus: repo.decisionPacketStatus,
      selfRepoContaminationCount: repo.metrics.selfRepoContaminationCount
    }))).toEqual([
      {
        targetRepo: "weak-json-boundary-typescript",
        decisionPacketStatus: "pass",
        selfRepoContaminationCount: 0
      },
      {
        targetRepo: "env-config-contract-typescript",
        decisionPacketStatus: "pass",
        selfRepoContaminationCount: 0
      },
      {
        targetRepo: "async-job-boundary-typescript",
        decisionPacketStatus: "pass",
        selfRepoContaminationCount: 0
      }
    ]);
  });

  it("fails when a second-repo fixture references self-repo evidence", async () => {
    const contaminatedFixturePath = writeFixtureVariant((fixture) => {
      const decisions = fixture["decisions"] as Array<Record<string, unknown>>;
      decisions[0] = {
        ...decisions[0],
        evidenceRef: "docs/runs/2026-07-06-self-repo.md"
      };
    });

    const result = await runSecondRepoDecisionPacketEval(contaminatedFixturePath);

    expect(result.status).toBe("fail");
    expect(result.metrics.selfRepoContaminationCount).toBe(1);
    expect(result.repoResults[0]?.selfRepoContaminationRefs).toEqual([
      "docs/runs/2026-07-06-self-repo.md"
    ]);
  });

  it("fails when a case-level reference points back to self-repo evidence", async () => {
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

    const result = await runSecondRepoDecisionPacketEval(contaminatedFixturePath);

    expect(result.status).toBe("fail");
    expect(result.metrics.selfRepoContaminationCount).toBe(1);
    expect(result.repoResults[0]?.selfRepoContaminationRefs).toEqual([
      "docs/runs/2026-07-06-case-level-leak.md"
    ]);
  });

  it("fails when no target-repo-backed governing decision remains", async () => {
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

    const result = await runSecondRepoDecisionPacketEval(genericFixturePath);

    expect(result.status).toBe("fail");
    expect(result.metrics.repoSpecificDecisionCount).toBe(0);
  });

  it("fails when the third repo loses target-repo-backed governing decisions", async () => {
    const genericThirdRepoFixturePath = writeFixtureVariant((fixture) => {
      const decisions = fixture["decisions"] as Array<Record<string, unknown>>;
      fixture["decisions"] = decisions.map((decision) =>
        typeof decision["id"] === "string" && decision["id"].startsWith("env-config-")
          ? {
              ...decision,
              evidenceRef: "docs/standards/typescript-boundaries.md"
            }
          : decision
      );
    }, thirdRepoFixturePath);

    const result = await runSecondRepoDecisionPacketEval([
      fixturePath,
      genericThirdRepoFixturePath
    ]);

    expect(result.status).toBe("fail");
    expect(result.repoResults[0]).toMatchObject({
      targetRepo: "weak-json-boundary-typescript",
      decisionPacketStatus: "pass"
    });
    expect(result.repoResults[1]).toMatchObject({
      targetRepo: "env-config-contract-typescript",
      metrics: {
        repoSpecificDecisionCount: 0
      }
    });
  });
});
