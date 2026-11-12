import { encryptRecap, type Recap } from "@commonplace/video-util";
import { afterEach, describe, expect, test, vi } from "vitest";
import { invalidateLink, loadSharedRecap } from "../src/pages/share/api";

const id = "AAAAAAAAAAAAAAAAAAAAAA";
const ownerSecret = "s".repeat(43);
const expiresAt = "2026-11-25T10:00:00.000Z";

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

function mockFetch(response: Response | Error) {
  const fetch = vi.fn(async () => {
    if (response instanceof Error) {
      throw response;
    }

    return response;
  });

  vi.stubGlobal("fetch", fetch);
  return fetch;
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("loadSharedRecap", () => {
  test("fetches, decrypts and validates the recap", async () => {
    const { data, key } = await encryptRecap(recap);
    const fetch = mockFetch(json(200, { v: 1, data, expiresAt }));

    expect(await loadSharedRecap(id, key)).toEqual({
      status: "ready",
      data: { recap, expiresAt },
    });
    expect(fetch).toHaveBeenCalledWith(`/api/r/${id}`, expect.anything());
  });

  test("reports a missing link on 404", async () => {
    mockFetch(json(404, { error: "Not found" }));

    expect(await loadSharedRecap(id, "k".repeat(43))).toEqual({
      status: "error",
      reason: "missing",
    });
  });

  test("reports a malformed id as missing without fetching", async () => {
    const fetch = mockFetch(json(200, {}));

    expect(await loadSharedRecap("../api", "k".repeat(43))).toEqual({
      status: "error",
      reason: "missing",
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  test.each([
    ["a network error", new TypeError("Failed to fetch")],
    ["429", json(429, { error: "Too many requests" })],
    ["500", json(500, { error: "Server error" })],
    ["an unexpected body", json(200, { v: 2, data: "abc", expiresAt })],
    ["a body that is not JSON", new Response("<html>", { status: 200 })],
  ])("reports the service as unavailable on %s", async (_, response) => {
    mockFetch(response);

    expect(await loadSharedRecap(id, "k".repeat(43))).toEqual({
      status: "error",
      reason: "unavailable",
    });
  });

  test("reports an incomplete link when the key is wrong", async () => {
    const { data } = await encryptRecap(recap);
    const other = await encryptRecap(recap);
    mockFetch(json(200, { v: 1, data, expiresAt }));

    expect(await loadSharedRecap(id, other.key)).toEqual({
      status: "error",
      reason: "incomplete",
    });
  });

  test("reports an incomplete link when the payload is not a recap", async () => {
    const { data, key } = await encryptRecap({ ...recap, extra: "field" });
    mockFetch(json(200, { v: 1, data, expiresAt }));

    expect(await loadSharedRecap(id, key)).toEqual({
      status: "error",
      reason: "incomplete",
    });
  });
});

describe("invalidateLink", () => {
  test("posts the owner secret in the body", async () => {
    const fetch = mockFetch(new Response(null, { status: 204 }));

    expect(await invalidateLink(id, ownerSecret)).toBe("invalidated");
    expect(fetch).toHaveBeenCalledWith(`/api/r/${id}/invalidate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ownerSecret }),
    });
  });

  test.each([
    [403, "forbidden"],
    [404, "missing"],
    [429, "failed"],
    [500, "failed"],
  ])("maps %i to %s", async (status, result) => {
    mockFetch(json(status, { error: "Nope" }));

    expect(await invalidateLink(id, ownerSecret)).toBe(result);
  });

  test("fails on a network error", async () => {
    mockFetch(new TypeError("Failed to fetch"));

    expect(await invalidateLink(id, ownerSecret)).toBe("failed");
  });
});
