import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const REQUIRED_SCRIPTS = ["test", "typecheck"];
const WORKSPACE_PACKAGE_ROOT = "packages";

function parseArguments(argv) {
  const rootFlagIndex = argv.indexOf("--root");
  const root = rootFlagIndex === -1 ? process.cwd() : argv[rootFlagIndex + 1];

  if (!root || root.startsWith("--")) {
    throw new Error("--root requires a directory path");
  }

  return resolve(root);
}

function readWorkspacePackages(root) {
  const packagesRoot = join(root, WORKSPACE_PACKAGE_ROOT);
  return readdirSync(packagesRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(packagesRoot, entry.name, "package.json"))
    .filter((manifestPath) => {
      try {
        return statSync(manifestPath).isFile();
      } catch {
        return false;
      }
    })
    .map((manifestPath) => ({
      manifestPath,
      manifest: JSON.parse(readFileSync(manifestPath, "utf8")),
    }))
    .filter(({ manifestPath }) => {
      const packageRoot = join(manifestPath, "..");
      return statSync(join(packageRoot, "src"), { throwIfNoEntry: false })?.isDirectory();
    });
}

function main() {
  const root = parseArguments(process.argv.slice(2));
  const packages = readWorkspacePackages(root);
  const violations = [];

  for (const { manifestPath, manifest } of packages) {
    const missingScripts = REQUIRED_SCRIPTS.filter(
      (scriptName) => typeof manifest.scripts?.[scriptName] !== "string",
    );

    if (missingScripts.length > 0) {
      violations.push(
        `${manifest.name ?? manifestPath}: missing ${missingScripts.join(", ")}`,
      );
    }
  }

  if (violations.length > 0) {
    console.error("Workspace script contract failed:");
    for (const violation of violations) {
      console.error(`- ${violation}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(
    `Workspace script contract passed for ${packages.length} source package${packages.length === 1 ? "" : "s"}.`,
  );
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
