import { z } from "zod";
import {
  deflateJson,
  fromBase64Url,
  inflateJson,
  toBase64Url,
} from "./link-encoding.js";

export const SHORT_LINK_VERSION = 1;
export const SHORT_LINK_MAX_BODY_BYTES = 64 * 1024; // 64 KB
const SHORT_LINK_MIN_TTL_SECONDS = 60; // 1 minute
export const SHORT_LINK_MAX_TTL_SECONDS = 2 * 365 * 24 * 60 * 60; // 2 years
export const SHORT_LINK_DEFAULT_TTL_SECONDS = 15 * 24 * 60 * 60; // 15 days

const INITIALIZATION_VECTOR_BYTES = 12;
const TAG_BYTES = 16;
const KEY_BYTES = 32;

// encryptRecap: recap JSON → deflate → AES-256-GCM encrypt → base64url
// decryptRecap: base64url → AES-256-GCM decrypt → inflate → recap JSON
// The key travels only in the link fragment (#k=); the server stores `data`.
// Format details: docs/short-link.md.
export async function encryptRecap(recap: unknown) {
  const keyBytes = crypto.getRandomValues(new Uint8Array(KEY_BYTES));
  const initializationVector = crypto.getRandomValues(
    new Uint8Array(INITIALIZATION_VECTOR_BYTES),
  );
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    "AES-GCM",
    false,
    ["encrypt"],
  );
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: initializationVector },
    cryptoKey,
    await deflateJson(recap),
  );
  const data = new Uint8Array(
    INITIALIZATION_VECTOR_BYTES + ciphertext.byteLength,
  );

  // data = [ initialization vector (12) | encrypted recap (N) | tag (16) ]
  // AES-GCM appends the 16-byte tag to the ciphertext, so the shortest valid
  // data is 12 + 16 = 28 bytes.
  data.set(initializationVector);
  data.set(new Uint8Array(ciphertext), INITIALIZATION_VECTOR_BYTES);

  return { data: toBase64Url(data), key: toBase64Url(keyBytes) };
}

export async function decryptRecap(data: string, key: string) {
  const keyBytes = fromBase64Url(key);
  const dataBytes = fromBase64Url(data);

  if (keyBytes.byteLength !== KEY_BYTES) {
    throw new Error("Invalid key");
  }

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    "AES-GCM",
    false,
    ["decrypt"],
  );
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: dataBytes.subarray(0, INITIALIZATION_VECTOR_BYTES) },
    cryptoKey,
    dataBytes.subarray(INITIALIZATION_VECTOR_BYTES),
  );

  return inflateJson(new Uint8Array(plaintext));
}

export function parseShortLinkFragment(hash: string) {
  const params = new URLSearchParams(hash.replace(/^#/, ""));

  return {
    key: params.get("k") || null,
    ownerSecret: params.get("m") || null,
  };
}

export function buildShortLinkUrl(
  baseUrl: string,
  id: string,
  key: string,
  ownerSecret?: string,
) {
  const url = `${baseUrl.replace(/\/+$/, "")}/r/${id}#k=${key}`;

  if (!ownerSecret) {
    return url;
  }

  return `${url}&m=${ownerSecret}`;
}

export const ownerSecretSchema = z.base64url().length(43); // 32 bytes

export const shortLinkIdSchema = z.base64url().length(22); // 16 bytes

// 38 base64url characters encode the 28-byte minimum: initialization vector + tag
const encryptedDataSchema = z
  .base64url()
  .min(Math.ceil(((INITIALIZATION_VECTOR_BYTES + TAG_BYTES) * 4) / 3));

export const createShortLinkRequestSchema = z.strictObject({
  data: encryptedDataSchema,
  ttlSeconds: z
    .number()
    .int()
    .min(SHORT_LINK_MIN_TTL_SECONDS)
    .max(SHORT_LINK_MAX_TTL_SECONDS)
    .optional(),
});

export const createShortLinkResponseSchema = z.object({
  id: shortLinkIdSchema,
  ownerSecret: ownerSecretSchema,
  expiresAt: z.iso.datetime({ offset: true }),
});

export const shortLinkRecordSchema = z.object({
  v: z.literal(SHORT_LINK_VERSION),
  data: encryptedDataSchema,
  expiresAt: z.iso.datetime({ offset: true }),
});

export const invalidateShortLinkRequestSchema = z.strictObject({
  ownerSecret: ownerSecretSchema,
});

export type ShortLinkRecord = z.infer<typeof shortLinkRecordSchema>;
