import {
  describe,
  expect,
  it
} from "vitest";
import {
  commandOutputArtifactStreamByteCap
} from "@krn/core";
import {
  runBoundedCommand
} from "../bounded-command-execution.js";

describe("runBoundedCommand", () => {
  it("keeps exact totals while bounding both stored stream prefixes", async () => {
    const stdoutTotal = commandOutputArtifactStreamByteCap + 19;
    const stderrTotal = commandOutputArtifactStreamByteCap + 23;
    const execution = await runBoundedCommand(process.execPath, [
      "-e",
      `process.stdout.write("s".repeat(${stdoutTotal}));process.stderr.write("e".repeat(${stderrTotal}));`
    ], process.cwd());

    expect(execution.exitCode).toBe(0);
    expect(execution.stdout).toHaveLength(commandOutputArtifactStreamByteCap);
    expect(execution.stdoutTotalByteCount).toBe(stdoutTotal);
    expect(execution.stderr).toHaveLength(commandOutputArtifactStreamByteCap);
    expect(execution.stderrTotalByteCount).toBe(stderrTotal);
    expect(Date.parse(execution.completedAt)).toBeGreaterThanOrEqual(
      Date.parse(execution.startedAt)
    );
    expect(JSON.stringify(execution)).not.toContain("ssssssssssssssss");
    expect(JSON.stringify(execution)).not.toContain("eeeeeeeeeeeeeeee");
  });

  it("settles near the deadline when the child ignores SIGTERM", async () => {
    const execution = await runBoundedCommand(process.execPath, [
      "-e",
      "process.on('SIGTERM',()=>{});setTimeout(()=>process.exit(0),500);"
    ], process.cwd(), { timeoutMs: 150 });

    expect(execution.timedOut).toBe(true);
    expect(execution.exitCode).toBeNull();
    expect(execution.durationMs).toBeLessThan(400);
  });
});
