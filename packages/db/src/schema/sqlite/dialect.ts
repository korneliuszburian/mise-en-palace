import { sql } from "drizzle-orm";
import {
  check,
  integer,
  text,
  type AnySQLiteColumn
} from "drizzle-orm/sqlite-core";

const quoteLiteral = (value: string): string => `'${value.replaceAll("'", "''")}'`;

export const sqliteNow = sql`(unixepoch('subsec') * 1000)`;

export const sqliteUuidDefault = sql`(
  lower(hex(randomblob(4))) || '-' ||
  lower(hex(randomblob(2))) || '-4' ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  substr('89ab', abs(random()) % 4 + 1, 1) ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  lower(hex(randomblob(6)))
)`;

export const uuid = <TName extends string>(name: TName) => text(name).$type<string>();

export const timestamp = <TName extends string>(
  name: TName,
  _config?: { readonly withTimezone?: boolean }
) => integer(name, { mode: "timestamp_ms" });

export const boolean = <TName extends string>(name: TName) =>
  integer(name, { mode: "boolean" });

export const bigint = <TName extends string>(
  name: TName,
  _config: { readonly mode: "number" }
) => integer(name, { mode: "number" });

export const jsonb = <TName extends string>(name: TName) =>
  text(name, { mode: "json" });

// Schema mirror only. sqlite-vec attachment and vector search belong to task 1.4.
export const vector = <TName extends string>(
  name: TName,
  _config: { readonly dimensions: number }
) => text(name, { mode: "json" }).$type<number[]>();

// SQLite lexical retrieval will attach to its dialect-specific search mechanism later.
export const tsvector = <TName extends string>(name: TName) => text(name);

export const sqliteEnum = <const TValues extends readonly [string, ...string[]]>(
  _enumName: string,
  values: TValues
) => <TName extends string>(name: TName) => text(name, { enum: values });

export const enumChecks = <TColumns extends Record<string, AnySQLiteColumn>>(
  tableName: string,
  columns: TColumns
) => Object.values(columns).flatMap((column) => {
  const values = column.enumValues;

  if (values === undefined || values.length === 0) {
    return [];
  }

  const allowed = values.map(quoteLiteral).join(", ");

  return [check(
    `${tableName}_${column.name}_enum_check`,
    sql`${column} in (${sql.raw(allowed)})`
  )];
});
