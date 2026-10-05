// Encodes a recap into a preview link: <appUrl>#v=1&d=<payload>.
// Payload (v=1): minified JSON -> UTF-8 -> deflate-raw -> base64url without padding.
// The website decodes it with reference/decode-recap-link.ts.
//
// CLI: node recap-link.mjs <recap.json> <appUrl>

import { readFileSync } from "node:fs";
import { deflateRawSync } from "node:zlib";
import { fileURLToPath } from "node:url";

export const LINK_VERSION = "1";

export function encodeRecap(recap) {
  const bytes = Buffer.from(JSON.stringify(recap), "utf8");
  return deflateRawSync(bytes, { level: 9 }).toString("base64url");
}

export function buildLink(appUrl, recap) {
  return `${appUrl}#v=${LINK_VERSION}&d=${encodeRecap(recap)}`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [, , dataPath, appUrl] = process.argv;
  if (!dataPath || !appUrl) {
    console.error("Usage: node recap-link.mjs <recap.json> <appUrl>");
    process.exit(1);
  }
  console.log(buildLink(appUrl, JSON.parse(readFileSync(dataPath, "utf8"))));
}
