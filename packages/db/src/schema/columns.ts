import { sql } from "drizzle-orm/sql";
import {
  jsonb,
  timestamp
} from "drizzle-orm/pg-core";
import { customType } from "drizzle-orm/pg-core/columns/custom";

export type JsonObject = Record<string, unknown>;
export type JsonList = unknown[];

export const emptyJsonObject = sql`'{}'::jsonb`;
export const emptyJsonList = sql`'[]'::jsonb`;

export const jsonObjectColumn = <TName extends string>(name: TName) =>
  jsonb(name).$type<JsonObject>().notNull().default(emptyJsonObject);

export const jsonListColumn = <TName extends string>(name: TName) =>
  jsonb(name).$type<JsonList>().notNull().default(emptyJsonList);

export const requiredJsonListColumn = <TName extends string>(name: TName) =>
  jsonb(name).$type<JsonList>().notNull();

export const byteaColumn = customType<{
  data: Uint8Array;
  driverData: Uint8Array;
}>({
  dataType() {
    return "bytea";
  }
});

export const metadataColumn = () => jsonObjectColumn("metadata");

export const createdAtColumn = () =>
  timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const updatedAtColumn = () =>
  timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();
