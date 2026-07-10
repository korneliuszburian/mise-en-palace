import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
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
});
