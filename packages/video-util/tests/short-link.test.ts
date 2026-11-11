import { describe, expect, test } from "vitest";
import {
  buildShortLinkUrl,
  createShortLinkRequestSchema,
  createShortLinkResponseSchema,
  decryptRecap,
  encryptRecap,
  parseShortLinkFragment,
  shortLinkIdSchema,
  shortLinkRecordSchema,
} from "../src/index";
import { recap } from "./fixtures";

const id = "AAAAAAAAAAAAAAAAAAAAAA";
const key = "k".repeat(43);
const ownerSecret = "s".repeat(43);

function base64UrlOfLength(byteLength: number): string {
  return Buffer.alloc(byteLength, 7).toString("base64url");
}

function flipCharacter(value: string, index: number): string {
  const replacement = value[index] === "A" ? "B" : "A";
  return value.slice(0, index) + replacement + value.slice(index + 1);
}

describe("encryptRecap and decryptRecap", () => {
  test("round-trips a recap", async () => {
    const encrypted = await encryptRecap(recap);

    expect(encrypted.key).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(encrypted.data).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(await decryptRecap(encrypted.data, encrypted.key)).toEqual(recap);
  });

  test("uses a fresh key and IV for every encryption", async () => {
    const first = await encryptRecap(recap);
    const second = await encryptRecap(recap);

    expect(first.key).not.toBe(second.key);
    expect(first.data.slice(0, 16)).not.toBe(second.data.slice(0, 16));
  });

  test("rejects the wrong key", async () => {
    const encrypted = await encryptRecap(recap);
    const other = await encryptRecap(recap);

    await expect(decryptRecap(encrypted.data, other.key)).rejects.toThrow();
  });

  test("rejects a key of the wrong length", async () => {
    const encrypted = await encryptRecap(recap);

    await expect(
      decryptRecap(encrypted.data, encrypted.key.slice(0, -2)),
    ).rejects.toThrow();
  });

  test("rejects tampered data", async () => {
    const encrypted = await encryptRecap(recap);
    const tampered = flipCharacter(encrypted.data, 30);

    await expect(decryptRecap(tampered, encrypted.key)).rejects.toThrow();
  });

  test("rejects truncated data", async () => {
    const encrypted = await encryptRecap(recap);

    await expect(
      decryptRecap(encrypted.data.slice(0, -10), encrypted.key),
    ).rejects.toThrow();
  });

  test("rejects data shorter than an IV and a tag", async () => {
    const encrypted = await encryptRecap(recap);

    await expect(
      decryptRecap(base64UrlOfLength(27), encrypted.key),
    ).rejects.toThrow();
  });

  test("rejects data that is not base64url", async () => {
    const encrypted = await encryptRecap(recap);

    await expect(
      decryptRecap(`${encrypted.data}!`, encrypted.key),
    ).rejects.toThrow();
  });

  test("stops decompression past the size limit", async () => {
    const encrypted = await encryptRecap({ padding: "a".repeat(2_000_000) });

    expect(encrypted.data.length).toBeLessThan(10_000);
    await expect(decryptRecap(encrypted.data, encrypted.key)).rejects.toThrow(
      /too large/,
    );
  });
});

describe("short link fragments", () => {
  test("parses the key and the owner secret", () => {
    expect(parseShortLinkFragment(`#k=${key}&m=${ownerSecret}`)).toEqual({
      key,
      ownerSecret,
    });
  });

  test("parses a share fragment without an owner secret", () => {
    expect(parseShortLinkFragment(`#k=${key}`)).toEqual({
      key,
      ownerSecret: null,
    });
  });

  test("returns nulls for an empty or unrelated fragment", () => {
    expect(parseShortLinkFragment("")).toEqual({
      key: null,
      ownerSecret: null,
    });
    expect(parseShortLinkFragment("#v=1&d=abc&k=")).toEqual({
      key: null,
      ownerSecret: null,
    });
  });

  test("builds the share link", () => {
    expect(buildShortLinkUrl("https://commonplace.video", id, key)).toBe(
      `https://commonplace.video/r/${id}#k=${key}`,
    );
  });

  test("builds the manage link", () => {
    expect(
      buildShortLinkUrl("http://localhost:8787/", id, key, ownerSecret),
    ).toBe(`http://localhost:8787/r/${id}#k=${key}&m=${ownerSecret}`);
  });

  test("round-trips a built manage link", () => {
    const url = new URL(
      buildShortLinkUrl("https://commonplace.video", id, key, ownerSecret),
    );

    expect(url.pathname).toBe(`/r/${id}`);
    expect(parseShortLinkFragment(url.hash)).toEqual({ key, ownerSecret });
  });
});

describe("short link API schemas", () => {
  test("accepts valid ids only", () => {
    expect(shortLinkIdSchema.safeParse(id).success).toBe(true);
    expect(shortLinkIdSchema.safeParse(id.slice(1)).success).toBe(false);
    expect(shortLinkIdSchema.safeParse(`${id.slice(1)}=`).success).toBe(false);
  });

  test("rejects data shorter than an IV and a tag", () => {
    expect(
      createShortLinkRequestSchema.safeParse({ data: base64UrlOfLength(28) })
        .success,
    ).toBe(true);
    expect(
      createShortLinkRequestSchema.safeParse({ data: base64UrlOfLength(27) })
        .success,
    ).toBe(false);
  });

  test("bounds ttlSeconds to between one minute and two years", () => {
    const data = base64UrlOfLength(40);
    const parse = (ttlSeconds: unknown) =>
      createShortLinkRequestSchema.safeParse({ data, ttlSeconds }).success;

    expect(parse(60)).toBe(true);
    expect(parse(63_072_000)).toBe(true);
    expect(parse(59)).toBe(false);
    expect(parse(63_072_001)).toBe(false);
    expect(parse(90.5)).toBe(false);
    expect(parse("3600")).toBe(false);
  });

  test("parses the create response", () => {
    const response = {
      id,
      ownerSecret,
      expiresAt: "2026-11-25T10:00:00.000Z",
    };

    expect(createShortLinkResponseSchema.parse(response)).toEqual(response);
    expect(
      createShortLinkResponseSchema.safeParse({ ...response, id: "short" })
        .success,
    ).toBe(false);
  });

  test("parses the read response for version 1 only", () => {
    const record = {
      v: 1,
      data: base64UrlOfLength(40),
      expiresAt: "2026-11-25T10:00:00.000Z",
    };

    expect(shortLinkRecordSchema.parse(record)).toEqual(record);
    expect(shortLinkRecordSchema.safeParse({ ...record, v: 2 }).success).toBe(
      false,
    );
  });
});
