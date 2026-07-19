import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = fileURLToPath(new URL("../../../../", import.meta.url));
const validator = join(repoRoot, "scripts/validate-beads-history.mjs");
const currentIssues = join(repoRoot, ".beads/issues.jsonl");
const currentInteractions = join(repoRoot, ".beads/interactions.jsonl");

const runValidator = (mode: string, issues: string, interactions: string) =>
  execFileSync(process.execPath, [
    validator,
    mode,
    "--issues",
    issues,
    "--interactions",
    interactions,
  ], { cwd: repoRoot, encoding: "utf8" });

const runFailure = (mode: string, issues: string, interactions: string) => {
  try {
    runValidator(mode, issues, interactions);
    return undefined;
  } catch (error) {
    return error as { status?: number; stderr?: string };
  }
};

describe("Beads history policy", () => {
  it("validates the current history and preserves active graph semantics on round-trip", () => {
    expect(runValidator("validate", currentIssues, currentInteractions)).toContain("Beads validation passed");
    expect(runValidator("roundtrip", currentIssues, currentInteractions)).toContain("Beads round-trip passed");
  });

  it("rejects malformed, duplicate, dangling, and sensitive history fixtures", () => {
    const root = mkdtempSync(join(tmpdir(), "krn-beads-history-"));
    const issues = join(root, "issues.jsonl");
    const interactions = join(root, "interactions.jsonl");
    const validIssue = {
      _type: "issue",
      id: "issue-1",
      status: "open",
      priority: 2,
      labels: ["audit"],
      dependencies: [],
    };

    try {
      writeFileSync(issues, `${JSON.stringify(validIssue)}\n`);
      writeFileSync(interactions, `${JSON.stringify({ id: "interaction-1", kind: "note", issue_id: "issue-1" })}\n`);
      expect(runValidator("validate", issues, interactions)).toContain("Beads validation passed");

      writeFileSync(issues, "not-json\n");
      expect(runFailure("validate", issues, interactions)?.status).toBe(1);

      writeFileSync(issues, `${JSON.stringify(validIssue)}\n${JSON.stringify(validIssue)}\n`);
      expect(runFailure("validate", issues, interactions)?.stderr).toContain("duplicate issue id");

      writeFileSync(issues, JSON.stringify({ ...validIssue, dependencies: [{ issue_id: "issue-1", depends_on_id: "missing", type: "blocks" }] }));
      expect(runFailure("validate", issues, interactions)?.stderr).toContain("dangling");

      writeFileSync(issues, JSON.stringify({
        ...validIssue,
        description: 'password: "not-a-real-secret-123456789"'
      }));
      const sensitiveFailure = runFailure("validate", issues, interactions);
      expect(sensitiveFailure?.status).toBe(1);
      expect(sensitiveFailure?.stderr).toContain("sensitive value pattern");

      writeFileSync(issues, JSON.stringify({
        ...validIssue,
        description: "store=postgres://operator:secret@db.example/krn"
      }));
      const postgresFailure = runFailure("validate", issues, interactions);
      expect(postgresFailure?.status).toBe(1);
      expect(postgresFailure?.stderr).toContain("sensitive value pattern");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

});
