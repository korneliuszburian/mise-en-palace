import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { resolveScriptRoot } from "./parse-script-root.mjs";

const REQUIRED_SCRIPTS = ["test", "typecheck"];
const WORKSPACE_PACKAGE_ROOT = "packages";

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

function missingScripts(manifest) {
  return REQUIRED_SCRIPTS.filter(
    (scriptName) => typeof manifest.scripts?.[scriptName] !== "string",
  );
}

function main() {
  const root = resolveScriptRoot(process.argv.slice(2));
  const packages = readWorkspacePackages(root);
  const violations = packages.flatMap(({ manifestPath, manifest }) => {
    const missing = missingScripts(manifest);

    return missing.length === 0
      ? []
      : [`${manifest.name ?? manifestPath}: missing ${missing.join(", ")}`];
  });

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
