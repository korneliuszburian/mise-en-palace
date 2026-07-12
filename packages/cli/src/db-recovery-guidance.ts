const localDatabaseUrl = "postgres://krn:krn@localhost:54329/krn";

const localDbConfigAction =
  `export KRN_DATABASE_URL=${localDatabaseUrl}`;

const localPostgresStartAction = "docker compose up -d krn-postgres";

const localPostgresStatusAction = "docker compose ps krn-postgres";

const dbMigrateAction = "pnpm db:migrate";

const dbReadyAction = "pnpm db:ready";

const dbSmokeAction = "pnpm db:smoke";

export const missingDbConfigRecovery = (): string =>
  `${localDbConfigAction}; ${localPostgresStartAction}; ${dbMigrateAction}; ${dbReadyAction}`;

export const unreachablePostgresRecovery = (): string =>
  `${localPostgresStartAction}; ${localPostgresStatusAction}; ${dbMigrateAction}; ${dbReadyAction}`;

export const connectedButNotReadyRecovery = (): string =>
  `${dbMigrateAction}; ${dbReadyAction}; ${dbSmokeAction}`;

export const dbBootstrapDoesNotProve =
  "starting Postgres does not prove migrations, pgvector, or persistence until pnpm db:migrate, pnpm db:ready, and pnpm db:smoke pass";
