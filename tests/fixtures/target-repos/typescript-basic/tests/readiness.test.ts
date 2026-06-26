import { readiness } from "../src/index.js";

if (!readiness.hasTestScript) {
  throw new Error("Fixture readiness should expose a test script.");
}

