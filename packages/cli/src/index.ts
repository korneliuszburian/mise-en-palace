import {
  runCli
} from "./run-cli.js";

export {
  runCli
} from "./run-cli.js";
export type {
  CliResult,
  CliRuntime
} from "./run-cli.js";

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await runCli(process.argv.slice(2), {
    env: process.env
  });

  if (result.stdout.length > 0) {
    process.stdout.write(result.stdout);
    if (!result.stdout.endsWith("\n")) {
      process.stdout.write("\n");
    }
  }

  if (result.stderr.length > 0) {
    process.stderr.write(result.stderr);
  }

  process.exitCode = result.exitCode;
}
