// CLI: tsx recap-link.ts <recap.json> <appUrl>

import { readFileSync, realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  LINK_VERSION,
  buildPreviewLink,
  encodePreviewPayload,
} from "./preview-link.js";

export { LINK_VERSION };
export const encodeRecap = encodePreviewPayload;
export const buildLink = buildPreviewLink;

if (realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [, , dataPath, appUrl] = process.argv;
  if (!dataPath || !appUrl) {
    console.error("Usage: tsx recap-link.ts <recap.json> <appUrl>");
    process.exit(1);
  }
  console.log(
    await buildLink(appUrl, JSON.parse(readFileSync(dataPath, "utf8"))),
  );
}
