import { describe, expect, test } from "vitest";
import {
  buildPreviewHash,
  buildPreviewLink,
  decodePreviewHash,
  parsePreviewHash,
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
  test("round-trips a recap", async () => {
    const hash = await buildPreviewHash(recap);

    expect(hash).toMatch(/^#v=1&d=[A-Za-z0-9_-]+$/);
    expect(await decodePreviewHash(hash)).toEqual(recap);
  });

  test("builds a link from an app URL", async () => {
    const link = await buildPreviewLink("http://localhost:5173/preview", recap);

    expect(link.startsWith("http://localhost:5173/preview#v=1&d=")).toBe(true);
  });

  test("rejects unsupported or incomplete fragments", () => {
    expect(() => parsePreviewHash("#v=2&d=abc")).toThrow();
    expect(() => parsePreviewHash("#v=1")).toThrow();
  });

  test("rejects a truncated payload", async () => {
    const hash = await buildPreviewHash(recap);

    await expect(decodePreviewHash(hash.slice(0, -10))).rejects.toThrow();
  });

  test("stops decompression past the size limit", async () => {
    const hash = await buildPreviewHash({ padding: "a".repeat(2_000_000) });

    expect(hash.length).toBeLessThan(10_000);
    await expect(decodePreviewHash(hash)).rejects.toThrow(/too large/);
  });

  test("rejects decoded data that does not match the recap schema", async () => {
    const hash = await buildPreviewHash({ ...recap, schemaVersion: "2.0" });

    await expect(decodePreviewHash(hash)).rejects.toThrow(/schema/);
  });
});
