import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import { decodePreviewHash } from "../../../apps/web/src/pages/preview/previewLink";
import { buildLink } from "../scripts/recap-link.mjs";

const pipeline = fileURLToPath(
  new URL("../scripts/recap-pipeline.sh", import.meta.url),
);
const samplesDir = fileURLToPath(
  new URL("../../../data/samples/", import.meta.url),
);
const samples = readdirSync(samplesDir).map((id) => ({
  id,
  path: `${samplesDir}${id}/video-recap-data.json`,
}));
const appUrl = "http://localhost:5173/preview";

function readRecap(path: string) {
  return JSON.parse(readFileSync(path, "utf8"));
}

describe.each(samples)("sample $id", ({ path }) => {
  test("validates against the skill's JSON schema", () => {
    execFileSync(pipeline, ["validate"], {
      env: { ...process.env, DATA_JSON: path },
      stdio: "pipe",
    });
  });

  test("round-trips through the skill encoder and the web app's /preview decoder", async () => {
    const recap = readRecap(path);
    const link = buildLink(appUrl, recap);

    expect(link.startsWith(`${appUrl}#v=1&d=`)).toBe(true);
    expect(new URL(link).hash).toMatch(/^#v=1&d=[A-Za-z0-9_-]+$/);
    expect(await decodePreviewHash(new URL(link).hash)).toEqual(recap);
  });
});

test("pipeline link command prints a link the web app decodes", async () => {
  const output = execFileSync(pipeline, ["link"], {
    env: {
      ...process.env,
      DATA_JSON: samples[0].path,
      RECAP_APP_URL: appUrl,
      RECAP_NO_OPEN: "1",
      LINK_OUT: "/dev/null",
    },
    encoding: "utf8",
  });
  const link = output.trim().split("\n").at(-1)!;

  expect(await decodePreviewHash(new URL(link).hash)).toEqual(
    readRecap(samples[0].path),
  );
});

describe("the web app rejects", () => {
  test("an unknown encoding version", async () => {
    await expect(decodePreviewHash("#v=2&d=abc")).rejects.toThrow();
  });

  test("a fragment without data", async () => {
    await expect(decodePreviewHash("#v=1")).rejects.toThrow();
  });

  test("a truncated link", async () => {
    const hash = new URL(buildLink(appUrl, readRecap(samples[0].path))).hash;
    await expect(decodePreviewHash(hash.slice(0, -50))).rejects.toThrow();
  });

  test("a payload that inflates past the size limit", async () => {
    const link = buildLink(appUrl, { padding: "a".repeat(2_000_000) });
    expect(link.length).toBeLessThan(10_000);
    await expect(decodePreviewHash(new URL(link).hash)).rejects.toThrow(
      /too large/,
    );
  });

  test("a recap the schema does not accept", async () => {
    const recap = { ...readRecap(samples[0].path), schemaVersion: "2.0" };
    await expect(
      decodePreviewHash(new URL(buildLink(appUrl, recap)).hash),
    ).rejects.toThrow(/schema/);
  });
});
