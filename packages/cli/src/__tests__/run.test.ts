import { describe, expect, it } from "vitest";

import {
  runCliEntrypoint
} from "../index.js";
import {
  runCli
} from "../run-cli.js";
import {
  now
} from "./helpers/test-runtime.js";

const runTestCli = (args: readonly string[]) =>
  runCli(args, {
    env: {},
    now: () => now,
    createId: (prefix) => `${prefix}-1`
  });

describe("runCli", () => {
  it("rejects the removed public audit command", async () => {
    const result = await runTestCli(["audit", "repo"]);

    expect(result.exitCode).toBe(2);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("Unsupported command: audit");
    expect(result.stderr).not.toContain("krn audit");
  });

  it("prints run show DB requirements in help", async () => {
    const result = await runTestCli(["run", "--help"]);

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Usage: krn run show --run-id <execution-run-id> [--json]");
    expect(result.stdout).toContain("requires: KRN_DATABASE_URL and a persisted execution run");
    expect(result.stdout).toContain("verify DB first: pnpm db:migrate && pnpm db:ready");
  });

  it("explains how to unblock run show without database config", async () => {
    const result = await runTestCli(["run", "show", "--run-id", "execution-run-1"]);

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("KRN_DATABASE_URL is required for krn run show");
    expect(result.stderr).toContain(
      "Next action: export KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn and run pnpm db:migrate && pnpm db:ready before readback"
    );
    expect(result.stderr).toContain(
      "Does not prove: setting KRN_DATABASE_URL does not prove the requested run exists, commands executed, or Memory Core mutated"
    );
  });

  it("groups public, governed admin, and internal dev commands in help", async () => {
    const result = await runTestCli(["--help"]);

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Public operator commands:");
    expect(result.stdout).toContain("Governed admin commands:");
    expect(result.stdout).toContain("Internal/dev commands:");
    expect(result.stdout).toContain("krn db --help");
    expect(result.stdout).toContain("decision-corpus-import");
    expect(result.stdout).toContain("real-recall-advantage");
    expect(result.stdout).toContain(
      "DB readiness/smoke commands prove local runtime plumbing only"
    );
    expect(result.stdout).not.toContain("krn audit");
  });

  it("prints supported top-level command help without treating usage as an error", async () => {
    const commands = [
      {
        args: ["--help"],
        usage: "Public operator commands:"
      },
      {
        args: ["-h"],
        usage: "Public operator commands:"
      },
      {
        args: ["plan", "--help"],
        usage: "Usage: krn plan --task"
      },
      {
        args: ["plan", "-h"],
        usage: "Usage: krn plan --task"
      },
      {
        args: ["evidence", "--help"],
        usage: "Usage: krn evidence capture"
      },
      {
        args: ["evidence", "-h"],
        usage: "Usage: krn evidence capture"
      },
      {
        args: ["evidence", "capture", "--help"],
        usage: "Usage: krn evidence capture"
      },
      {
        args: ["evidence", "capture", "-h"],
        usage: "Usage: krn evidence capture"
      },
      {
        args: ["run", "--help"],
        usage: "Usage: krn run show"
      },
      {
        args: ["run", "-h"],
        usage: "Usage: krn run show"
      },
      {
        args: ["decision", "--help"],
        usage: "Usage: krn decision packet"
      },
      {
        args: ["decision", "-h"],
        usage: "Usage: krn decision packet"
      },
      {
        args: ["decision", "packet", "--help"],
        usage: "Usage: krn decision packet"
      },
      {
        args: ["decision", "packet", "-h"],
        usage: "Usage: krn decision packet"
      },
      {
        args: ["db", "--help"],
        usage: "Usage: krn db migrate|readiness|smoke"
      },
      {
        args: ["db", "-h"],
        usage: "Usage: krn db migrate|readiness|smoke"
      },
      {
        args: ["memory", "--help"],
        usage: "Usage: krn memory search"
      },
      {
        args: ["memory", "-h"],
        usage: "Usage: krn memory search"
      },
      {
        args: ["memory", "search", "--help"],
        usage: "Usage: krn memory search"
      },
      {
        args: ["memory", "search", "-h"],
        usage: "Usage: krn memory search"
      },
      {
        args: ["memory", "recall", "--help"],
        usage: "Usage: krn memory recall"
      },
      {
        args: ["memory", "recall", "-h"],
        usage: "Usage: krn memory recall"
      },
      {
        args: ["maintenance", "--help"],
        usage: "Usage: krn maintenance preview"
      },
      {
        args: ["maintenance", "-h"],
        usage: "Usage: krn maintenance preview"
      },
      {
        args: ["observe", "--help"],
        usage: "Usage: krn observe --run"
      },
      {
        args: ["observe", "-h"],
        usage: "Usage: krn observe --run"
      },
      {
        args: ["reflect", "--help"],
        usage: "Usage: krn reflect --scope"
      },
      {
        args: ["reflect", "-h"],
        usage: "Usage: krn reflect --scope"
      },
      {
        args: ["source", "search", "--help"],
        usage: "Usage: krn source search"
      },
      {
        args: ["source", "search", "-h"],
        usage: "Usage: krn source search"
      },
      {
        args: ["source", "artifact", "preview", "--help"],
        usage: "Usage: krn source artifact preview"
      },
      {
        args: ["source", "artifact", "preview", "-h"],
        usage: "Usage: krn source artifact preview"
      },
      {
        args: ["memory", "candidate", "add", "--help"],
        usage: "Usage: krn memory candidate add"
      },
      {
        args: ["memory", "candidate", "add", "-h"],
        usage: "Usage: krn memory candidate add"
      },
      {
        args: ["review", "--help"],
        usage: "Usage: krn review assess"
      },
      {
        args: ["review", "-h"],
        usage: "Usage: krn review assess"
      }
    ] as const;

    for (const command of commands) {
      const result = await runTestCli(command.args);

      expect(result.exitCode).toBe(0);
      expect(result.stderr).toBe("");
      expect(result.stdout).toContain(command.usage);
    }
  });

  it("keeps unsupported top-level help paths explicit instead of silently widening help", async () => {
    const commands = [
      {
        args: ["init", "--help"],
        usage: "Usage: krn init --dry-run"
      },
      {
        args: ["doctor", "--help"],
        usage: "Usage: krn doctor"
      },
      {
        args: ["codex", "--help"],
        usage: "Usage: krn codex brief"
      },
      {
        args: ["source", "--help"],
        usage: "Usage: krn source artifact preview"
      },
    ] as const;

    for (const command of commands) {
      const result = await runTestCli(command.args);

      expect(result.exitCode).toBe(2);
      expect(result.stdout).toBe("");
      expect(result.stderr).toContain(command.usage);
    }
  });

  it("keeps invalid top-level command arguments on the usage-as-error path", async () => {
    const commands = [
      {
        args: ["plan", "--bogus"],
        usage: "Usage: krn plan"
      },
      {
        args: ["evidence", "capture", "--bad-flag"],
        usage: "Usage: krn evidence capture"
      },
      {
        args: ["observe", "--run"],
        usage: "--run requires a value"
      },
      {
        args: ["reflect", "--scope"],
        usage: "--scope requires a value"
      },
      {
        args: ["review", "--bogus"],
        usage: "Usage: krn review assess"
      }
    ] as const;

    for (const command of commands) {
      const result = await runTestCli(command.args);

      expect(result.exitCode).toBe(2);
      expect(result.stdout).toBe("");
      expect(result.stderr).toContain(command.usage);
    }
  });

  it("prints a controlled failure when the process entrypoint sees an unexpected error", async () => {
    const stdout: string[] = [];
    const stderr: string[] = [];

    const exitCode = await runCliEntrypoint(
      ["db", "readiness"],
      {
        env: {},
        now: () => now,
        createId: (prefix) => `${prefix}-1`
      },
      {
        stdout: { write: (chunk) => { stdout.push(chunk); } },
        stderr: { write: (chunk) => { stderr.push(chunk); } }
      },
      async () => {
        throw new Error("simulated entrypoint failure");
      }
    );

    expect(exitCode).toBe(1);
    expect(stdout).toEqual([]);
    expect(stderr.join("")).toBe("KRN CLI failed: simulated entrypoint failure\n");
  });
});
