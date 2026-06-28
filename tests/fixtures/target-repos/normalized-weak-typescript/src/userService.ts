import {
  parseJsonConfig,
  parseUserRole,
  readRuntimeConfig
} from "./config.js";

export type CreatedUser = {
  id: string;
  email: string;
  role: string;
};

export type CreateUserResult =
  | {
      kind: "created";
      user: CreatedUser;
    }
  | {
      kind: "invalid_input";
      reason: "invalid_json" | "invalid_shape";
    };

type CreateUserInput = {
  email: string;
  role?: "admin" | "member";
};

const savedUsers: CreatedUser[] = [];

export function createUserFromJson(raw: string, env: Record<string, string | undefined>): CreateUserResult {
  let parsed: unknown;

  try {
    parsed = parseJsonConfig(raw);
  } catch {
    return {
      kind: "invalid_input",
      reason: "invalid_json"
    };
  }

  const input = parseCreateUserInput(parsed);

  if (!input) {
    return {
      kind: "invalid_input",
      reason: "invalid_shape"
    };
  }

  const config = readRuntimeConfig(env);

  const user = {
    id: String(Date.now()),
    email: input.email,
    role: input.role ?? config.defaultRole
  };

  savedUsers.push(user);

  return {
    kind: "created",
    user
  };
}

export function listSavedUsers(): CreatedUser[] {
  return savedUsers;
}

function parseCreateUserInput(value: unknown): CreateUserInput | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const email = value["email"];

  if (typeof email !== "string" || !email.includes("@")) {
    return undefined;
  }

  const parsedRole = parseUserRole(value["role"]);

  if ("role" in value && parsedRole === undefined) {
    return undefined;
  }

  return parsedRole ? { email, role: parsedRole } : { email };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
