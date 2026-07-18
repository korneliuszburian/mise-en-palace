import { parseRuntimeConfig } from "../src/config.js";
import { redactConfigReadback } from "../src/configReadback.js";

const assertEqual = (actual: unknown, expected: unknown): void => {
  if (actual !== expected) {
    throw new Error(`Expected ${String(expected)}, received ${String(actual)}`);
  }
};

const parsed = parseRuntimeConfig({
  MODE: "production",
  PORT: "3000",
  FEATURE_ENABLED: "true"
});

assertEqual(parsed.kind, "valid");
assertEqual(parseRuntimeConfig({ MODE: "local", PORT: "3000" }).kind, "invalid_config");
assertEqual(parseRuntimeConfig({ MODE: "production", PORT: "abc" }).kind, "invalid_config");
assertEqual(redactConfigReadback({ API_TOKEN: "secret" }).API_TOKEN, "[redacted]");
