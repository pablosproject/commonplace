import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { db, sql } from "./client.js";
import { recapSchema } from "../schemas/recaps.js";
import { ingestRecap } from "../services/ingest-recap.js";

const currentFile = fileURLToPath(import.meta.url);
const apiDir = path.resolve(path.dirname(currentFile), "../..");
const repoRoot = path.resolve(apiDir, "../..");
const samplePath = path.join(
  repoRoot,
  "data/samples/wc8FBhQtdsA/video-recap-data.json",
);

const recap = recapSchema.parse(JSON.parse(await readFile(samplePath, "utf8")));

await ingestRecap(db, recap);

await sql.end();

console.log(`Seeded ${recap.video.id}`);
