import { afterEach, expect, it, vi } from "vitest";
import app from "../src/index";

afterEach(() => {
  vi.restoreAllMocks();
});

it("returns a generic 500 that leaks nothing when storage fails", async () => {
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  const brokenKv = {
    getWithMetadata: () => Promise.reject(new Error("secret-detail")),
  } as unknown as KVNamespace;

  const response = await app.request(
    "/api/r/AAAAAAAAAAAAAAAAAAAAAA",
    {},
    { SHORT_LINKS: brokenKv },
  );

  expect(response.status).toBe(500);
  const body = await response.text();
  expect(JSON.parse(body)).toEqual({ error: "Something went wrong" });
  expect(body).not.toContain("secret-detail");
  expect(JSON.stringify(consoleError.mock.calls)).not.toContain(
    "secret-detail",
  );
  expect(response.headers.get("Cache-Control")).toBe("no-store");
  expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
  expect(response.headers.get("X-Robots-Tag")).toBe("noindex");
});
