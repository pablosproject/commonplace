import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import {
  decodePreviewHash,
  decodePreviewPayload,
  encodePreview,
  parseRecap,
} from "video-util";
import { validateRecap } from "../src/recap.js";

const samplesDir = fileURLToPath(
  new URL("../../../data/samples", import.meta.url),
);
const samplePaths = readdirSync(samplesDir).map(
  (id) => `${samplesDir}/${id}/video-recap-data.json`,
);

describe("encode output decodes in the web app", () => {
  test.each(samplePaths)("%s", async (samplePath) => {
    const recap = validateRecap(samplePath);
    const encoded = await encodePreview(recap);

    expect(encoded.version).toBe("1");
    expect(parseRecap(await decodePreviewHash(encoded.hash))).toEqual(
      JSON.parse(readFileSync(samplePath, "utf8")),
    );
    expect(parseRecap(await decodePreviewPayload(encoded.payload))).toEqual(recap);
  });
});
