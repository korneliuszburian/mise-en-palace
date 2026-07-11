import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = fileURLToPath(new URL("../../../../", import.meta.url));
const scanner = join(repoRoot, "scripts/security-policy.mjs");

const runFailure = (args: string[]) => {
  try {
    execFileSync(process.execPath, [scanner, ...args], {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: "pipe",
    });
    return undefined;
  } catch (error) {
    return error as { status?: number; stderr?: string };
  }
};

describe("security policy scanner", () => {
  it("detects secret-shaped fixture content without treating safe content as a secret", () => {
    const root = mkdtempSync(join(tmpdir(), "krn-security-secrets-"));
    const safePath = join(root, "safe.txt");
    const secretPath = join(root, "secret.txt");

    try {
      writeFileSync(safePath, "AWS_ACCESS_KEY_ID=REDACTED\n");
      writeFileSync(secretPath, "AWS_ACCESS_KEY_ID=AKIA1234567890ABCDEF\n");

      expect(execFileSync(process.execPath, [scanner, "secrets", "--path", safePath], {
        cwd: repoRoot,
        encoding: "utf8",
      })).toContain("Security policy passed");

      const failure = runFailure(["secrets", "--path", secretPath]);
      expect(failure?.status).toBe(1);
      expect(failure?.stderr).toContain("AWS access key");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("rejects an unapproved license while accepting the reviewed dependency license set", () => {
    const root = mkdtempSync(join(tmpdir(), "krn-security-licenses-"));
    const allowedPath = join(root, "allowed.json");
    const deniedPath = join(root, "denied.json");

    try {
      writeFileSync(allowedPath, JSON.stringify({ MIT: [], "Apache-2.0": [] }));
      writeFileSync(deniedPath, JSON.stringify({ "GPL-3.0-only": [] }));

      expect(execFileSync(process.execPath, [scanner, "licenses", "--report", allowedPath], {
        cwd: repoRoot,
        encoding: "utf8",
      })).toContain("Security policy passed");

      const failure = runFailure(["licenses", "--report", deniedPath]);
      expect(failure?.status).toBe(1);
      expect(failure?.stderr).toContain("GPL-3.0-only");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("rejects high-severity dependency report fixtures and accepts a clean report", () => {
    const root = mkdtempSync(join(tmpdir(), "krn-security-dependencies-"));
    const cleanPath = join(root, "clean.json");
    const vulnerablePath = join(root, "vulnerable.json");

    try {
      writeFileSync(cleanPath, JSON.stringify({ vulnerabilities: {} }));
      writeFileSync(
        vulnerablePath,
        JSON.stringify({ vulnerabilities: { fixture: { severity: "high" } } }),
      );

      expect(execFileSync(process.execPath, [scanner, "dependency-report", "--report", cleanPath], {
        cwd: repoRoot,
        encoding: "utf8",
      })).toContain("Security policy passed");

      const failure = runFailure(["dependency-report", "--report", vulnerablePath]);
      expect(failure?.status).toBe(1);
      expect(failure?.stderr).toContain("high or critical dependency advisories");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  // fallow-ignore-next-line complexity -- one fixture exercises tracked, historical, exception, and unreadable-input branches
  it("scans tracked env examples and added-then-removed history with exact exceptions", () => {
    const root = mkdtempSync(join(tmpdir(), "krn-security-history-"));
    const exceptionPath = join(root, "packages/harness/src/observations/__tests__/observer-input.test.ts");

    try {
      const reviewedGithubToken = ["ghp_", "1234567890abcdef1234567890abcdef123456"].join("");
      const changedGithubToken = ["ghp_", "differentreviewedvalue1234567890abcdef"].join("");
      mkdirSync(join(root, "packages/harness/src/observations/__tests__"), { recursive: true });
      writeFileSync(join(root, "security-baseline.json"), readFileSync(join(repoRoot, "security-baseline.json")));
      writeFileSync(join(root, ".env.example"), "KRN_FIXTURE_SECRET=example-only\n");
      writeFileSync(exceptionPath, `output: "${reviewedGithubToken}"\n`);
      execFileSync("git", ["init", "--quiet", "--initial-branch=main"], { cwd: root });
      execFileSync("git", ["config", "user.email", "fixture@example.test"], { cwd: root });
      execFileSync("git", ["config", "user.name", "Fixture"], { cwd: root });
      execFileSync("git", ["add", "."], { cwd: root });
      execFileSync("git", ["commit", "--quiet", "-m", "base"], { cwd: root });
      const baseSha = execFileSync("git", ["rev-parse", "HEAD"], {
        cwd: root,
        encoding: "utf8",
      }).trim();

      writeFileSync(join(root, "removed.env"), "AWS_ACCESS_KEY_ID=AKIA1234567890ABCDEF\n");
      execFileSync("git", ["add", "removed.env"], { cwd: root });
      execFileSync("git", ["commit", "--quiet", "-m", "add secret"], { cwd: root });
      execFileSync("git", ["rm", "--quiet", "removed.env"], { cwd: root });
      execFileSync("git", ["commit", "--quiet", "-m", "remove secret"], { cwd: root });

      const historyFailure = runFailure(["secrets", "--root", root, "--range-base", baseSha]);
      expect(historyFailure?.status).toBe(1);
      expect(historyFailure?.stderr).toContain("removed.env: AWS access key");
      expect(historyFailure?.stderr).not.toContain("AKIA1234567890ABCDEF");

      writeFileSync(join(root, ".env.example"), `KRN_API_KEY=${reviewedGithubToken}\n`);
      const envFailure = runFailure(["secrets", "--root", root, "--range-base", baseSha]);
      expect(envFailure?.status).toBe(1);
      expect(envFailure?.stderr).toContain(".env.example: GitHub token");
      expect(envFailure?.stderr).not.toContain(reviewedGithubToken);

      writeFileSync(exceptionPath, `output: "${changedGithubToken}"\n`);
      const exceptionFailure = runFailure(["secrets", "--root", root, "--range-base", baseSha]);
      expect(exceptionFailure?.status).toBe(1);
      expect(exceptionFailure?.stderr).toContain("observer-input.test.ts: GitHub token");
      expect(exceptionFailure?.stderr).not.toContain(changedGithubToken);

      const unreadableFailure = runFailure(["secrets", "--root", root, "--path", join(root, "missing.txt")]);
      expect(unreadableFailure?.status).toBe(1);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
