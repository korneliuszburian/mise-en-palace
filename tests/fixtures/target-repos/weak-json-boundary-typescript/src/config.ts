export type RuntimeConfig = {
  databaseUrl: string;
  defaultRole: UserRole;
};

export type UserRole = "admin" | "member";

export function readRuntimeConfig(env: Record<string, string | undefined>): RuntimeConfig {
  return {
    databaseUrl: env["DATABASE_URL"] ?? "memory://local",
    defaultRole: parseUserRole(env["DEFAULT_ROLE"]) ?? "member"
  };
}

export function parseJsonConfig(raw: string): unknown {
  return JSON.parse(raw);
}

export function parseUserRole(value: unknown): UserRole | undefined {
  return value === "admin" || value === "member" ? value : undefined;
}
