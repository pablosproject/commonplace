import { PGlite } from "@electric-sql/pglite";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { createRequire } from "node:module";
import type { Database } from "../db/client.js";
import * as schema from "../db/schema.js";

const require = createRequire(import.meta.url);
const { pushSchema } = require("drizzle-kit/api") as {
  pushSchema: (
    schema: Record<string, unknown>,
    db: unknown,
  ) => Promise<{ apply: () => Promise<void> }>;
};

export const createTestDb = async () => {
  const client = new PGlite();
  const db = drizzle({ client, schema });
  const { apply } = await pushSchema(schema, db);

  await apply();

  return db as unknown as Database;
};

export const truncateAll = async (db: Database) => {
  await db.execute(
    sql`truncate table ${schema.videos}, ${schema.videoRecaps} restart identity cascade`,
  );
};
