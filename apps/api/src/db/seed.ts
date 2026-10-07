import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { db, sql } from "./client.js";
import { parseRecap } from "@commonplace/video-util";
import { ingestRecap } from "../services/ingest-recap.js";

const currentFile = fileURLToPath(import.meta.url);
const apiDir = path.resolve(path.dirname(currentFile), "../..");
const repoRoot = path.resolve(apiDir, "../..");
const samplesDir = path.join(repoRoot, "data/samples");

const sampleDirs = (await readdir(samplesDir, { withFileTypes: true })).filter(
  (entry) => entry.isDirectory(),
);
const recaps = await Promise.all(
  sampleDirs.map(async (sampleDir) => {
    const samplePath = path.join(
      samplesDir,
      sampleDir.name,
      "video-recap-data.json",
    );

    return parseRecap(JSON.parse(await readFile(samplePath, "utf8")));
  }),
);

for (const recap of recaps) {
  await ingestRecap(db, recap);
}

await sql.end();

console.log(`Seeded ${recaps.length} recaps`);
