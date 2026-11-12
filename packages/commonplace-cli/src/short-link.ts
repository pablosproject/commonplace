import {
  buildShortLinkUrl,
  createShortLinkResponseSchema,
  encryptRecap,
  type Recap,
} from "@commonplace/video-util";
import { z } from "zod";

const requestTimeoutMs = 15 * 1000; // 15 seconds
const serviceUnavailableMessage =
  "Couldn't reach the short-link service. To share now, re-run with --public: you'll get a long link that holds the recap itself, unencrypted and not stored on any server.";

async function postRecap(shareUrl: string, body: unknown) {
  let response: Response;
  try {
    response = await fetch(new URL("/api/r", shareUrl), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(requestTimeoutMs),
    });
  } catch {
    throw new Error(serviceUnavailableMessage);
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {}

  const created = createShortLinkResponseSchema.safeParse(json);
  if (response.ok && created.success) {
    return created.data;
  }

  const clientError = z.object({ error: z.string() }).safeParse(json);
  if (response.status < 500 && response.status !== 429 && clientError.success) {
    throw new Error(
      `The short-link service refused the recap: ${clientError.data.error}`,
    );
  }

  throw new Error(serviceUnavailableMessage);
}

export async function createShortLink({
  recap,
  shareUrl,
  ttlSeconds,
}: {
  recap: Recap;
  shareUrl: string;
  ttlSeconds?: number;
}) {
  const { data, key } = await encryptRecap(recap);
  const created = await postRecap(shareUrl, { data, ttlSeconds });

  return {
    shareUrl: buildShortLinkUrl(shareUrl, created.id, key),
    manageUrl: buildShortLinkUrl(
      shareUrl,
      created.id,
      key,
      created.ownerSecret,
    ),
    expiresAt: created.expiresAt,
  };
}
