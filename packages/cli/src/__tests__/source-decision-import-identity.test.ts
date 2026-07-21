import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  loadDecisionCorpusImportFixture
} from "../internal/eval/run-decision-corpus-import.js";
import {
  deriveSourceDecisionImportIdentity,
  validateSourceDecisionImportFixture
} from "../source-decision-store-import.js";

const fixturePath = fileURLToPath(
  new URL(
    "../../../../tests/fixtures/decision-corpus-ingest/krn-source-to-decision-import.json",
    import.meta.url
  )
);

const fixture = () => loadDecisionCorpusImportFixture(fixturePath);

describe("source decision import identity", () => {
  it("binds a canonical corpus and evidence manifest to one project selector", () => {
    const sourceFixture = fixture();
    const sourceIdentity = deriveSourceDecisionImportIdentity({
      projectIdentity: "project-source-import-identity",
      fixture: sourceFixture
    });
    const reorderedFixture = {
      ...sourceFixture,
      decisions: [...sourceFixture.decisions]
        .reverse()
        .map((row) => ({ ...row, taskScopes: [...row.taskScopes].reverse() })),
      cases: [...sourceFixture.cases]
        .reverse()
        .map((row) => ({
          ...row,
          staleDecisionIds: [...row.staleDecisionIds].reverse(),
          rejectedDecisionIds: [...row.rejectedDecisionIds].reverse()
        })),
      ...(sourceFixture.coverageScope === undefined
        ? {}
        : {
            coverageScope: {
              declaredRows: [...sourceFixture.coverageScope.declaredRows]
                .reverse()
                .map((row) => ({ ...row, evidenceRefs: [...row.evidenceRefs].reverse() }))
            }
          })
    };
    const firstDecision = sourceFixture.decisions[0];

    if (firstDecision === undefined) {
      throw new Error("source import identity fixture requires a decision");
    }

    expect(sourceIdentity).toMatch(/^source-decision-import:[a-f0-9]{64}$/u);
    expect(deriveSourceDecisionImportIdentity({
      projectIdentity: "project-source-import-identity",
      fixture: reorderedFixture
    })).toBe(sourceIdentity);
    expect(deriveSourceDecisionImportIdentity({
      projectIdentity: "project-source-import-identity",
      fixture: {
        ...sourceFixture,
        decisions: sourceFixture.decisions.map((row, index) => index === 0
          ? { ...row, statement: `${row.statement} changed` }
          : row)
      }
    })).not.toBe(sourceIdentity);
    expect(deriveSourceDecisionImportIdentity({
      projectIdentity: "project-source-import-identity-other-project",
      fixture: sourceFixture
    })).not.toBe(sourceIdentity);
    expect(() => validateSourceDecisionImportFixture({
      ...sourceFixture,
      decisions: [
        firstDecision,
        { ...firstDecision, id: `${firstDecision.id}-duplicate` }
      ]
    })).toThrow(/duplicate current statements/u);
  });
});
