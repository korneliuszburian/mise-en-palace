import { describe, expect, it } from "vitest";

import {
  contextAssemblyStatuses,
  evidenceBundleStatuses,
  executionRunStatuses,
  feedbackDeltaStatuses,
  harnessPlanStatuses,
  operatorIntentStatuses,
  reviewAssessmentStatuses,
  taskContractStatuses
} from "@krn/core";

import * as harnessSchema from "../harness.js";

describe("harness project registration schema", () => {
  it("keeps DB harness enums aligned with the core harness model", () => {
    expect(harnessSchema.operatorIntentStatus.enumValues).toEqual(operatorIntentStatuses);
    expect(harnessSchema.taskContractStatus.enumValues).toEqual(taskContractStatuses);
    expect(harnessSchema.harnessPlanStatus.enumValues).toEqual(harnessPlanStatuses);
    expect(harnessSchema.contextAssemblyStatus.enumValues).toEqual(contextAssemblyStatuses);
    expect(harnessSchema.executionRunStatus.enumValues).toEqual(executionRunStatuses);
    expect(harnessSchema.evidenceBundleStatus.enumValues).toEqual(evidenceBundleStatuses);
    expect(harnessSchema.reviewAssessmentStatus.enumValues).toEqual(reviewAssessmentStatuses);
    expect(harnessSchema.feedbackDeltaStatus.enumValues).toEqual(feedbackDeltaStatuses);
  });

  it("exposes first-class target repo registration query fields", () => {
    expect("repoFingerprint" in harnessSchema.repoInstallations).toBe(true);
    expect("localPathHint" in harnessSchema.repoInstallations).toBe(true);
    expect(harnessSchema.repoInstallations.localPathHint.name).toBe("local_path_hint");
  });
});
