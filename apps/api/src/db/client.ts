import "dotenv/config";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

const connectionString =
  process.env.DATABASE_URL ??
  "postgres://video_recaps:video_recaps@localhost:55432/video_recaps";

export type Database = PgDatabase<PgQueryResultHKT, typeof schema>;

export const sql = postgres(connectionString);
export const db = drizzle(sql, { schema });
