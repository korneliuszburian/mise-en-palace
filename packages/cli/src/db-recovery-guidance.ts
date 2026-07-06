const localDatabaseUrl = "postgres://krn:krn@localhost:54329/krn";

const localDbConfigAction =
  `export KRN_DATABASE_URL=${localDatabaseUrl}`;

const localPostgresStartAction = "docker compose up -d krn-postgres";

const localPostgresStatusAction = "docker compose ps krn-postgres";

const dbReadyAction = "pnpm db:ready";

const dbSmokeAction = "pnpm db:smoke";

export const missingDbConfigRecovery = (): string =>
  `${localDbConfigAction}; ${localPostgresStartAction}; ${dbReadyAction}`;

export const unreachablePostgresRecovery = (): string =>
  `${localPostgresStartAction}; ${localPostgresStatusAction}; ${dbReadyAction}`;

export const connectedButNotReadyRecovery = (): string =>
  `${dbReadyAction}; ${dbSmokeAction}`;

export const dbBootstrapDoesNotProve =
  "starting Postgres does not prove migrations, pgvector, or persistence until pnpm db:ready and pnpm db:smoke pass";
