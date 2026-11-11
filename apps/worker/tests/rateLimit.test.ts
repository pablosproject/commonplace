import { Hono } from "hono";
import { describe, expect, it, vi } from "vitest";
import { rateLimit } from "../src/rateLimit";

function appWith(limiter: RateLimit | undefined) {
  const app = new Hono<{ Bindings: Env }>();
  app.get(
    "/",
    rateLimit(() => limiter),
    (c) => c.text("ok"),
  );
  return app;
}

function fakeLimiter(success: boolean) {
  return { limit: vi.fn(async () => ({ success })) };
}

const withIp = { headers: { "CF-Connecting-IP": "203.0.113.7" } };

describe("rateLimit", () => {
  it("keys the limiter on CF-Connecting-IP", async () => {
    const limiter = fakeLimiter(true);

    const response = await appWith(limiter).request("/", withIp, {} as Env);

    expect(response.status).toBe(200);
    expect(limiter.limit).toHaveBeenCalledWith({ key: "203.0.113.7" });
  });

  it("returns 429 with Retry-After when the limiter refuses", async () => {
    const response = await appWith(fakeLimiter(false)).request(
      "/",
      withIp,
      {} as Env,
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("60");
  });

  it("lets the request through when there is no IP", async () => {
    const limiter = fakeLimiter(false);

    const response = await appWith(limiter).request("/", {}, {} as Env);

    expect(response.status).toBe(200);
    expect(limiter.limit).not.toHaveBeenCalled();
  });

  it("lets the request through when the binding is missing", async () => {
    const response = await appWith(undefined).request("/", withIp, {} as Env);

    expect(response.status).toBe(200);
  });
});
