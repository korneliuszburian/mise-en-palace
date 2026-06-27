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
    const missing = sourceSections().flatMap((section) => {
      const findings: string[] = [];

      const locations = sourceLocations(section.body);

      if (locations.length === 0) {
        findings.push(`${section.title}: missing URL/URLs`);
      }

      for (const location of locations) {
        if (!location.startsWith("https://")) {
          findings.push(`${section.title}: source location must be https URL`);
        }
      }

      if (!/^- Trust tier: (high|medium|low)\.$/mu.test(section.body)) {
        findings.push(`${section.title}: missing Trust tier`);
      }

      if (
        !/^- Source class: (official docs|papers|high-quality public course page|practitioner writing|competitor docs|repo-local evidence|target-repo evidence|user-provided research)\.$/mu.test(
          section.body
        )
      ) {
        findings.push(`${section.title}: missing Source class`);
      }

      if (!/^- Decision kind: (adopt|reject|lab_test|defer)\.$/mu.test(section.body)) {
        findings.push(`${section.title}: missing Decision kind`);
      }

      if (!/^- Mechanism: .+/mu.test(section.body)) {
        findings.push(`${section.title}: missing Mechanism`);
      }

      if (!/^- KRN implication: .+/mu.test(section.body)) {
        findings.push(`${section.title}: missing KRN implication`);
      }

      if (!/^- Decision: .+/mu.test(section.body)) {
        findings.push(`${section.title}: missing Decision`);
      }

      if (!/^- Consumer: .+/mu.test(section.body)) {
        findings.push(`${section.title}: missing Consumer`);
      }

      if (!/^- Falsifier: .+/mu.test(section.body)) {
        findings.push(`${section.title}: missing Falsifier`);
      }

      if (!/^- Does not prove: .+/mu.test(section.body)) {
        findings.push(`${section.title}: missing Does not prove`);
      }

      return findings;
    });

    expect(missing).toEqual([]);
  });
});
