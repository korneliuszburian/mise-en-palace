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
