import { createHash } from "node:crypto";
import { createTestHarness } from "wrangler";
import { afterAll, beforeAll, expect } from "vitest";

export const server = createTestHarness({
  workers: [{ configPath: "../../wrangler.toml" }],
});
export let env: Env;

beforeAll(async () => {
  await server.listen();
  env = await server.getWorker<Env>().getEnv();
});

afterAll(async () => {
  await server.close();
});

export const data = "A".repeat(40);
export const ownerSecret = "S".repeat(43);

export function newId() {
  return crypto.randomUUID().replaceAll("-", "").slice(0, 22);
}

export function randomIp() {
  return `10.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
}

export function sha256Hex(text: string) {
  return createHash("sha256").update(text).digest("hex");
}

export function postJson(path: string, body: unknown, ip = randomIp()) {
  return server.fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", "CF-Connecting-IP": ip },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

export async function storeLink({ expiresInSeconds = 60 * 60 } = {}) {
  const id = newId();
  const expiresAt = new Date(
    Date.now() + expiresInSeconds * 1000,
  ).toISOString();
  await env.SHORT_LINKS.put(id, data, {
    expirationTtl: 60 * 60,
    metadata: { v: 1, expiresAt, ownerHash: sha256Hex(ownerSecret) },
  });
  return { id, expiresAt };
}

export function expectApiHeaders(response: {
  headers: { get(name: string): string | null };
}) {
  expect(response.headers.get("Cache-Control")).toBe("no-store");
  expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
  expect(response.headers.get("X-Robots-Tag")).toBe("noindex");
  expect(response.headers.get("Access-Control-Allow-Origin")).toBeNull();
}
