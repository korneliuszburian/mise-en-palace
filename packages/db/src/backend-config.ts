import path from "node:path";

export const backendKinds = ["sqlite", "postgres"] as const;

export type BackendKind = (typeof backendKinds)[number];

export interface BackendConfigInput {
  readonly backend?: string;
  readonly databaseUrl?: string;
  readonly dbPath?: string;
  readonly env: Readonly<Record<string, string | undefined>>;
  readonly targetWorkspace: string;
}

export type BackendConfig =
  | {
      readonly kind: "sqlite";
      readonly dbPath: string;
      readonly storeIdentity: string;
    }
  | {
      readonly kind: "postgres";
      readonly databaseUrl?: string;
      readonly storeIdentity: string;
    };

const nonEmpty = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim();
  return trimmed === undefined || trimmed.length === 0 ? undefined : trimmed;
};

const explicitValue = (value: string | undefined, option: string): string | undefined => {
  if (value === undefined) {
    return undefined;
  }

  const parsed = nonEmpty(value);

  if (parsed === undefined) {
    throw new Error(`${option} requires a non-empty value`);
  }

  return parsed;
};

export const parseBackendKind = (value: string | undefined): BackendKind | undefined => {
  const candidate = nonEmpty(value);

  if (candidate === undefined) {
    return undefined;
  }

  if (candidate === "sqlite" || candidate === "postgres") {
    return candidate;
  }

  throw new Error(`Unsupported KRN database backend: ${candidate}`);
};

const sqlitePath = (candidate: string, targetWorkspace: string): string =>
  path.isAbsolute(candidate) ? path.normalize(candidate) : path.resolve(targetWorkspace, candidate);

const assertGovernedKrnPath = (dbPath: string, targetWorkspace: string): void => {
  const krnDirectory = path.join(targetWorkspace, ".krn");
  const relative = path.relative(krnDirectory, dbPath);
  const insideKrnDirectory = relative === "" ||
    (!relative.startsWith(`..${path.sep}`) && relative !== "..");

  if (insideKrnDirectory && relative !== "memory.db") {
    throw new Error(
      `SQLite paths under ${krnDirectory} must use the governed artifact ${path.join(krnDirectory, "memory.db")}`
    );
  }
};

const postgresStoreIdentity = (databaseUrl: string | undefined): string => {
  if (databaseUrl === undefined) {
    return "postgres:unconfigured";
  }

  try {
    const parsed = new URL(databaseUrl);
    const port = parsed.port.length > 0 ? parsed.port : "5432";
    const database = parsed.pathname.replace(/^\//u, "") || "default";
    return `${parsed.protocol}//${parsed.hostname}:${port}/${database}`;
  } catch {
    return "postgres:unparseable-url";
  }
};

export const resolveBackendConfig = (input: BackendConfigInput): BackendConfig => {
  const kind = parseBackendKind(explicitValue(input.backend, "--backend")) ??
    parseBackendKind(input.env.KRN_DB_BACKEND) ??
    "sqlite";

  if (kind === "postgres") {
    if (input.dbPath !== undefined) {
      explicitValue(input.dbPath, "--db-path");
      throw new Error("--db-path is only valid with the sqlite backend");
    }

    const databaseUrl = nonEmpty(input.databaseUrl) ?? nonEmpty(input.env.KRN_DATABASE_URL);

    return {
      kind,
      ...(databaseUrl === undefined ? {} : { databaseUrl }),
      storeIdentity: postgresStoreIdentity(databaseUrl)
    };
  }

  const selectedPath = explicitValue(input.dbPath, "--db-path") ??
    nonEmpty(input.env.KRN_DB_PATH) ??
    path.join(input.targetWorkspace, ".krn", "memory.db");
  const dbPath = sqlitePath(selectedPath, input.targetWorkspace);
  assertGovernedKrnPath(dbPath, input.targetWorkspace);

  return {
    kind,
    dbPath,
    storeIdentity: `sqlite:${dbPath}`
  };
};
