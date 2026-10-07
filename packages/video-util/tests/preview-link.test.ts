import { describe, expect, test } from "vitest";
import {
  decodePreviewHash,
  encodePreview,
  parseRecap,
  type Recap,
} from "../src/index";

const point = {
  time: "00:00:01",
  seconds: 1,
  title: "Example point",
  description: "Example description",
};

const recap: Recap = {
  schemaVersion: "1.0",
  video: {
    id: "abcdefghijk",
    url: "https://www.youtube.com/watch?v=abcdefghijk",
    title: "Example",
  },
  abstract: "Short summary",
  mainTakeaway: "Main point",
  highlights: [point],
  sections: [{ title: "Example section", points: [point] }],
  conclusion: "Done",
};

describe("preview links", () => {
  test("round-trips an encoded value", async () => {
    const encoded = await encodePreview(recap);

    expect(encoded.hash).toMatch(/^#v=1&d=[A-Za-z0-9_-]+$/);
    expect(await decodePreviewHash(encoded.hash)).toEqual(recap);
  });

  test("encodes structured preview payload details", async () => {
    const encoded = await encodePreview(recap);

    expect(encoded.version).toBe("1");
    expect(encoded.hash).toBe(`#v=1&d=${encoded.payload}`);
    expect(await decodePreviewHash(encoded.hash)).toEqual(recap);
  });

  test("rejects unsupported or incomplete fragments", async () => {
    await expect(decodePreviewHash("#v=2&d=abc")).rejects.toThrow();
    await expect(decodePreviewHash("#v=1")).rejects.toThrow();
  });

  test("rejects a truncated payload", async () => {
    const encoded = await encodePreview(recap);

    await expect(
      decodePreviewHash(encoded.hash.slice(0, -10)),
    ).rejects.toThrow();
  });

  test("stops decompression past the size limit", async () => {
    const encoded = await encodePreview({ padding: "a".repeat(2_000_000) });

    expect(encoded.hash.length).toBeLessThan(10_000);
    await expect(decodePreviewHash(encoded.hash)).rejects.toThrow(/too large/);
  });

  test("exports recap validation separately from decoding", async () => {
    const encoded = await encodePreview({ ...recap, schemaVersion: "2.0" });

    await expect(decodePreviewHash(encoded.hash)).resolves.toMatchObject({
      schemaVersion: "2.0",
    });
    expect(() => parseRecap({ ...recap, schemaVersion: "2.0" })).toThrow();
  });

  test("rejects mismatched timepoint values through recap validation", () => {
    expect(() =>
      parseRecap({
        ...recap,
        highlights: [{ ...point, seconds: 2 }],
      }),
    ).toThrow(/Timestamp mismatch/);
  });
});
