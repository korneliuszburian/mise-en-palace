import { readFileSync } from "node:fs";

import {
  describe,
  expect,
  it
} from "vitest";

const readRootFile = (path: string): string =>
  readFileSync(new URL(`../../../${path}`, import.meta.url), "utf8");

describe("KRN security trust boundary invariants", () => {
  it("keeps Codex permission profile source aligned to the security boundary", () => {
    const sourceMap = readRootFile("docs/KRN_SOURCES.md");
    const securityBoundary = readRootFile("docs/architecture/security-trust-boundaries.md");

    expect(sourceMap).toContain("### Permissions And Security");
    expect(sourceMap).toContain("https://developers.openai.com/codex/permissions");
    expect(sourceMap).toContain("https://developers.openai.com/codex/agent-approvals-security");
    expect(sourceMap).toContain("do not mix permission profiles and legacy sandbox settings");
    expect(sourceMap).toContain("broader execution/network authority without explicit proof and rollback");

    expect(securityBoundary).toContain("source_id: codex-permissions-and-security");
    expect(securityBoundary).toContain("Codex permission profile boundary");
    expect(securityBoundary).toContain("docs/KRN_SOURCES.md#permissions-and-security");
    expect(securityBoundary).toContain("permission profiles replace older sandbox settings");
    expect(securityBoundary).toContain("do not mix permission profiles and legacy sandbox settings");
    expect(securityBoundary).toContain("consumer: this security/trust-boundary document");
    expect(securityBoundary).toContain("does_not_prove: broad access is acceptable for speed");
  });

  it("keeps future external/runtime surfaces behind explicit permission posture", () => {
    const securityBoundary = readRootFile("docs/architecture/security-trust-boundaries.md");

    expect(securityBoundary).toContain("Any future MCP, hook, worker executor, connector, or target-write slice");
    expect(securityBoundary).toContain("permission profile, network posture, approval mode, allowed writes, rollback, and falsifier");
    expect(securityBoundary).toContain("without explicit permission profile, approval mode, rollback, and proof/non-proof boundary");
    expect(securityBoundary).not.toContain("broad access is acceptable for implementation speed");
    expect(securityBoundary).not.toContain("build MCP now");
    expect(securityBoundary).not.toContain("build worker runtime now");
  });
});
