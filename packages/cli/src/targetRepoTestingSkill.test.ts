import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const skillText = (): string =>
  readFileSync(
    new URL("../../../.agents/skills/target-repo-testing/SKILL.md", import.meta.url),
    "utf8"
  );

const metadataText = (): string =>
  readFileSync(
    new URL(
      "../../../.agents/skills/target-repo-testing/agents/openai.yaml",
      import.meta.url
    ),
    "utf8"
  );

describe("target-repo-testing skill", () => {
  it("keeps the target repo write boundary discoverable", () => {
    const text = skillText();

    expect(text).toContain("name: target-repo-testing");
    expect(text).toContain("description: Use when Codex is asked to inspect, test, initialize, plan, verify, or repair a target repository through KRN");
    expect(text).toContain("Target repositories are not disposable fixtures.");
    expect(text).toContain("If the user did not explicitly authorize target writes, default to");
    expect(text).toContain("`observation-only`");
    expect(text).toContain("Observation-only forbids:");
    expect(text).toContain("editing target files");
    expect(text).toContain("fixing target tests");
    expect(text).toContain("reverting target changes");
    expect(text).toContain("committing/pushing target changes");
    expect(text).toContain("calling the run second-operator proof");
  });

  it("keeps skill metadata invocable by name", () => {
    const text = metadataText();

    expect(text).toContain("display_name: \"Target Repo Testing\"");
    expect(text).toContain("short_description: \"Run KRN target-repo trials without corrupting living checkouts.\"");
    expect(text).toContain("Use $target-repo-testing");
  });
});
