import { describe, expect, it } from "vitest";

import {
  formatProjectResolutionKind,
  projectResolutionKindLabel
} from "./projectResolutionReadback.js";

describe("projectResolutionReadback", () => {
  it("labels every current project resolution kind for operator readback", () => {
    expect(projectResolutionKindLabel("explicit_project")).toBe("explicit project");
    expect(projectResolutionKindLabel("connected_repo_path")).toBe("connected repo path");
    expect(projectResolutionKindLabel("workspace_project_slug")).toBe(
      "workspace/project slug fallback"
    );
  });

  it("keeps raw kind and human label together", () => {
    expect(formatProjectResolutionKind("connected_repo_path")).toBe(
      "connected_repo_path (connected repo path)"
    );
  });
});
