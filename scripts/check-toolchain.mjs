import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { resolveScriptRoot } from "./parse-script-root.mjs";

function parseArguments(argv) {
  return {
    root: resolveScriptRoot(argv),
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

function nodeFailure(currentNode, declaredNode, declaredNodeMajor) {
  if (!Number.isInteger(declaredNodeMajor) || declaredNodeMajor < 1) {
    return `.node-version must declare a positive Node major, got ${JSON.stringify(declaredNode)}`;
  }

  return currentNode.startsWith(`${declaredNodeMajor}.`)
    ? undefined
    : `Node ${currentNode} is unsupported; use Node ${declaredNode} from .node-version`;
}

function pnpmFailure(currentPnpm, declaredPnpm) {
  if (declaredPnpm === undefined) {
    return "package.json must declare an exact pnpm@<version> packageManager";
  }

  return currentPnpm === declaredPnpm
    ? undefined
    : `pnpm ${currentPnpm ?? "not found"} is unsupported; use pnpm ${declaredPnpm}`;
}

function rtkFailure(currentRtk, allowMissingRtk) {
  return currentRtk !== undefined || allowMissingRtk
    ? undefined
    : "rtk is required for repository-local agent commands; install/provide the Codex rtk proxy or rerun only CI's explicit --allow-missing-rtk fallback";
}

function main() {
  const { root, allowMissingRtk } = parseArguments(process.argv.slice(2));
  const { declaredNode, declaredPnpm } = readToolchain(root);
  const currentNode = process.versions.node;
  const declaredNodeMajor = Number(declaredNode.split(".")[0]);
  const currentPnpm = commandVersion("pnpm");
  const currentRtk = commandVersion("rtk");
  const failures = [
    nodeFailure(currentNode, declaredNode, declaredNodeMajor),
    pnpmFailure(currentPnpm, declaredPnpm),
    rtkFailure(currentRtk, allowMissingRtk),
  ].filter((failure) => failure !== undefined);

  if (failures.length > 0) {
    console.error("Toolchain contract failed:");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(
    `Toolchain contract passed: Node ${declaredNodeMajor}, pnpm ${currentPnpm}, rtk ${currentRtk ?? "missing (explicit CI fallback)"}.`,
  );
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
