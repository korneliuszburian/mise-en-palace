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

describe("KRN source map invariants", () => {
  it("keeps every retained source tied to a full source-to-decision mapping", () => {
    const missing = sourceSections().flatMap((section) => {
      const findings: string[] = [];

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
