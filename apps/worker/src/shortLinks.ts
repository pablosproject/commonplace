import {
  SHORT_LINK_VERSION,
  type ShortLinkRecord,
} from "@commonplace/video-util";
import { z } from "zod";

const metadataSchema = z.object({
  v: z.literal(SHORT_LINK_VERSION),
  expiresAt: z.iso.datetime({ offset: true }),
  ownerHash: z.string().regex(/^[0-9a-f]{64}$/),
});

type Metadata = z.infer<typeof metadataSchema>;

export async function createShortLink(
  kv: KVNamespace,
  data: string,
  ttlSeconds: number,
  now = Date.now(),
) {
  const id = randomBase64Url(16);
  const ownerSecret = randomBase64Url(32);
  const expiresAt = new Date(now + ttlSeconds * 1000).toISOString();
  const metadata: Metadata = {
    v: SHORT_LINK_VERSION,
    expiresAt,
    ownerHash: await sha256Hex(ownerSecret),
  };

  await kv.put(id, data, { expirationTtl: ttlSeconds, metadata });

  return { id, ownerSecret, expiresAt };
}

export async function readShortLink(
  kv: KVNamespace,
  id: string,
  now = Date.now(),
): Promise<ShortLinkRecord | null> {
  const stored = await findLiveRecord(kv, id, now);
  if (!stored) {
    return null;
  }

  const { v, expiresAt } = stored.metadata;
  return { v, data: stored.data, expiresAt };
}

export async function invalidateShortLink(
  kv: KVNamespace,
  id: string,
  ownerSecret: string,
  now = Date.now(),
): Promise<"invalidated" | "not-found" | "forbidden"> {
  const stored = await findLiveRecord(kv, id, now);
  if (!stored) {
    return "not-found";
  }

  const encoder = new TextEncoder();
  const isOwner = crypto.subtle.timingSafeEqual(
    encoder.encode(await sha256Hex(ownerSecret)),
    encoder.encode(stored.metadata.ownerHash),
  );
  if (!isOwner) {
    return "forbidden";
  }

  await kv.delete(id);
  return "invalidated";
}

async function findLiveRecord(kv: KVNamespace, id: string, now: number) {
  const { value, metadata } = await kv.getWithMetadata(id);
  const parsed = metadataSchema.safeParse(metadata);
  if (value === null || !parsed.success) {
    return null;
  }

  if (Date.parse(parsed.data.expiresAt) <= now) {
    return null;
  }

  return { data: value, metadata: parsed.data };
}

function randomBase64Url(byteLength: number) {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
  return btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
}

async function sha256Hex(text: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text),
  );
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
