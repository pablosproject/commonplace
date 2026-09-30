import { Hono } from "hono";

export const createHealthRoutes = () =>
  new Hono().get("/", (c) =>
    c.json({
      ok: true,
      service: "api",
    }),
  );
