import { Hono } from "hono";

export const app = new Hono();

app.get("/api/health", (c) => {
  const response = {
    ok: true,
    service: "api",
  } as const;

  return c.json(response);
});
