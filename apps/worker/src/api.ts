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
const forbidden = { error: "Forbidden" };

const limitCreates = rateLimit((env) => env.CREATE_LIMITER);
const limitReads = rateLimit((env) => env.READ_LIMITER);

api.post(
  "/r",
  limitCreates,
  bodyLimit({
    maxSize: SHORT_LINK_MAX_BODY_BYTES,
    onError: (c) => c.json({ error: "Request body too large" }, 413),
  }),
  async (c) => {
    const body = await c.req.json().catch(() => undefined);
    const request = createShortLinkRequestSchema.safeParse(body);
    if (!request.success) {
      return c.json(invalidRequest, 400);
    }

    const { data, ttlSeconds = SHORT_LINK_DEFAULT_TTL_SECONDS } = request.data;
    const created = await createShortLink(c.env.SHORT_LINKS, data, ttlSeconds);

    return c.json(created, 201);
  },
);

api.get("/r/:id", limitReads, async (c) => {
  const id = shortLinkIdSchema.safeParse(c.req.param("id"));
  if (!id.success) {
    return c.json(notFound, 404);
  }

  const record = await readShortLink(c.env.SHORT_LINKS, id.data);
  if (!record) {
    return c.json(notFound, 404);
  }

  return c.json(record);
});

api.post("/r/:id/invalidate", limitReads, async (c) => {
  const id = shortLinkIdSchema.safeParse(c.req.param("id"));
  if (!id.success) {
    return c.json(notFound, 404);
  }

  const body = await c.req.json().catch(() => undefined);
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
