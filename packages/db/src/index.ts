import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export function createDatabase(connectionString: string) {
  const sql = postgres(connectionString);
  return drizzle(sql, { schema });
}

export * from "./queries";
export * from "./schema";
