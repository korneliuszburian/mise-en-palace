import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type { CommandResult, HeldOutArmScore, TargetChangeManifest } from "./paired-live-codex-repair.js";
import type { HeldOutRunCommand } from "./held-out-target-state.js";

export const frontendCommandPassed = (result: CommandResult): boolean => result.exitCode === 0;

export const skippedFrontendCommand = (command: string, reason: string): CommandResult => ({
  command,
  args: [],
  exitCode: null,
  stdout: "",
  stderr: reason,
  durationMs: 0
});

export const readOptionalFrontendFile = async (root: string, path: string): Promise<string> => {
  try {
    return await readFile(join(root, path), "utf8");
  } catch {
    return "";
  }
};

export type FrontendBrowserObservation = {
  readonly id: string;
  readonly width: number;
  readonly height: number;
  readonly document: string;
};

export const renderFrontendObservationDocument = (
  html: string,
  css: string,
  script: string,
  textScalePercent: number
): string => html
  .replace("</head>", `<style>${css.replaceAll("</style", "<\\/style")}html{font-size:${textScalePercent}%}body{margin:0}</style></head>`)
  .replace("</body>", `<script>${script}</script></body>`);

export const createFrontendBrowserObservations = (input: {
  readonly counts: readonly number[];
  readonly widths: readonly number[];
  readonly height: number;
  readonly documentForCount: (count: number) => string;
}): readonly FrontendBrowserObservation[] => input.counts.flatMap((count) =>
  input.widths.map((width) => ({
    id: `${count}-${width}`,
    width,
    height: input.height,
    document: input.documentForCount(count)
  }))
);

export const invalidFrontendPreflightScore = (
  commandName: string,
  changeManifest: TargetChangeManifest
): HeldOutArmScore => {
  const command = skippedFrontendCommand(commandName, "target preflight violated identity or write ownership");
  return {
    status: "invalid",
    score: 0,
    checks: [{ name: "preflight", passed: false, details: "Target identity, staging state, or preregistered write ownership was violated before checking." }],
    changedFiles: changeManifest.changedFiles,
    changeManifest,
    commands: { test: command, typecheck: command, diffCheck: command },
    runtimeCommand: command
  };
};

export const runFrontendBrowserObservations = async (input: {
  readonly checkerRoot: string;
  readonly runCommand: HeldOutRunCommand;
  readonly filePrefix: string;
  readonly observations: readonly FrontendBrowserObservation[];
  readonly timeoutMs: number;
}): Promise<{
  readonly command: CommandResult;
  readonly stdoutById: ReadonlyMap<string, string>;
}> => {
  const scratchRoot = await mkdtemp(join(tmpdir(), `${input.filePrefix}-`));
  const stdoutById = new Map<string, string>();
  const processFailures: string[] = [];
  let durationMs = 0;
  try {
    for (const observation of input.observations) {
      const documentPath = join(scratchRoot, `${observation.id}.html`);
      await writeFile(documentPath, observation.document, "utf8");
      const browser = await input.runCommand("chromium", [
        "--headless=new",
        "--no-sandbox",
        "--disable-gpu",
        "--disable-background-networking",
        "--host-resolver-rules=MAP * 0.0.0.0",
        `--window-size=${observation.width},${observation.height}`,
        "--virtual-time-budget=1000",
        "--dump-dom",
        `file://${documentPath}`
      ], input.checkerRoot, { timeoutMs: input.timeoutMs });
      durationMs += browser.durationMs ?? 0;
      if (frontendCommandPassed(browser)) stdoutById.set(observation.id, browser.stdout);
      else processFailures.push(observation.id);
    }
  } finally {
    await rm(scratchRoot, { recursive: true, force: true });
  }
  return {
    command: {
      command: `${input.filePrefix}-browser-observer`,
      args: input.observations.map((observation) => observation.id),
      exitCode: processFailures.length === 0 ? 0 : 1,
      stdout: "",
      stderr: processFailures.join(", "),
      durationMs
    },
    stdoutById
  };
};
