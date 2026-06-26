import { describe, expect, it } from "vitest";

import {
  formatTargetRepoHarnessSmokeReport
} from "./targetRepoHarnessSmoke.js";

describe("targetRepoHarnessSmoke", () => {
  it("formats target repo harness smoke proof", () => {
    const output = formatTargetRepoHarnessSmokeReport({
      workspaceSlug: "krn-target-repo-harness-smoke-1",
      projectId: "project-1",
      repoInstallationId: "repo-installation-1",
      projectKernelId: "project-kernel-1",
      sourceSeedPaths: ["AGENTS.md", "README.md", "docs", "src", "tests"],
      ownerFilePaths: ["AGENTS.md", "docs/target-runbook.md", "src/index.ts", "tests/readiness.test.ts"],
      trustExclusionPatterns: [".env*", ".git/", "node_modules/", ".muke/", ".supersearch/runtime/", "dist/", "build/"],
      executionRunId: "execution-run-1",
      readBackExecutionRunId: "execution-run-1",
      codexBriefRendered: true,
      evidenceBundleId: "evidence-bundle-1",
      reviewAssessmentId: "review-assessment-1",
      feedbackDeltaId: "feedback-delta-1",
      targetProjectLinked: true,
      remainingMarkerCount: 0,
      cleanedUp: true
    });

    expect(output).toContain("KRN Target Repo Harness Smoke");
    expect(output).toContain("Project: project-1");
    expect(output).toContain("Repo installation: repo-installation-1");
    expect(output).toContain("ProjectKernel: project-kernel-1");
    expect(output).toContain("Target source seeds: AGENTS.md, README.md, docs, src, tests");
    expect(output).toContain("Target owner files: AGENTS.md, docs/target-runbook.md, src/index.ts, tests/readiness.test.ts");
    expect(output).toContain("Target trust exclusions: .env*, .git/, node_modules/, .muke/, .supersearch/runtime/, dist/, build/");
    expect(output).toContain("Execution run: execution-run-1");
    expect(output).toContain("Readback: matched");
    expect(output).toContain("Codex brief rendered: yes");
    expect(output).toContain("Evidence bundle: evidence-bundle-1");
    expect(output).toContain("Review assessment: review-assessment-1");
    expect(output).toContain("Feedback delta: feedback-delta-1");
    expect(output).toContain("Target project linked: yes");
    expect(output).toContain("Cleanup remaining marker count: 0");
    expect(output).toContain("Target repo harness smoke: passed");
  });
});
