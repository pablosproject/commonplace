import { Hono } from "hono";
import { describe, expect, it, vi } from "vitest";
import { rateLimit } from "../src/rateLimit";

const app = new Hono<{ Bindings: Env }>();
app.get("/", rateLimit("READ_LIMITER"), (c) => c.text("ok"));

function envWith(success: boolean) {
  const limiter = { limit: vi.fn(async () => ({ success })) };
  return { env: { READ_LIMITER: limiter } as unknown as Env, limiter };
}

describe("rateLimit", () => {
  it("keys the limiter on CF-Connecting-IP", async () => {
    const { env, limiter } = envWith(true);

    const response = await app.request(
      "/",
      { headers: { "CF-Connecting-IP": "203.0.113.7" } },
      env,
    );

    expect(response.status).toBe(200);
    expect(limiter.limit).toHaveBeenCalledWith({ key: "203.0.113.7" });
  });

  it("lets the request through when there is no IP", async () => {
    const { env, limiter } = envWith(false);

    const response = await app.request("/", {}, env);

    expect(response.status).toBe(200);
    expect(limiter.limit).not.toHaveBeenCalled();
  });
});
