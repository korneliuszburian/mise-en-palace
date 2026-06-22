import { describe, expect, it } from "vitest";
import type {
  ObservationItem,
  TaskContract
} from "@krn/core";

import { selectObservationPrefix } from "./observationPrefix.js";

const now = "2026-06-22T12:00:00.000Z";

const task: TaskContract = {
  id: "task-1",
  operatorIntentId: "intent-1",
  projectId: "project-1",
  title: "Add observe run CLI",
  objective: "Build manual observe run command for observation staging",
  constraints: ["no MemoryRecord mutation"],
  nonGoals: ["no observer worker", "no dashboard"],
  acceptance: ["observation group is created", "MemoryRecord is not created"],
  status: "active",
  metadata: {},
  createdAt: now,
  updatedAt: now
};

const observation = (
  overrides: Partial<ObservationItem>
): ObservationItem => ({
  id: "observation-1",
  groupId: "group-1",
  scope: {
    projectId: "project-1"
  },
  kind: "fact",
  status: "candidate",
  priority: "medium",
  confidence: "medium",
  provenanceKind: "run_event",
  subject: "observe run CLI",
  summary: "Observe run command creates observation staging records.",
  body: "The command does not create MemoryRecord rows.",
  temporalScope: {
    observedAt: now,
    ingestedAt: now,
    validFrom: now
  },
  sourceRanges: [{
    id: "range-1",
    sourceType: "run_event",
    sourceId: "run-event-1",
    locator: "run_events.sequence:1",
    capturedAt: now
  }],
  entityLinks: [],
  claimLinks: [],
  metadata: {},
  createdAt: now,
  updatedAt: now,
  ...overrides
});

describe("observation prefix selector", () => {
  it("selects a small high-signal prefix with reasons", () => {
    const prefix = selectObservationPrefix({
      task,
      projectId: "project-1",
      observations: [
        observation({
          id: "low",
          subject: "navbar color",
          summary: "Navbar color note",
          body: "Unrelated visual detail.",
          priority: "low",
          confidence: "low"
        }),
        observation({
          id: "high",
          priority: "high",
          confidence: "high"
        })
      ],
      maxItems: 1,
      now
    });

    expect(prefix.items).toEqual([expect.objectContaining({
      observationId: "high",
      reason: expect.stringContaining("matched task terms")
    })]);
    expect(prefix.exclusions).toEqual([expect.objectContaining({
      observationId: "low",
      reason: "low_relevance"
    })]);
    expect(prefix.text).toContain("Observe run command creates observation staging records.");
  });

  it("excludes high priority high confidence observations with no task relation", () => {
    const prefix = selectObservationPrefix({
      task,
      projectId: "project-1",
      observations: [
        observation({
          id: "urgent-unrelated",
          priority: "critical",
          confidence: "high",
          subject: "deployment outage",
          summary: "Production deploy requires incident commander approval.",
          body: "Release operations require incident commander approval."
        }),
        observation({
          id: "relevant-low-priority",
          priority: "low",
          confidence: "low",
          subject: "observe run",
          summary: "Observation group is created by observe run.",
          body: "The command creates source-ranged observation staging records."
        })
      ],
      now
    });

    expect(prefix.items).toEqual([expect.objectContaining({
      observationId: "relevant-low-priority"
    })]);
    expect(prefix.exclusions).toEqual([expect.objectContaining({
      observationId: "urgent-unrelated",
      reason: "low_relevance"
    })]);
  });

  it("excludes invalidated stale and cross-project observations", () => {
    const prefix = selectObservationPrefix({
      task,
      projectId: "project-1",
      observations: [
        observation({ id: "invalidated", status: "invalidated" }),
        observation({
          id: "stale",
          temporalScope: {
            observedAt: now,
            ingestedAt: now,
            validUntil: "2026-06-01T00:00:00.000Z"
          }
        }),
        observation({
          id: "other-project",
          scope: {
            projectId: "project-2"
          }
        }),
        observation({
          id: "unscoped",
          scope: {}
        })
      ],
      now
    });

    expect(prefix.items).toHaveLength(0);
    expect(prefix.exclusions.map((exclusion) => exclusion.reason)).toEqual([
      "invalidated",
      "stale",
      "project_mismatch",
      "project_mismatch"
    ]);
  });
});
