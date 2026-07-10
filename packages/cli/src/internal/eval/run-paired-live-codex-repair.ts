import { writeFile } from "node:fs/promises";

import {
  runPairedRepairChecker
} from "./paired-live-codex-repair.js";

const main = async (): Promise<void> => {
  const [baselineRoot, baselineCommit, krnRoot, krnCommit, checkerRoot = process.cwd(), recordPath] =
    process.argv.slice(2);

  if (baselineRoot === undefined || baselineCommit === undefined || krnRoot === undefined || krnCommit === undefined) {
    throw new Error(
      "Usage: run-paired-live-codex-repair <baseline-root> <baseline-commit> <krn-root> <krn-commit> [checker-root]"
    );
  }

  const result = await runPairedRepairChecker({
    baseline: {
      targetRoot: baselineRoot,
      checkerRoot,
      initialCommit: baselineCommit
    },
    krn: {
      targetRoot: krnRoot,
      checkerRoot,
      initialCommit: krnCommit
    }
  });

  const output = {
    kind: "krn.pairedLiveCodexRepair.score.v1",
    ...result,
    inputs: {
      baselineRoot,
      baselineCommit,
      krnRoot,
      krnCommit,
      checkerRoot
    },
    proof: {
      proves: [
        "the KRN-owned checker compiled and exercised each target outside its target root",
        "held-out invalid JSON, missing email, and invalid role behavior was observed",
        "unknown-first, finite result, focused tests, forbidden files, and target verification were scored",
        "the paired outcome was derived from equal checker rules"
      ],
      doesNotProve: [
        "arbitrary-repository portability",
        "broad model obedience",
        "source truth or product readiness"
      ]
    }
  };

  if (recordPath !== undefined) {
    await writeFile(recordPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  }

  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
};

if (process.argv[1]?.endsWith("run-paired-live-codex-repair.ts") === true) {
  await main();
}
