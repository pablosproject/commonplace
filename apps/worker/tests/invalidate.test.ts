import { describe, expect, it } from "vitest";
import {
  data,
  env,
  newId,
  ownerSecret,
  postJson,
  randomIp,
  server,
  storeLink,
} from "./harness";

const wrongSecret = "W".repeat(43);

function invalidate(id: string, body: unknown, ip?: string) {
  return postJson(`/api/r/${id}/invalidate`, body, ip);
}

describe("POST /api/r/:id/invalidate", () => {
  it("deletes the link with the right owner secret", async () => {
    const { id } = await storeLink();

    const response = await invalidate(id, { ownerSecret });

    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await env.SHORT_LINKS.get(id)).toBeNull();
    expect((await server.fetch(`/api/r/${id}`)).status).toBe(404);
  });

  it("returns 403 and keeps the link with a wrong secret", async () => {
    const { id } = await storeLink();

    const response = await invalidate(id, { ownerSecret: wrongSecret });

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "Forbidden" });
    expect(await env.SHORT_LINKS.get(id)).toBe(data);
  });

  it.each([
    ["a missing link", () => Promise.resolve(newId())],
    [
      "an expired link",
      async () => (await storeLink({ expiresInSeconds: -1 })).id,
    ],
    ["a malformed id", () => Promise.resolve("too-short")],
  ])("returns 404 for %s", async (_, makeId) => {
    const response = await invalidate(await makeId(), { ownerSecret });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Not found" });
  });

  it.each([
    ["invalid JSON", "{not json"],
    ["a missing secret", {}],
    ["a malformed secret", { ownerSecret: "short" }],
    ["unknown fields", { ownerSecret, extra: true }],
  ])("returns 403 and keeps the link for %s", async (_, body) => {
    const { id } = await storeLink();

    const response = await invalidate(id, body);

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "Forbidden" });
    expect(await env.SHORT_LINKS.get(id)).toBe(data);
  });

  it("never logs or echoes the owner secret", async () => {
    server.clearLogs();
    const { id } = await storeLink();

    const wrong = await invalidate(id, { ownerSecret: wrongSecret });
    const right = await invalidate(id, { ownerSecret });

    expect(await wrong.text()).not.toContain(wrongSecret);
    expect(await right.text()).toBe("");
    const logs = JSON.stringify(server.getLogs());
    expect(logs).not.toContain(wrongSecret);
    expect(logs).not.toContain(ownerSecret);
  });
});

describe("READ_LIMITER", () => {
  it("allows 30 reads per minute per IP, then returns 429", async () => {
    const ip = randomIp();
    const read = () =>
      server.fetch(`/api/r/${newId()}`, {
        headers: { "CF-Connecting-IP": ip },
      });

    for (let i = 0; i < 30; i++) {
      expect((await read()).status).toBe(404);
    }
    const response = await read();

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("60");
  });

  it("counts invalidations against the same limit as reads", async () => {
    const ip = randomIp();
    for (let i = 0; i < 30; i++) {
      await server.fetch(`/api/r/${newId()}`, {
        headers: { "CF-Connecting-IP": ip },
      });
    }

    const response = await invalidate(
      (await storeLink()).id,
      { ownerSecret },
      ip,
    );

    expect(response.status).toBe(429);
  });
});
