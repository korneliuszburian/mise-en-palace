import {
  parseJsonConfig,
  readRuntimeConfig
} from "./config.js";

export type CreatedUser = {
  id: string;
  email: string;
  role: string;
};

const savedUsers: CreatedUser[] = [];

export function createUserFromJson(raw: string, env: Record<string, string | undefined>): CreatedUser | null {
  const input = parseJsonConfig(raw);
  const config = readRuntimeConfig(env);

  if (!input.email) {
    return null;
  }

  const user = {
    id: String(Date.now()),
    email: String(input.email),
    role: input.role ?? config.defaultRole
  };

  savedUsers.push(user);

  return user;
}

export function listSavedUsers(): CreatedUser[] {
  return savedUsers;
}
