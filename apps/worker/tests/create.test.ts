import {
  SHORT_LINK_DEFAULT_TTL_SECONDS,
  SHORT_LINK_MAX_BODY_BYTES,
  SHORT_LINK_MAX_TTL_SECONDS,
} from "@commonplace/video-util";
import { describe, expect, it } from "vitest";
import { data, env, postJson, randomIp, server, sha256Hex } from "./harness";

function create(body: unknown, ip?: string) {
  return postJson("/api/r", body, ip);
}

describe("POST /api/r", () => {
  it("stores the data and returns the id, owner secret and expiry", async () => {
    const before = Date.now();

    const response = await create({ data });

    expect(response.status).toBe(201);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    const { id, ownerSecret, expiresAt } = (await response.json()) as {
      id: string;
      ownerSecret: string;
      expiresAt: string;
    };
    expect(id).toMatch(/^[A-Za-z0-9_-]{22}$/);
    expect(ownerSecret).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(Date.parse(expiresAt) - before).toBeGreaterThanOrEqual(
      SHORT_LINK_DEFAULT_TTL_SECONDS * 1000,
    );
    expect(Date.parse(expiresAt) - before).toBeLessThan(
      SHORT_LINK_DEFAULT_TTL_SECONDS * 1000 + 10 * 1000,
    );

    const stored = await env.SHORT_LINKS.getWithMetadata(id);
    expect(stored.value).toBe(data);
    expect(stored.metadata).toEqual({
      v: 1,
      expiresAt,
      ownerHash: sha256Hex(ownerSecret),
    });
  });

  it("makes the link readable through GET", async () => {
    const created = (await (
      await create({ data, ttlSeconds: 60 * 60 })
    ).json()) as {
      id: string;
      expiresAt: string;
    };

    const response = await server.fetch(`/api/r/${created.id}`);

    expect(await response.json()).toEqual({
      v: 1,
      data,
      expiresAt: created.expiresAt,
    });
  });

  it.each([
    ["invalid JSON", "{not json"],
    ["missing data", {}],
    ["data that is not base64url", { data: "not base64url!" + data }],
    ["data shorter than 28 bytes", { data: "A".repeat(36) }],
    ["ttlSeconds below 60", { data, ttlSeconds: 59 }],
    [
      "ttlSeconds above 2 years",
      { data, ttlSeconds: SHORT_LINK_MAX_TTL_SECONDS + 1 },
    ],
    ["ttlSeconds that is not an integer", { data, ttlSeconds: 60.5 }],
    ["unknown fields", { data, extra: true }],
  ])("returns 400 for %s", async (_, body) => {
    const response = await create(body);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid request" });
  });

  it("returns 413 for a body over 64 KB", async () => {
    const response = await create({
      data: "A".repeat(SHORT_LINK_MAX_BODY_BYTES),
    });

    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({ error: "Request body too large" });
  });

  it("returns 429 with Retry-After on the second create from the same IP within a minute", async () => {
    const ip = randomIp();
    expect((await create({ data }, ip)).status).toBe(201);

    const response = await create({ data }, ip);

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("60");
    expect(await response.json()).toEqual({ error: "Too many requests" });
  });

  it("never echoes or logs a malformed body", async () => {
    server.clearLogs();
    const marker = "leak-marker-7f3a";

    const response = await create(`{"data": "${marker}", broken`);

    expect(response.status).toBe(400);
    expect(await response.text()).not.toContain(marker);
    expect(JSON.stringify(server.getLogs())).not.toContain(marker);
  });
});
