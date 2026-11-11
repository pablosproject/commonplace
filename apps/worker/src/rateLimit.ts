import type { MiddlewareHandler } from "hono";

export function rateLimit(
  pickLimiter: (env: Env) => RateLimit | undefined,
): MiddlewareHandler<{ Bindings: Env }> {
  return async (c, next) => {
    const limiter = pickLimiter(c.env);
    const ip = c.req.header("CF-Connecting-IP");
    if (!limiter || !ip) {
      return next();
    }

    const { success } = await limiter.limit({ key: ip });
    if (!success) {
      return c.json({ error: "Too many requests" }, 429, {
        "Retry-After": "60",
      });
    }

    return next();
  };
}
