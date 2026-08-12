import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  out: "./src/sqlite-migrations",
  schema: "./src/schema/sqlite/index.ts",
  strict: true,
  verbose: true
});
