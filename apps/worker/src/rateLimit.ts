import type { MiddlewareHandler } from "hono";

export function rateLimit(
  binding: "CREATE_LIMITER" | "READ_LIMITER",
): MiddlewareHandler<{ Bindings: Env }> {
  return async (c, next) => {
    const ip = c.req.header("CF-Connecting-IP");
    if (!ip) {
      return next();
    }

    const { success } = await c.env[binding].limit({ key: ip });
    if (!success) {
      return c.json({ error: "Too many requests" }, 429, {
        "Retry-After": "60",
      });
    }

    return next();
  };
}
