export type RuntimeConfig = {
  databaseUrl: string;
  defaultRole: string;
};

export function readRuntimeConfig(env: Record<string, string | undefined>): RuntimeConfig {
  return {
    databaseUrl: env["DATABASE_URL"] ?? "memory://local",
    defaultRole: env["DEFAULT_ROLE"] ?? "admin"
  };
}

export function parseJsonConfig(raw: string): any {
  return JSON.parse(raw);
}
