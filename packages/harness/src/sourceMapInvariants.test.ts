import { readFileSync } from "node:fs";

import {
  describe,
  expect,
  it
} from "vitest";

const sourceMapPath = new URL("../../../docs/KRN_SOURCES.md", import.meta.url);

interface SourceSection {
  title: string;
  body: string;
}

interface SectionExpectation {
  title: string;
  includes: readonly string[];
}

const sourceSections = (): SourceSection[] => {
  const sourceMap = readFileSync(sourceMapPath, "utf8");
  const sections: SourceSection[] = [];
  const sectionPattern = /^### (?<title>.+)$/gmu;
  const matches = [...sourceMap.matchAll(sectionPattern)];

  for (const [index, match] of matches.entries()) {
    const title = match.groups?.title;

    if (title === undefined) {
      continue;
    }

    const start = match.index + match[0].length;
    const next = matches[index + 1]?.index ?? sourceMap.length;
    sections.push({
      title,
      body: sourceMap.slice(start, next)
    });
  }

  return sections;
};

const sourceLocations = (body: string): string[] => {
  const inlineUrl = body.match(/^- URL: (?<url>\S+)$/mu)?.groups?.url;

  if (inlineUrl !== undefined) {
    return [inlineUrl];
  }

  const blockUrl = body.match(/^- URL:\n\s+(?<url>\S+)$/mu)?.groups?.url;

  if (blockUrl !== undefined) {
    return [blockUrl];
  }

  const urlsBlock = body.match(/^- URLs:\n(?<urls>(?:\s+- .+\n?)+)/mu)?.groups?.urls;

  if (urlsBlock === undefined) {
    return [];
  }

  return urlsBlock
    .split("\n")
    .map((line) => line.match(/^\s+- (?<url>\S+)$/u)?.groups?.url)
    .filter((url): url is string => url !== undefined);
};

const requiredSourceDecisionFields = [
  {
    label: "Trust tier",
    pattern: /^- Trust tier: (high|medium|low)\.$/mu
  },
  {
    label: "Source class",
    pattern: /^- Source class: (official docs|papers|high-quality public course page|practitioner writing|competitor docs|repo-local evidence|target-repo evidence|user-provided research)\.$/mu
  },
  {
    label: "Decision kind",
    pattern: /^- Decision kind: (adopt|reject|lab_test|defer)\.$/mu
  },
  {
    label: "Mechanism",
    pattern: /^- Mechanism: .+/mu
  },
  {
    label: "KRN implication",
    pattern: /^- KRN implication: .+/mu
  },
  {
    label: "Decision",
    pattern: /^- Decision: .+/mu
  },
  {
    label: "Consumer",
    pattern: /^- Consumer: .+/mu
  },
  {
    label: "Falsifier",
    pattern: /^- Falsifier: .+/mu
  },
  {
    label: "Does not prove",
    pattern: /^- Does not prove: .+/mu
  }
] as const;

const sourceLocationFindings = (section: SourceSection): string[] => {
  const locations = sourceLocations(section.body);
  const missingLocation =
    locations.length === 0 ? [`${section.title}: missing URL/URLs`] : [];
  const nonHttpsLocations = locations
    .filter((location) => !location.startsWith("https://"))
    .map(() => `${section.title}: source location must be https URL`);

  return [
    ...missingLocation,
    ...nonHttpsLocations
  ];
};

const sourceDecisionFieldFindings = (section: SourceSection): string[] =>
  requiredSourceDecisionFields.flatMap((field) =>
    field.pattern.test(section.body) ? [] : [`${section.title}: missing ${field.label}`]
  );

const sourceDecisionMappingFindings = (section: SourceSection): string[] => [
  ...sourceLocationFindings(section),
  ...sourceDecisionFieldFindings(section)
];

const sourceBody = (title: string): string | undefined =>
  sourceSections().find((section) => section.title === title)?.body;

const expectSectionIncludes = (expectation: SectionExpectation): void => {
  const body = sourceBody(expectation.title);

  for (const expected of expectation.includes) {
    expect(body).toContain(expected);
  }
};

describe("KRN source map invariants", () => {
  it("keeps the retained source map intro tied to a consumer before falsifier", () => {
    const sourceMap = readFileSync(sourceMapPath, "utf8");

    expect(sourceMap).toContain(
      "source -> mechanism -> KRN implication -> decision/rejection -> consumer -> falsifier"
    );
    expect(sourceMap).toContain("Every retained source must also name source class");
    expect(sourceMap).toContain("what it does not prove");
  });

  it("keeps every retained source tied to a full source-to-decision mapping", () => {
    const missing = sourceSections().flatMap(sourceDecisionMappingFindings);

    expect(missing).toEqual([]);
  });

  it("keeps iterative repair loops mapped to current evidence and feedback surfaces", () => {
    const source = sourceSections().find((section) => section.title === "Iterative Repair Loops");

    expect(source?.body).toContain("evidence");
    expect(source?.body).toContain("review assessment");
    expect(source?.body).toContain("feedback delta");
    expect(source?.body).toContain("bounded repair loop tasks");
    expect(source?.body).toContain("`PLANS.md` next-task synthesis");
    expect(source?.body).not.toContain("review capture");
    expect(source?.body).not.toContain("later dogfood starts with `krn doctor`");
  });

  it("keeps official Codex process sources tied to executable KRN consumers", () => {
    const expectations: SectionExpectation[] = [
      {
        title: "Goals In Codex",
        includes: [
          "GOAL.md",
          "current execution contract",
          "compact",
          "becomes a ledger/backlog"
        ]
      },
      {
        title: "ExecPlans",
        includes: [
          "PLANS.md",
          "PLAN.md",
          "fresh Codex continuation",
          "without broad rereads or stale completed slices"
        ]
      },
      {
        title: "Codex Prompting Guide",
        includes: [
          "non-goals",
          "allowed writes",
          "forbidden writes",
          "verification",
          "proof/non-proof boundaries",
          "rollback",
          "next-task synthesis",
          "every small edit"
        ]
      }
    ];

    for (const expectation of expectations) {
      expectSectionIncludes(expectation);
    }
  });
});
