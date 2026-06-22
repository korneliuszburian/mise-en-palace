import {
  runCli
} from "./runCli.js";

export * from "./parseArgs.js";
export * from "./runDbReadinessCommand.js";
export * from "./runDbSmokeCommand.js";
export * from "./runCodexBriefCommand.js";
export * from "./runDoctorCommand.js";
export * from "./runEvidenceCaptureCommand.js";
export * from "./runCli.js";
export * from "./runInitCommand.js";
export * from "./runPlanCommand.js";
export * from "./runSourceClaimAddCommand.js";
export * from "./runSourceClaimRejectCommand.js";
export * from "./runSourceDecisionLinkCommand.js";

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
