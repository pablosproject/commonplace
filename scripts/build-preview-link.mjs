#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { deflateRawSync } from "node:zlib";

const DEFAULT_APP_URL = "http://localhost:5173/preview";
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..");
const SAMPLES_DIR = path.join(REPO_ROOT, "data/samples");

const [input, appUrl = process.env.RECAP_APP_URL ?? DEFAULT_APP_URL] =
  process.argv.slice(2);

if (!input) {
  console.error(
    "Usage: npm run preview:link -- <sample-id|recap-json-path> [app-url]",
  );
  console.error("\nExamples:");
  console.error("  npm run preview:link -- vS-gfLhxYDg");
  console.error(
    "  npm run preview:link -- data/samples/vS-gfLhxYDg/video-recap-data.json",
  );
  console.error(
    "  npm run preview:link -- vS-gfLhxYDg http://localhost:5173/preview",
  );
  console.error("\nAvailable sample ids:");
  for (const id of sampleIds()) {
    console.error(`  ${id}`);
  }
  process.exit(1);
}

const recapPath = resolveRecapPath(input);
const recap = JSON.parse(readFileSync(recapPath, "utf8"));
const payload = deflateRawSync(Buffer.from(JSON.stringify(recap), "utf8"), {
  level: 9,
}).toString("base64url");

console.log(`${appUrl}#v=1&d=${payload}`);

function resolveRecapPath(value) {
  const asPath = path.resolve(value);
  if (existsSync(asPath) && statSync(asPath).isFile()) {
    return asPath;
  }

  const asSample = path.join(SAMPLES_DIR, value, "video-recap-data.json");
  if (existsSync(asSample)) {
    return asSample;
  }

  console.error(`Could not find sample id or recap JSON path: ${value}`);
  process.exit(1);
}

function sampleIds() {
  if (!existsSync(SAMPLES_DIR)) {
    return [];
  }

  return readdirSync(SAMPLES_DIR)
    .filter((name) =>
      existsSync(path.join(SAMPLES_DIR, name, "video-recap-data.json")),
    )
    .sort();
}
