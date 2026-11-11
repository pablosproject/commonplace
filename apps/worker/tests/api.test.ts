import { createTestHarness } from "wrangler";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const server = createTestHarness({
  workers: [{ configPath: "../../wrangler.toml" }],
});
let env: Env;
type HarnessResponse = Awaited<ReturnType<typeof server.fetch>>;

const data = "A".repeat(40);
const ownerHash = "f".repeat(64);
const oneDaySeconds = 24 * 60 * 60;

function newId() {
  return crypto.randomUUID().replaceAll("-", "").slice(0, 22);
}

function isoFromNow(milliseconds: number) {
  return new Date(Date.now() + milliseconds).toISOString();
}

function expectApiHeaders(response: HarnessResponse) {
  expect(response.headers.get("Cache-Control")).toBe("no-store");
  expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
  expect(response.headers.get("X-Robots-Tag")).toBe("noindex");
  expect(response.headers.get("Access-Control-Allow-Origin")).toBeNull();
}

async function expectNotFound(response: HarnessResponse) {
  expect(response.status).toBe(404);
  expect(await response.json()).toEqual({ error: "Not found" });
  expectApiHeaders(response);
}

beforeAll(async () => {
  await server.listen();
  env = await server.getWorker<Env>().getEnv();
});

afterAll(async () => {
  await server.close();
});

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
    const id = newId();
    const expiresAt = isoFromNow(oneDaySeconds * 1000);
    await env.SHORT_LINKS.put(id, data, {
      expirationTtl: oneDaySeconds,
      metadata: { v: 1, expiresAt, ownerHash },
    });

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
    const id = newId();
    await env.SHORT_LINKS.put(id, data, {
      expirationTtl: 60,
      metadata: { v: 1, expiresAt: isoFromNow(-1000), ownerHash },
    });

    await expectNotFound(await server.fetch(`/api/r/${id}`));
  });

  it("returns 404 for a record without metadata", async () => {
    const id = newId();
    await env.SHORT_LINKS.put(id, data, { expirationTtl: 60 });

    await expectNotFound(await server.fetch(`/api/r/${id}`));
  });
});
