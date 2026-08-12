import { fileURLToPath } from "node:url";

export const postgresMigrationsFolder = fileURLToPath(
  new URL("./migrations", import.meta.url)
);

export const sqliteMigrationsFolder = fileURLToPath(
  new URL("./sqlite-migrations", import.meta.url)
);
