import { describe, expect, it } from "vitest";
import {
  data,
  env,
  expectApiHeaders,
  newId,
  server,
  storeLink,
} from "./harness";

async function expectNotFound(
  response: Awaited<ReturnType<typeof server.fetch>>,
) {
  expect(response.status).toBe(404);
  expect(await response.json()).toEqual({ error: "Not found" });
  expectApiHeaders(response);
}

describe("static assets", () => {
  it("serve the web app for app routes", async () => {
    const response = await server.fetch("/preview");

    expect(response.status).toBe(200);
    expect(await response.text()).toContain("<!doctype html>");
  });

  it("mark recap pages as not indexed and not cached", async () => {
    const response = await server.fetch(`/r/${newId()}`);

    expect(response.status).toBe(200);
    expect(response.headers.get("X-Robots-Tag")).toBe("noindex");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("leave other pages indexable", async () => {
    const response = await server.fetch("/preview");

    expect(response.headers.get("X-Robots-Tag")).toBeNull();
  });
});

describe("unknown API routes", () => {
  it("return a JSON 404 with the common headers", async () => {
    await expectNotFound(await server.fetch("/api/unknown"));
  });
});

describe("GET /api/r/:id", () => {
  it("returns the stored record", async () => {
    const { id, expiresAt } = await storeLink();

    const response = await server.fetch(`/api/r/${id}`);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ v: 1, data, expiresAt });
    expectApiHeaders(response);
  });

  it("returns 404 for a missing id", async () => {
    await expectNotFound(await server.fetch(`/api/r/${newId()}`));
  });

  it("returns 404 for a malformed id", async () => {
    await expectNotFound(await server.fetch("/api/r/too-short"));
  });

  it("returns 404 when expiresAt has passed but KV still holds the key", async () => {
    const { id } = await storeLink({ expiresInSeconds: -1 });

    await expectNotFound(await server.fetch(`/api/r/${id}`));
  });

  it("returns 404 for a record without metadata", async () => {
    const id = newId();
    await env.SHORT_LINKS.put(id, data, { expirationTtl: 60 });

    await expectNotFound(await server.fetch(`/api/r/${id}`));
  });
});
