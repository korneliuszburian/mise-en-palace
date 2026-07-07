import {
  isCliEntrypoint,
  writeJsonEvalResult
} from "./eval-main.js";
import {
  isRecord,
  numberValue,
  recordArray,
  stringValue
} from "../../fixture-parse-support.js";
import {
  runSourceDecisionGapsCommand
} from "../../run-source-decision-gaps-command.js";
import {
  runSourceSearchCommand
} from "../../run-source-search-command.js";

type CorpusClosureStatus = "pass" | "fail";

interface SourceDecisionGapsReadback {
  readonly projectId: string;
  readonly acceptedSourceClaimCount: number;
  readonly linkedSourceClaimCount: number;
  readonly missingDecisionEdgeCount: number;
  readonly pendingUnadoptedSourceClaimCount: number;
}

interface SourceSearchSupportingClaimReadback {
  readonly label: string;
  readonly sourceClaimId: string | undefined;
  readonly sourceDecisionSupportState: "linked" | "missing" | undefined;
  readonly totalScore: number;
}

interface SourceSearchReadback {
  readonly query: string;
  readonly supportingClaims: readonly SourceSearchSupportingClaimReadback[];
}

interface CorpusClosureCaseResult {
  readonly id: string;
  readonly query: string;
  readonly status: CorpusClosureStatus;
  readonly topSupportingClaimIds: readonly string[];
  readonly linkedTop3ClaimIds: readonly string[];
  readonly failureReason: string | undefined;
}

export interface CorpusClosureSmokeResult {
  readonly kind: "krn.corpusClosure.smoke.v1";
  readonly status: CorpusClosureStatus;
  readonly projectId: string;
  readonly gaps: SourceDecisionGapsReadback;
  readonly cases: readonly CorpusClosureCaseResult[];
  readonly proof: {
    readonly proves: readonly string[];
    readonly doesNotProve: readonly string[];
  };
}

interface CorpusClosureSmokeCommandRunners {
  readonly sourceDecisionGaps: () => Promise<string>;
  readonly sourceSearch: (query: string) => Promise<string>;
}

interface CorpusClosureSmokeInput {
  readonly runners: CorpusClosureSmokeCommandRunners;
  readonly queries?: readonly CorpusClosureQuery[];
}

interface CorpusClosureQuery {
  readonly id: string;
  readonly query: string;
}

const canonicalQueries: readonly CorpusClosureQuery[] = [
  {
    id: "worker-boundary",
    query: "should KRN build worker executor daemon now"
  },
  {
    id: "surface-boundary",
    query: "should KRN build dashboard API MCP crawler broad benchmark now"
  },
  {
    id: "unknown-first",
    query: "unknown-first TypeScript external JSON env file CLI MCP inputs"
  },
  {
    id: "bounded-loop",
    query: "bounded local artifact flow before crawler embeddings schema ranking"
  },
  {
    id: "source-authority",
    query: "accepted SourceClaims SourceDecisionEdge source authority boundary"
  },
  {
    id: "feedback-forget",
    query: "feedback forget stale decision hurt feedback next activation"
  }
];

const optionalStringValue = (
  value: unknown,
  label: string
): string | undefined => value === undefined ? undefined : stringValue(value, label);

const optionalDecisionSupportState = (
  value: unknown,
  label: string
): SourceSearchSupportingClaimReadback["sourceDecisionSupportState"] => {
  if (value === undefined) {
    return undefined;
  }

  const state = stringValue(value, label);

  if (state !== "linked" && state !== "missing") {
    throw new Error(`${label} must be linked or missing`);
  }

  return state;
};

const parseJsonObject = (
  text: string,
  label: string
): Record<string, unknown> => {
  const parsed: unknown = JSON.parse(text);

  if (!isRecord(parsed)) {
    throw new Error(`${label} must be a JSON object`);
  }

  return parsed;
};

const parseSourceDecisionGaps = (
  text: string
): SourceDecisionGapsReadback => {
  const output = parseJsonObject(text, "source decision gaps output");

  if (output["kind"] !== "source_decision_gaps") {
    throw new Error("source decision gaps output kind must be source_decision_gaps");
  }

  return {
    projectId: stringValue(output["projectId"], "source decision gaps projectId"),
    acceptedSourceClaimCount: numberValue(output["acceptedSourceClaimCount"], "acceptedSourceClaimCount"),
    linkedSourceClaimCount: numberValue(output["linkedSourceClaimCount"], "linkedSourceClaimCount"),
    missingDecisionEdgeCount: numberValue(output["missingDecisionEdgeCount"], "missingDecisionEdgeCount"),
    pendingUnadoptedSourceClaimCount: numberValue(output["pendingUnadoptedSourceClaimCount"], "pendingUnadoptedSourceClaimCount")
  };
};

const parseSupportingClaim = (
  value: Record<string, unknown>,
  index: number
): SourceSearchSupportingClaimReadback => ({
  label: stringValue(value["label"], `supportingClaims[${index}].label`),
  sourceClaimId: optionalStringValue(value["sourceClaimId"], `supportingClaims[${index}].sourceClaimId`),
  sourceDecisionSupportState: optionalDecisionSupportState(
    value["sourceDecisionSupportState"],
    `supportingClaims[${index}].sourceDecisionSupportState`
  ),
  totalScore: numberValue(value["totalScore"], `supportingClaims[${index}].totalScore`)
});

const parseSourceSearch = (
  text: string
): SourceSearchReadback => {
  const output = parseJsonObject(text, "source search output");

  if (output["kind"] !== "source_search_answer_package") {
    throw new Error("source search output kind must be source_search_answer_package");
  }

  if (!isRecord(output["answerPackage"])) {
    throw new Error("source search answerPackage must be an object");
  }

  return {
    query: stringValue(output["query"], "source search query"),
    supportingClaims: recordArray(
      output["answerPackage"]["supportingClaims"],
      "answerPackage.supportingClaims"
    ).map(parseSupportingClaim)
  };
};

const evaluateCase = (
  query: CorpusClosureQuery,
  readback: SourceSearchReadback
): CorpusClosureCaseResult => {
  const top3 = readback.supportingClaims.slice(0, 3);
  const linkedTop3ClaimIds = top3
    .filter((claim) => claim.sourceDecisionSupportState === "linked")
    .flatMap((claim) => claim.sourceClaimId === undefined ? [] : [claim.sourceClaimId]);
  const topSupportingClaimIds = top3
    .flatMap((claim) => claim.sourceClaimId === undefined ? [] : [claim.sourceClaimId]);
  const failureReason =
    linkedTop3ClaimIds.length === 0
      ? "top 3 supporting claims did not include SourceDecisionEdge-linked authority"
      : undefined;

  return {
    id: query.id,
    query: readback.query,
    status: failureReason === undefined ? "pass" : "fail",
    topSupportingClaimIds,
    linkedTop3ClaimIds,
    failureReason
  };
};

const gapsPass = (
  gaps: SourceDecisionGapsReadback
): boolean =>
  gaps.acceptedSourceClaimCount > 0 &&
  gaps.pendingUnadoptedSourceClaimCount === 0 &&
  gaps.missingDecisionEdgeCount === 0;

export const runCorpusClosureSmoke = async (
  input: CorpusClosureSmokeInput
): Promise<CorpusClosureSmokeResult> => {
  const gaps = parseSourceDecisionGaps(await input.runners.sourceDecisionGaps());
  const queries = input.queries ?? canonicalQueries;
  const cases = await Promise.all(queries.map(async (query) =>
    evaluateCase(query, parseSourceSearch(await input.runners.sourceSearch(query.query)))
  ));
  const status =
    gapsPass(gaps) &&
    cases.every((testCase) => testCase.status === "pass")
      ? "pass"
      : "fail";

  return {
    kind: "krn.corpusClosure.smoke.v1",
    status,
    projectId: gaps.projectId,
    gaps,
    cases,
    proof: {
      proves: [
        "dogfood corpus has at least one accepted SourceClaim, so an empty corpus cannot pass as clean closure",
        "dogfood corpus has no pending unadopted SourceClaims in the source decision gaps readback",
        "dogfood corpus has no accepted SourceClaims missing SourceDecisionEdge readback",
        "canonical source-search queries surface at least one SourceDecisionEdge-linked supporting claim in the top 3"
      ],
      doesNotProve: [
        "source truth",
        "broad arbitrary-repo retrieval quality",
        "Codex obedience",
        "that all future source-search queries are decision-linked",
        "that dogfood DB state matches CI seed state"
      ]
    }
  };
};

const runDogfoodCorpusClosureSmoke = async (): Promise<CorpusClosureSmokeResult> => {
  const env: Record<string, string | undefined> = process.env;
  const cwd = process.cwd();
  const now = () => new Date().toISOString();
  let idCounter = 0;
  const createId = (prefix: string) => `${prefix}-corpus-closure-${++idCounter}`;

  return runCorpusClosureSmoke({
    runners: {
      sourceDecisionGaps: async () => (await runSourceDecisionGapsCommand({
        env,
        cwd,
        now,
        createId,
        command: {
          kind: "sourceDecisionGaps",
          limit: 100,
          json: true
        }
      })).stdout,
      sourceSearch: async (query) => (await runSourceSearchCommand({
        env,
        cwd,
        now,
        createId,
        command: {
          kind: "sourceSearch",
          query,
          json: true
        }
      })).stdout
    }
  });
};

if (isCliEntrypoint(import.meta.url)) {
  await writeJsonEvalResult(runDogfoodCorpusClosureSmoke);
}
