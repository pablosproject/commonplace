import { describe, expect, it } from "vitest";
import { escapeLikePattern } from "./like.js";

describe("escapeLikePattern", () => {
  it("leaves plain text untouched", () => {
    expect(escapeLikePattern("hono")).toBe("hono");
  });

  it("escapes wildcards and backslashes", () => {
    expect(escapeLikePattern("100%")).toBe("100\\%");
    expect(escapeLikePattern("a_b")).toBe("a\\_b");
    expect(escapeLikePattern("a\\b")).toBe("a\\\\b");
  });
});
