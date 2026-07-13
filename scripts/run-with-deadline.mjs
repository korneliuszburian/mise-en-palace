import { spawn } from "node:child_process";
import process from "node:process";

const parseMilliseconds = (value, name) => {
  const milliseconds = Number(value);
  if (!Number.isInteger(milliseconds) || milliseconds <= 0) {
    throw new Error(`${name} must be a positive integer in milliseconds`);
  }
  return milliseconds;
};

const parseArguments = (argv) => {
  const commandSeparator = argv.indexOf("--");
  if (commandSeparator === -1 || commandSeparator === argv.length - 1) {
    throw new Error("run-with-deadline requires a command after --");
  }

  const optionValue = (option, fallback) => {
    const index = argv.indexOf(option);
    if (index === -1) return fallback;
    const value = argv[index + 1];
    if (value === undefined || value === "--") {
      throw new Error(`${option} requires a value`);
    }
    return parseMilliseconds(value, option);
  };

  return {
    timeoutMs: optionValue("--timeout-ms", 120_000),
    graceMs: optionValue("--grace-ms", 10_000),
    command: argv.slice(commandSeparator + 1).join(" "),
  };
};

const signalNumber = (signal) => ({ SIGTERM: 15, SIGKILL: 9 }[signal] ?? 1);

const terminateProcessGroup = (child, signal) => {
  if (child.pid === undefined) return;

  try {
    if (process.platform === "win32") {
      child.kill(signal);
    } else {
      process.kill(-child.pid, signal);
    }
  } catch (error) {
    if (error?.code !== "ESRCH") throw error;
  }
};

const run = ({ timeoutMs, graceMs, command }) => new Promise((resolve, reject) => {
  const shell = process.platform === "win32" ? process.env.ComSpec ?? "cmd.exe" : process.env.SHELL ?? "/bin/sh";
  const shellArguments = process.platform === "win32"
    ? ["/d", "/s", "/c", command]
    : ["-c", command];
  const child = spawn(shell, shellArguments, {
    cwd: process.cwd(),
    detached: process.platform !== "win32",
    stdio: "inherit",
    windowsHide: true,
  });
  let timedOut = false;
  let deadlineTimer;
  let killTimer;

  const clearTimers = () => {
    clearTimeout(deadlineTimer);
    clearTimeout(killTimer);
  };

  deadlineTimer = setTimeout(() => {
    timedOut = true;
    terminateProcessGroup(child, "SIGTERM");
    killTimer = setTimeout(() => terminateProcessGroup(child, "SIGKILL"), graceMs);
  }, timeoutMs);

  child.once("error", (error) => {
    clearTimers();
    reject(error);
  });

  child.once("close", (code, signal) => {
    clearTimers();
    if (timedOut) {
      resolve(124);
      return;
    }
    resolve(signal === null ? code ?? 1 : 128 + signalNumber(signal));
  });
});

try {
  process.exitCode = await run(parseArguments(process.argv.slice(2)));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
