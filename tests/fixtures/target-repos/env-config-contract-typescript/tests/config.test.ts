import { strict as assert } from "node:assert";

import { parseRuntimeConfig } from "../src/config";
import { redactConfigReadback } from "../src/configReadback";

const parsed = parseRuntimeConfig({
  MODE: "production",
  PORT: "3000",
  FEATURE_ENABLED: "true"
});

assert.equal(parsed.kind, "valid");
assert.equal(parseRuntimeConfig({ MODE: "local", PORT: "3000" }).kind, "invalid_config");
assert.equal(parseRuntimeConfig({ MODE: "production", PORT: "abc" }).kind, "invalid_config");
assert.equal(redactConfigReadback({ API_TOKEN: "secret" }).API_TOKEN, "[redacted]");
