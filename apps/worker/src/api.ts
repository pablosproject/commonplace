import {
  createShortLinkRequestSchema,
  invalidateShortLinkRequestSchema,
  SHORT_LINK_DEFAULT_TTL_SECONDS,
  SHORT_LINK_MAX_BODY_BYTES,
  shortLinkIdSchema,
} from "@commonplace/video-util";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { rateLimit } from "./rateLimit";
import {
  createShortLink,
  invalidateShortLink,
  readShortLink,
} from "./shortLinks";

export const api = new Hono<{ Bindings: Env }>();

api.use(async (c, next) => {
  await next();
  c.res.headers.set("Cache-Control", "no-store");
  c.res.headers.set("X-Content-Type-Options", "nosniff");
  c.res.headers.set("X-Robots-Tag", "noindex");
});

api.onError((error, c) => {
  console.error("Unhandled API error", error.name);
  return c.json({ error: "Something went wrong" }, 500);
});

const notFound = { error: "Not found" };
const invalidRequest = { error: "Invalid request" };
const invalidTtl = {
  error: "The lifetime must be between 1 minute and 2 years",
};
const forbidden = { error: "Forbidden" };

api.post(
  "/r",
  rateLimit("CREATE_LIMITER"),
  bodyLimit({
    maxSize: SHORT_LINK_MAX_BODY_BYTES,
    onError: (c) => c.json({ error: "Request body too large" }, 413),
  }),
  async (c) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json(invalidRequest, 400);
    }

    const request = createShortLinkRequestSchema.safeParse(body);
    if (!request.success) {
      const badTtl = request.error.issues.some(
        (issue) => issue.path[0] === "ttlSeconds",
      );
      return c.json(badTtl ? invalidTtl : invalidRequest, 400);
    }

    const { data, ttlSeconds = SHORT_LINK_DEFAULT_TTL_SECONDS } = request.data;
    const created = await createShortLink(c.env.SHORT_LINKS, data, ttlSeconds);

    return c.json(created, 201);
  },
);

api.get("/r/:id", rateLimit("READ_LIMITER"), async (c) => {
  const id = shortLinkIdSchema.safeParse(c.req.param("id"));
  if (!id.success) {
    return c.json(notFound, 404);
  }

  const link = await readShortLink(c.env.SHORT_LINKS, id.data);
  if (!link) {
    return c.json(notFound, 404);
  }

  return c.json({ v: link.v, data: link.data, expiresAt: link.expiresAt });
});

api.post("/r/:id/invalidate", rateLimit("READ_LIMITER"), async (c) => {
  const id = shortLinkIdSchema.safeParse(c.req.param("id"));
  if (!id.success) {
    return c.json(notFound, 404);
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json(forbidden, 403);
  }

  const request = invalidateShortLinkRequestSchema.safeParse(body);
  if (!request.success) {
    return c.json(forbidden, 403);
  }

  const result = await invalidateShortLink(
    c.env.SHORT_LINKS,
    id.data,
    request.data.ownerSecret,
  );
  if (result === "not-found") {
    return c.json(notFound, 404);
  }

  if (result === "forbidden") {
    return c.json(forbidden, 403);
  }

  return c.body(null, 204);
});

api.all("*", (c) => c.json(notFound, 404));
