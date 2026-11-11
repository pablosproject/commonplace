import { z } from "zod";
import {
  base64UrlByteLength,
  fromBase64Url,
  isBase64Url,
  toBase64Url,
} from "./base64url.js";
import { deflateJson, inflateJson } from "./compression.js";

export const SHORT_LINK_VERSION = 1;
export const SHORT_LINK_MAX_BODY_BYTES = 64 * 1024; // 64 KB
export const SHORT_LINK_MIN_TTL_SECONDS = 60; // 1 minute
export const SHORT_LINK_MAX_TTL_SECONDS = 2 * 365 * 24 * 60 * 60; // 2 years
export const SHORT_LINK_DEFAULT_TTL_SECONDS = 15 * 24 * 60 * 60; // 15 days

const INITIALIZATION_VECTOR_BYTES = 12;
const TAG_BYTES = 16;
const KEY_BYTES = 32;

export type EncryptedRecap = {
  data: string;
  key: string;
};

// encryptRecap: recap JSON → deflate → AES-256-GCM encrypt → base64url
// decryptRecap: base64url → AES-256-GCM decrypt → inflate → recap JSON
// The key travels only in the link fragment (#k=); the server stores `data`.
// Format details: docs/short-link.md.
export async function encryptRecap(recap: unknown): Promise<EncryptedRecap> {
  const keyBytes = crypto.getRandomValues(new Uint8Array(KEY_BYTES));
  const initializationVector = crypto.getRandomValues(
    new Uint8Array(INITIALIZATION_VECTOR_BYTES),
  );
  const cryptoKey = await importKey(keyBytes, "encrypt");
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

export async function decryptRecap(
  data: string,
  key: string,
): Promise<unknown> {
  const keyBytes = fromBase64Url(key);
  const dataBytes = fromBase64Url(data);

  if (keyBytes.byteLength !== KEY_BYTES) {
    throw new Error("Invalid key");
  }

  if (dataBytes.byteLength < INITIALIZATION_VECTOR_BYTES + TAG_BYTES) {
    throw new Error("Encrypted data is too short");
  }

  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: dataBytes.subarray(0, INITIALIZATION_VECTOR_BYTES) },
    await importKey(keyBytes, "decrypt"),
    dataBytes.subarray(INITIALIZATION_VECTOR_BYTES),
  );

  return inflateJson(new Uint8Array(plaintext));
}

function importKey(bytes: Uint8Array<ArrayBuffer>, usage: KeyUsage) {
  return crypto.subtle.importKey("raw", bytes, "AES-GCM", false, [usage]);
}

export type ShortLinkFragment = {
  key: string | null;
  ownerSecret: string | null;
};

export function parseShortLinkFragment(hash: string): ShortLinkFragment {
  const params = new URLSearchParams(hash.replace(/^#/, ""));

  return {
    key: params.get("k") || null,
    ownerSecret: params.get("m") || null,
  };
}

export function buildShareFragment(key: string) {
  return `#k=${key}`;
}

export function buildShareUrl(baseUrl: string, id: string, key: string) {
  return `${shortLinkUrl(baseUrl, id)}${buildShareFragment(key)}`;
}

export function buildManageUrl(
  baseUrl: string,
  id: string,
  key: string,
  ownerSecret: string,
) {
  return `${buildShareUrl(baseUrl, id, key)}&m=${ownerSecret}`;
}

function shortLinkUrl(baseUrl: string, id: string) {
  return `${baseUrl.replace(/\/+$/, "")}/r/${id}`;
}

export const ownerSecretSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/);

export const shortLinkIdSchema = z.string().regex(/^[A-Za-z0-9_-]{22}$/);

const encryptedDataSchema = z
  .string()
  .refine(
    (value) =>
      isBase64Url(value) &&
      base64UrlByteLength(value) >= INITIALIZATION_VECTOR_BYTES + TAG_BYTES,
    "Expected base64url data of at least 28 bytes",
  );

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

export const apiErrorSchema = z.object({ error: z.string() });

export type CreateShortLinkRequest = z.infer<
  typeof createShortLinkRequestSchema
>;
export type CreateShortLinkResponse = z.infer<
  typeof createShortLinkResponseSchema
>;
export type ShortLinkRecord = z.infer<typeof shortLinkRecordSchema>;
export type InvalidateShortLinkRequest = z.infer<
  typeof invalidateShortLinkRequestSchema
>;
export type ApiError = z.infer<typeof apiErrorSchema>;
