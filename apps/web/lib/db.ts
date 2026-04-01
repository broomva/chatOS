import { createDatabase } from "@chatos/db";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

export const db = createDatabase(process.env.DATABASE_URL);
