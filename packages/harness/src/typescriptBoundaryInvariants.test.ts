import {
  readdirSync,
  readFileSync,
  statSync
} from "node:fs";
import path from "node:path";

import {
  describe,
  expect,
  it
} from "vitest";

const repoRoot = path.resolve(import.meta.dirname, "../../..");
const packagesRoot = path.join(repoRoot, "packages");

const productionTypeScriptFiles = (directory: string): string[] => {
  const entries = readdirSync(directory, {
    withFileTypes: true
  });

  return entries.flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return productionTypeScriptFiles(entryPath);
    }

    if (
      entry.isFile() &&
      entryPath.endsWith(".ts") &&
      !entryPath.endsWith(".test.ts") &&
      !entryPath.endsWith(".typecheck.ts")
    ) {
      return [entryPath];
    }

    return [];
  });
};

const packageSourceFiles = (): string[] =>
  readdirSync(packagesRoot)
    .map((packageName) => path.join(packagesRoot, packageName, "src"))
    .filter((sourcePath) => {
      try {
        return statSync(sourcePath).isDirectory();
      } catch {
        return false;
      }
    })
    .flatMap((sourcePath) => productionTypeScriptFiles(sourcePath));

describe("KRN TypeScript boundary invariants", () => {
  it("keeps production package source free of unsafe casts and TS suppressions", () => {
    const findings = packageSourceFiles().flatMap((filePath) => {
      const body = readFileSync(filePath, "utf8");
      const relativePath = path.relative(repoRoot, filePath);
      const unsafePatterns = [
        /\bas any\b/u,
        /as unknown as/u,
        /@ts-ignore/u,
        /@ts-expect-error/u,
        /:\s*any\b/u
      ];

      return unsafePatterns.flatMap((pattern) =>
        pattern.test(body) ? [`${relativePath}: ${pattern.source}`] : []
      );
    });

    expect(findings).toEqual([]);
  });

  it("keeps production JSON.parse boundaries unknown-first", () => {
    const findings = packageSourceFiles().flatMap((filePath) => {
      const body = readFileSync(filePath, "utf8");
      const relativePath = path.relative(repoRoot, filePath);

      return body.split("\n").flatMap((line, index) => {
        if (!line.includes("JSON.parse")) {
          return [];
        }

        return /:\s*unknown\s*=\s*JSON\.parse/u.test(line)
          ? []
          : [`${relativePath}:${index + 1}: JSON.parse result is not assigned to unknown`];
      });
    });

    expect(findings).toEqual([]);
  });
});
