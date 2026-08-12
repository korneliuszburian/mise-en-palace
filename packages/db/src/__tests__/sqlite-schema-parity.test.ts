import { isTable } from "drizzle-orm";
import {
  getTableConfig as getPgTableConfig,
  type PgTable
} from "drizzle-orm/pg-core";
import {
  getTableConfig as getSqliteTableConfig,
  type SQLiteTable
} from "drizzle-orm/sqlite-core";
import { describe, expect, it } from "vitest";

import * as pgSchema from "../schema/index.js";
import * as sqliteSchema from "../schema/sqlite/index.js";

const dialectOnlyIndexes = new Set([
  "embeddings_embedding_hnsw_idx",
  "search_documents_search_vector_idx"
]);

const tableValues = (schema: Record<string, unknown>) =>
  Object.values(schema).filter(isTable);

describe("SQLite schema parity", () => {
  it("mirrors the PostgreSQL tables, columns, constraints, and portable indexes", () => {
    const pgTables = tableValues(pgSchema).map((table) => getPgTableConfig(table as PgTable));
    const sqliteTables = tableValues(sqliteSchema)
      .map((table) => getSqliteTableConfig(table as SQLiteTable));
    const sqliteByName = new Map(sqliteTables.map((table) => [table.name, table]));

    expect(pgTables).toHaveLength(51);
    expect(sqliteTables).toHaveLength(51);
    expect(pgTables.reduce((count, table) => count + table.columns.length, 0)).toBe(666);
    expect(sqliteTables.reduce((count, table) => count + table.columns.length, 0)).toBe(666);

    for (const pgTable of pgTables) {
      const sqliteTable = sqliteByName.get(pgTable.name);
      expect(sqliteTable, `missing SQLite table ${pgTable.name}`).toBeDefined();

      expect(sqliteTable?.columns.map((column) => ({
        name: column.name,
        notNull: column.notNull,
        primary: column.primary,
        hasDefault: column.hasDefault
      }))).toEqual(pgTable.columns.map((column) => ({
        name: column.name,
        notNull: column.notNull,
        primary: column.primary,
        hasDefault: column.hasDefault
      })));

      const expectedIndexes = pgTable.indexes
        .map((index) => index.config.name)
        .filter((name) => !dialectOnlyIndexes.has(name))
        .sort();
      expect(sqliteTable?.indexes.map((index) => index.config.name).sort()).toEqual(expectedIndexes);
      expect(sqliteTable?.foreignKeys.map((foreignKey) => foreignKey.getName()).sort())
        .toEqual(pgTable.foreignKeys.map((foreignKey) => foreignKey.getName()).sort());
      expect(sqliteTable?.uniqueConstraints.map((constraint) => constraint.name).sort())
        .toEqual(pgTable.uniqueConstraints.map((constraint) => constraint.name).sort());

      const pgCheckNames = pgTable.checks.map((check) => check.name).sort();
      const sqliteCheckNames = sqliteTable?.checks.map((check) => check.name).sort() ?? [];
      expect(sqliteCheckNames).toEqual(expect.arrayContaining(pgCheckNames));
    }

    expect(pgTables.reduce((count, table) => count + table.indexes.length, 0)).toBe(215);
    expect(sqliteTables.reduce((count, table) => count + table.indexes.length, 0)).toBe(213);
    expect(pgTables.reduce((count, table) => count + table.foreignKeys.length, 0)).toBe(115);
    expect(sqliteTables.reduce((count, table) => count + table.foreignKeys.length, 0)).toBe(115);
    expect(pgTables.reduce((count, table) => count + table.checks.length, 0)).toBe(69);
    expect(sqliteTables.reduce((count, table) => count + table.checks.length, 0)).toBe(133);
    expect(sqliteTables.flatMap((table) => table.checks)
      .filter((constraint) => constraint.name.endsWith("_enum_check"))).toHaveLength(63);
    expect(sqliteTables.flatMap((table) => table.checks).map((constraint) => constraint.name))
      .toContain("embeddings_embedding_dimensions");
  });
});
