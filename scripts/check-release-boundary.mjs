import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { resolveScriptRoot } from "./parse-script-root.mjs";

const readManifest = (path) => JSON.parse(readFileSync(path, "utf8"));

const packageManifestPaths = (root) => {
  const packageRoot = join(root, "packages");
  const packagePaths = existsSync(packageRoot)
    ? readdirSync(packageRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => join(packageRoot, entry.name, "package.json"))
      .filter((path) => existsSync(path))
    : [];

  return [join(root, "package.json"), ...packagePaths.sort()];
};

const main = () => {
  const root = resolveScriptRoot(process.argv.slice(2));
  const manifests = packageManifestPaths(root).map((path) => ({
    path,
    manifest: readManifest(path)
  }));
  const blocked = manifests.filter(({ manifest }) =>
    manifest.private === true || manifest.version === "0.0.0"
  );

  if (blocked.length > 0) {
    console.error("Release boundary blocked: this repository is an internal alpha.");
    console.error("- Publication and package dry-runs are disabled while source packages are private/0.0.0.");
    console.error("- Keep the current no-license posture; do not present these packages as stable.");
    for (const { path, manifest } of blocked) {
      console.error(`- ${manifest.name ?? path}: private=${String(manifest.private)} version=${String(manifest.version)}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log("Release boundary passed: manifests are no longer internal-alpha private/0.0.0 packages.");
};

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
