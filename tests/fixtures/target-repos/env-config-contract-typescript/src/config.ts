export type RuntimeMode = "development" | "staging" | "production";

export interface RuntimeConfig {
  readonly mode: RuntimeMode;
  readonly port: number;
  readonly featureEnabled: boolean;
}

export type ConfigParseResult =
  | { readonly kind: "valid"; readonly config: RuntimeConfig }
  | { readonly kind: "invalid_config"; readonly reason: string };

export const parseRuntimeConfig = (
  env: Readonly<Record<string, unknown>>
): ConfigParseResult => {
  const mode = env["MODE"];
  const port = env["PORT"];

  if (mode !== "development" && mode !== "staging" && mode !== "production") {
    return { kind: "invalid_config", reason: "mode" };
  }

  if (typeof port !== "string" || !/^[0-9]+$/u.test(port)) {
    return { kind: "invalid_config", reason: "port" };
  }

  return {
    kind: "valid",
    config: {
      mode,
      port: Number(port),
      featureEnabled: env["FEATURE_ENABLED"] === "true"
    }
  };
};
