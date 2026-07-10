import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

function parseArguments(argv) {
  const rootFlagIndex = argv.indexOf("--root");
  const root = rootFlagIndex === -1 ? process.cwd() : argv[rootFlagIndex + 1];

  if (!root || root.startsWith("--")) {
    throw new Error("--root requires a directory path");
  }

  return {
    root: resolve(root),
    allowMissingRtk: argv.includes("--allow-missing-rtk"),
  };
}

function readToolchain(root) {
  const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  const declaredNode = readFileSync(join(root, ".node-version"), "utf8").trim();
  const packageManager = packageJson.packageManager;
  const declaredPnpm = typeof packageManager === "string" && packageManager.startsWith("pnpm@")
    ? packageManager.slice("pnpm@".length)
    : undefined;

  return {
    declaredNode,
    declaredPnpm,
  };
}

function commandVersion(command) {
  try {
    return execFileSync(command, ["--version"], { encoding: "utf8" }).trim();
  } catch {
    return undefined;
  }
}

function main() {
  const { root, allowMissingRtk } = parseArguments(process.argv.slice(2));
  const { declaredNode, declaredPnpm } = readToolchain(root);
  const currentNode = process.versions.node;
  const currentNodeMajor = Number(currentNode.split(".")[0]);
  const declaredNodeMajor = Number(declaredNode.split(".")[0]);
  const currentPnpm = commandVersion("pnpm");
  const currentRtk = commandVersion("rtk");
  const failures = [];

  if (!Number.isInteger(declaredNodeMajor) || declaredNodeMajor < 1) {
    failures.push(`.node-version must declare a positive Node major, got ${JSON.stringify(declaredNode)}`);
  } else if (currentNodeMajor !== declaredNodeMajor) {
    failures.push(`Node ${currentNode} is unsupported; use Node ${declaredNode} from .node-version`);
  }

  if (declaredPnpm === undefined) {
    failures.push("package.json must declare an exact pnpm@<version> packageManager");
  } else if (currentPnpm !== declaredPnpm) {
    failures.push(`pnpm ${currentPnpm ?? "not found"} is unsupported; use pnpm ${declaredPnpm}`);
  }

  if (currentRtk === undefined && !allowMissingRtk) {
    failures.push(
      "rtk is required for repository-local agent commands; install/provide the Codex rtk proxy or rerun only CI's explicit --allow-missing-rtk fallback",
    );
  }

  if (failures.length > 0) {
    console.error("Toolchain contract failed:");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(
    `Toolchain contract passed: Node ${currentNodeMajor}, pnpm ${currentPnpm}, rtk ${currentRtk ?? "missing (explicit CI fallback)"}.`,
  );
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
