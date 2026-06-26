export const localDatabaseUrl = "postgres://krn:krn@localhost:54329/krn";

export const localDbConfigAction =
  `export KRN_DATABASE_URL=${localDatabaseUrl}`;

export const localPostgresStartAction = "docker compose up -d krn-postgres";

export const localPostgresStatusAction = "docker compose ps krn-postgres";

export const dbReadyAction = "pnpm db:ready";

export const dbSmokeAction = "pnpm db:smoke";

export const missingDbConfigRecovery = (): string =>
  `${localDbConfigAction}; ${localPostgresStartAction}; ${dbReadyAction}`;

export const unreachablePostgresRecovery = (): string =>
  `${localPostgresStartAction}; ${localPostgresStatusAction}; ${dbReadyAction}`;

export const connectedButNotReadyRecovery = (): string =>
  `${dbReadyAction}; ${dbSmokeAction}`;

export const dbBootstrapDoesNotProve =
  "starting Postgres does not prove migrations, pgvector, or persistence until pnpm db:ready and pnpm db:smoke pass";
