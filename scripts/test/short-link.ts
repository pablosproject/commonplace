#!/usr/bin/env node
import { spawn } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildShortLinkUrl,
  createShortLinkResponseSchema,
  encryptRecap,
  parseRecap,
} from "@commonplace/video-util";

const DEFAULT_SHARE_URL = "http://localhost:8787";
const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
);
const SAMPLES_DIR = path.join(REPO_ROOT, "data/samples");

const args = process.argv.slice(2);
const shouldOpen = !args.includes("--no-open");
const [input, shareUrl = process.env.RECAP_SHARE_URL ?? DEFAULT_SHARE_URL] =
  args.filter((arg) => arg !== "--no-open");

if (!input) {
  console.error(
    "Usage: npm run short:link -- <sample-id|recap-json-path> [share-url] [--no-open]",
  );
  console.error("\nExamples:");
  console.error("  npm run short:link -- vS-gfLhxYDg");
  console.error(
    "  npm run short:link -- path/to/video-recap-data.json --no-open",
  );
  console.error("\nAvailable sample ids:");
  for (const id of sampleIds()) {
    console.error(`  ${id}`);
  }
  process.exit(1);
}

const recap = parseRecap(
  JSON.parse(readFileSync(resolveRecapPath(input), "utf8")),
);
const { data, key } = await encryptRecap(recap);
const response = await fetch(`${shareUrl}/api/r`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ data }),
});

if (!response.ok) {
  console.error(`${response.status}: ${await response.text()}`);
  process.exit(1);
}

const { id, ownerSecret, expiresAt } = createShortLinkResponseSchema.parse(
  await response.json(),
);
const manageLink = buildShortLinkUrl(shareUrl, id, key, ownerSecret);
console.log(`Expires: ${expiresAt}`);
console.log(`Share:   ${buildShortLinkUrl(shareUrl, id, key)}`);
console.log(`Manage:  ${manageLink}`);

if (shouldOpen) {
  const opener = process.platform === "darwin" ? "open" : "xdg-open";
  spawn(opener, [manageLink], { detached: true, stdio: "ignore" }).unref();
}

function resolveRecapPath(value: string): string {
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

function sampleIds(): string[] {
  return readdirSync(SAMPLES_DIR)
    .filter((name) =>
      existsSync(path.join(SAMPLES_DIR, name, "video-recap-data.json")),
    )
    .sort();
}
