import { sql } from "drizzle-orm/sql";
import { customType, text } from "drizzle-orm/sqlite-core";

import {
  sqliteNow,
  timestamp
} from "./dialect.js";

export type JsonObject = Record<string, unknown>;
export type JsonList = unknown[];

export const emptyJsonObject = sql`'{}'`;
export const emptyJsonList = sql`'[]'`;

// PostgreSQL JSONB is represented by SQLite TEXT with Drizzle JSON mapping.
export const jsonObjectColumn = <TName extends string>(name: TName) =>
  text(name, { mode: "json" }).$type<JsonObject>().notNull().default(emptyJsonObject);

export const jsonListColumn = <TName extends string>(name: TName) =>
  text(name, { mode: "json" }).$type<JsonList>().notNull().default(emptyJsonList);

export const requiredJsonListColumn = <TName extends string>(name: TName) =>
  text(name, { mode: "json" }).$type<JsonList>().notNull();

// PostgreSQL BYTEA maps to a SQLite BLOB while preserving Uint8Array at the seam.
export const byteaColumn = customType<{
  data: Uint8Array;
  driverData: Uint8Array;
}>({
  dataType() {
    return "blob";
  }
});

export const metadataColumn = () => jsonObjectColumn("metadata");

export const createdAtColumn = () =>
  timestamp("created_at", { withTimezone: true }).notNull().default(sqliteNow);

export const updatedAtColumn = () =>
  timestamp("updated_at", { withTimezone: true }).notNull().default(sqliteNow);
