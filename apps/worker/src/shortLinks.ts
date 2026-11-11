import {
  SHORT_LINK_VERSION,
  shortLinkRecordSchema,
  toBase64Url,
} from "@commonplace/video-util";
import { z } from "zod";

const metadataSchema = shortLinkRecordSchema.omit({ data: true }).extend({
  ownerHash: z.string().regex(/^[0-9a-f]{64}$/),
});

export async function createShortLink(
  kv: KVNamespace,
  data: string,
  ttlSeconds: number,
) {
  const id = toBase64Url(crypto.getRandomValues(new Uint8Array(16)));
  const ownerSecret = toBase64Url(crypto.getRandomValues(new Uint8Array(32)));
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
  const metadata = {
    v: SHORT_LINK_VERSION,
    expiresAt,
    ownerHash: await sha256Hex(ownerSecret),
  };

  await kv.put(id, data, { expirationTtl: ttlSeconds, metadata });

  return { id, ownerSecret, expiresAt };
}

export async function readShortLink(kv: KVNamespace, id: string) {
  const { value, metadata } = await kv.getWithMetadata(id);
  const parsed = metadataSchema.safeParse(metadata);
  if (value === null || !parsed.success) {
    return null;
  }

  if (Date.parse(parsed.data.expiresAt) <= Date.now()) {
    return null;
  }

  return { ...parsed.data, data: value };
}

export async function invalidateShortLink(
  kv: KVNamespace,
  id: string,
  ownerSecret: string,
): Promise<"invalidated" | "not-found" | "forbidden"> {
  const link = await readShortLink(kv, id);
  if (!link) {
    return "not-found";
  }

  const encoder = new TextEncoder();
  const isOwner = crypto.subtle.timingSafeEqual(
    encoder.encode(await sha256Hex(ownerSecret)),
    encoder.encode(link.ownerHash),
  );
  if (!isOwner) {
    return "forbidden";
  }

  await kv.delete(id);
  return "invalidated";
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
