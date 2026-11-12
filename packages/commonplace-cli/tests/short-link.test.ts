import {
  copyFileSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { decryptRecap } from "@commonplace/video-util";
import { runYoutubeRecapCommand } from "../src/command.js";

const samplesDir = fileURLToPath(
  new URL("../../../data/samples", import.meta.url),
);
const samplePath = join(
  samplesDir,
  readdirSync(samplesDir)[0],
  "video-recap-data.json",
);

const id = "HTUfp9aUTZhyYLWq0U8biQ";
const ownerSecret = "O".repeat(43);
const expiresAt = "2026-11-26T10:00:00.000Z";
const unavailableMessage = /Couldn't reach the short-link service.*--public/;

let workDir: string;
let fetchMock: ReturnType<typeof vi.fn>;

function respondWith(status: number, body?: unknown) {
  fetchMock.mockImplementation(
    async () =>
      new Response(body === undefined ? null : JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json" },
      }),
  );
}

function runLink(args: string[] = [], env: Record<string, string> = {}) {
  return runYoutubeRecapCommand(
    ["link", ...args],
    { RECAP_NO_OPEN: "1", ...env },
    workDir,
  );
}

function sentRequest() {
  const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
  return { url: url.href, init, body: JSON.parse(String(init.body)) };
}

beforeEach(() => {
  workDir = mkdtempSync(join(tmpdir(), "commonplace-cli-"));
  copyFileSync(samplePath, join(workDir, "video-recap-data.json"));
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  respondWith(201, { id, ownerSecret, expiresAt });
});

afterEach(() => {
  vi.unstubAllGlobals();
  rmSync(workDir, { recursive: true, force: true });
});

describe("link", () => {
  test("posts the encrypted recap and prints the share link and expiry", async () => {
    const result = await runLink();
    const { url, init, body } = sentRequest();
    const shareUrl = result.stdout?.split("\n")[0].replace("Share link: ", "");
    const key = new URL(shareUrl ?? "").hash.replace("#k=", "");

    expect(url).toBe("https://commonplace.video/api/r");
    expect(init.method).toBe("POST");
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(body).not.toHaveProperty("ttlSeconds");
    expect(String(init.body)).not.toContain(key);
    expect(await decryptRecap(body.data, key)).toEqual(
      JSON.parse(readFileSync(samplePath, "utf8")),
    );
    expect(result.stdout).toBe(
      [
        `Share link: https://commonplace.video/r/${id}#k=${key}`,
        `Manage link (private): https://commonplace.video/r/${id}#k=${key}&m=${ownerSecret}`,
        "Expires: 2026-11-26",
      ].join("\n"),
    );
    expect(result.exitCode).toBe(0);
    expect(readFileSync(join(workDir, "preview_url.txt"), "utf8")).toBe(
      `${shareUrl}\n`,
    );
  });

  test("opens the manage link unless RECAP_NO_OPEN is set", async () => {
    const opened = await runYoutubeRecapCommand(["link"], {}, workDir);
    const notOpened = await runLink();

    expect(opened.openUrl).toMatch(
      new RegExp(`/r/${id}#k=.+&m=${ownerSecret}$`),
    );
    expect(notOpened.openUrl).toBeUndefined();
  });

  test("uses RECAP_SHARE_URL for the service and the link", async () => {
    const result = await runLink([], {
      RECAP_SHARE_URL: "http://localhost:8787/",
    });

    expect(sentRequest().url).toBe("http://localhost:8787/api/r");
    expect(result.stdout).toMatch(
      new RegExp(`^Share link: http://localhost:8787/r/${id}#k=`),
    );
  });

  test.each([
    ["3y", 3 * 365 * 24 * 60 * 60], // 3 years: the service enforces the limit
    ["1h", 60 * 60], // 1 hour
    ["7d", 7 * 24 * 60 * 60], // 7 days
    ["2y", 2 * 365 * 24 * 60 * 60], // 2 years
  ])("--ttl %s sends %i seconds", async (ttl, seconds) => {
    await runLink(["--ttl", ttl]);

    expect(sentRequest().body.ttlSeconds).toBe(seconds);
  });

  test.each(["0h", "7", "7w", "1.5d", "-1d"])(
    "rejects --ttl %s without calling the service",
    async (ttl) => {
      await expect(runLink(["--ttl", ttl])).rejects.toThrow(/--ttl/);
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  test("--public prints the long preview link without calling the service", async () => {
    const result = await runLink(["--public"]);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.stdout).toMatch(
      /^https:\/\/commonplace\.video\/preview#v=1&d=/,
    );
  });

  test.each([
    ["a server error", () => respondWith(500, { error: "Internal error" })],
    ["a rate limit", () => respondWith(429, { error: "Too many requests" })],
    ["a network error", () => fetchMock.mockRejectedValue(new TypeError())],
    ["an unexpected body", () => respondWith(201, { id: "short" })],
    ["a 4xx without an error message", () => respondWith(404, "Not found")],
  ])("suggests --public after %s", async (_, setup) => {
    setup();

    await expect(runLink()).rejects.toThrow(unavailableMessage);
    expect(existsSync(join(workDir, "preview_url.txt"))).toBe(false);
  });

  test("shows the server's message for other client errors", async () => {
    respondWith(413, { error: "Recap is too large" });

    await expect(runLink()).rejects.toThrow("Recap is too large");
  });
});
