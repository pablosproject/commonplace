#!/usr/bin/env node
import { spawn } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildLink } from "../skills/youtube-recap/scripts/recap-link.mjs";

const DEFAULT_APP_URL = "http://localhost:5173/preview";
const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const SAMPLES_DIR = path.join(REPO_ROOT, "data/samples");

const args = process.argv.slice(2);
const shouldOpen = !args.includes("--no-open");
const [input, appUrl = process.env.RECAP_APP_URL ?? DEFAULT_APP_URL] =
  args.filter((arg) => arg !== "--no-open");

if (!input) {
  console.error(
    "Usage: npm run preview:link -- <sample-id|recap-json-path> [app-url] [--no-open]",
  );
  console.error("\nExamples:");
  console.error("  npm run preview:link -- vS-gfLhxYDg");
  console.error(
    "  npm run preview:link -- path/to/video-recap-data.json --no-open",
  );
  console.error(
    "  npm run preview:link -- vS-gfLhxYDg https://video-recap.pages.dev/preview",
  );
  console.error("\nAvailable sample ids:");
  for (const id of sampleIds()) {
    console.error(`  ${id}`);
  }
  process.exit(1);
}

const link = buildLink(
  appUrl,
  JSON.parse(readFileSync(resolveRecapPath(input), "utf8")),
);
console.log(link);

if (shouldOpen) {
  const opener = process.platform === "darwin" ? "open" : "xdg-open";
  spawn(opener, [link], { detached: true, stdio: "ignore" }).unref();
}

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
  return readdirSync(SAMPLES_DIR)
    .filter((name) =>
      existsSync(path.join(SAMPLES_DIR, name, "video-recap-data.json")),
    )
    .sort();
}
