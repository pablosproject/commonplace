import {
  copyFileSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import {
  decodePreviewHash,
  decodePreviewPayload,
  encodePreview,
  parseRecap,
} from "@commonplace/video-util";
import { runYoutubeRecapCommand } from "../src/command.js";
import { getRecap } from "../src/recap.js";

const samplesDir = fileURLToPath(
  new URL("../../../data/samples", import.meta.url),
);
const samplePaths = readdirSync(samplesDir).map(
  (id) => `${samplesDir}/${id}/video-recap-data.json`,
);

describe("encode output decodes in the web app", () => {
  test.each(samplePaths)("%s", async (samplePath) => {
    const recap = getRecap({
      workDir: dirname(samplePath),
      dataJson: basename(samplePath),
    });
    const encoded = await encodePreview(recap);

    expect(encoded.version).toBe("1");
    expect(parseRecap(await decodePreviewHash(encoded.hash))).toEqual(
      JSON.parse(readFileSync(samplePath, "utf8")),
    );
    expect(parseRecap(await decodePreviewPayload(encoded.payload))).toEqual(
      recap,
    );
  });
});

describe("preview link URL", () => {
  let workDir: string;

  beforeEach(() => {
    workDir = mkdtempSync(join(tmpdir(), "commonplace-cli-"));
    copyFileSync(samplePaths[0], join(workDir, "video-recap-data.json"));
  });

  afterEach(() => {
    rmSync(workDir, { recursive: true, force: true });
  });

  test("uses the Commonplace app by default", async () => {
    const result = await runYoutubeRecapCommand(
      ["link"],
      { RECAP_NO_OPEN: "1" },
      workDir,
    );

    expect(result.stdout).toMatch(
      /^https:\/\/commonplace\.video\/preview#v=1&d=/,
    );
    expect(readFileSync(join(workDir, "preview_url.txt"), "utf8").trim()).toBe(
      result.stdout,
    );
  });

  test("allows the app URL to be overridden", async () => {
    const result = await runYoutubeRecapCommand(
      ["link"],
      {
        RECAP_APP_URL: "http://localhost:5173/preview",
        RECAP_NO_OPEN: "1",
      },
      workDir,
    );

    expect(result.stdout).toMatch(/^http:\/\/localhost:5173\/preview#v=1&d=/);
  });
});
