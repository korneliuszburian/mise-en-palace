import { describe, expect, it } from "vitest";

import {
  runBrainSearchCommand
} from "./runBrainSearchCommand.js";

describe("runBrainSearchCommand", () => {
  it("combines knowledge cards and source search into a read-only brain preview", async () => {
    const result = await runBrainSearchCommand({
      cwd: "/repo",
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
      },
      now: () => "2026-06-30T13:00:00.000Z",
      createId: (prefix) => `${prefix}-1`,
      command: {
        kind: "brainSearch",
        query: "source-to-decision",
        catalogFiles: ["docs/brain-knowledge/catalog.json"],
        limit: 2,
        maxInclusions: 2,
        format: "json"
      },
      async runKnowledgeCards(runtime) {
        expect(runtime.catalogFiles).toEqual(["docs/brain-knowledge/catalog.json"]);
        expect(runtime.filter).toEqual({ text: "source-to-decision" });
        expect(runtime.format).toBe("json");

        return {
          stdout: JSON.stringify({
            kind: "krn.brainKnowledge.cards.preview.v1",
            returnedCards: 1,
            totalCards: 1,
            cards: [{ id: "pattern:source-to-decision-retention-gate" }],
            proof: {
              doesNotProve: ["knowledge-card completeness"]
            }
          })
        };
      },
      async runSourceSearch(runtime) {
        expect(runtime.command).toMatchObject({
          kind: "sourceSearch",
          query: "source-to-decision",
          limit: 2,
          maxInclusions: 2,
          json: true
        });

        return {
          stdout: JSON.stringify({
            kind: "source_search_answer_package",
            answerPackage: {
              answerUsefulness: "useful",
              supportingClaims: [{ label: "claim" }],
              supportingDocuments: [{ label: "doc" }],
              relationSupport: [{ edgeId: "edge-1" }],
              missingEvidence: []
            },
            includedCandidates: [{ subjectId: "claim-1" }],
            proof: {
              doesNotProve: ["source truth"]
            }
          })
        };
      }
    });
    const parsed: unknown = JSON.parse(result.stdout);

    expect(parsed).toMatchObject({
      kind: "krn.brainSearch.preview.v1",
      access: "read_only",
      mutation: "none",
      query: "source-to-decision",
      knowledgeCards: {
        returnedCards: 1,
        totalCards: 1,
        cardIds: ["pattern:source-to-decision-retention-gate"]
      },
      sourceSearch: {
        answerUsefulness: "useful",
        supportingClaims: 1,
        supportingDocuments: 1,
        relationSupport: 1,
        includedCandidates: 1
      }
    });
    expect(JSON.stringify(parsed)).toContain("Memory Core mutation");
  });

  it("renders text proof and no-match guidance", async () => {
    const result = await runBrainSearchCommand({
      cwd: "/repo",
      env: {},
      now: () => "2026-06-30T13:00:00.000Z",
      createId: (prefix) => `${prefix}-1`,
      command: {
        kind: "brainSearch",
        query: "missing pattern",
        catalogFiles: [],
        format: "text"
      },
      async runKnowledgeCards() {
        return {
          stdout: JSON.stringify({
            returnedCards: 0,
            totalCards: 0,
            cards: [],
            proof: {
              doesNotProve: ["knowledge-card completeness"]
            }
          })
        };
      },
      async runSourceSearch() {
        return {
          stdout: JSON.stringify({
            answerPackage: {
              answerUsefulness: "not_useful",
              supportingClaims: [],
              supportingDocuments: [],
              relationSupport: [],
              missingEvidence: ["governed SourceClaim evidence"]
            },
            includedCandidates: [],
            proof: {
              doesNotProve: ["source truth"]
            }
          })
        };
      }
    });

    expect(result.stdout).toContain("KRN Brain Search Preview");
    expect(result.stdout).toContain("Mutation: none");
    expect(result.stdout).toContain("missingEvidence: governed SourceClaim evidence");
    expect(result.stdout).toContain("Do not infer product truth");
    expect(result.stdout).toContain("does not prove: product readiness");
  });
});
