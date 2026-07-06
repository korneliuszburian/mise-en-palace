import { customType } from "drizzle-orm/pg-core/columns/custom";

export const tsvector = customType<{ data: string; driverData: string }>({
  dataType() {
    return "tsvector";
  }
});
