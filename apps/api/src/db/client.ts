import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

const connectionString =
  process.env.DATABASE_URL ??
  "postgres://video_recaps:video_recaps@localhost:5432/video_recaps";

export const sql = postgres(connectionString);
export const db = drizzle(sql, { schema });
