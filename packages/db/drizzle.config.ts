import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.KRN_DATABASE_URL?.trim();

export default defineConfig({
  dialect: "postgresql",
  ...(databaseUrl === undefined || databaseUrl.length === 0
    ? {}
    : {
        dbCredentials: {
          url: databaseUrl
        }
      }),
  out: "./src/migrations",
  schema: "./src/schema/index.ts",
  strict: true,
  verbose: true
});
