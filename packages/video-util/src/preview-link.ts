import { fromBase64Url, toBase64Url } from "./base64url.js";
import { deflateJson, inflateJson } from "./compression.js";

const LINK_VERSION = "1";

type LinkVersion = typeof LINK_VERSION;

export type EncodedPreviewPayload = {
  version: LinkVersion;
  payload: string;
  hash: string;
};

export async function encodePreviewPayload(value: unknown): Promise<string> {
  return toBase64Url(await deflateJson(value));
}

export async function encodePreview(
  value: unknown,
): Promise<EncodedPreviewPayload> {
  const payload = await encodePreviewPayload(value);

  return {
    version: LINK_VERSION,
    payload,
    hash: `#v=${LINK_VERSION}&d=${payload}`,
  };
}

export async function decodePreviewPayload(payload: string): Promise<unknown> {
  return inflateJson(fromBase64Url(payload));
}

export async function decodePreviewHash(hash: string): Promise<unknown> {
  return decodePreviewPayload(parsePreviewHash(hash));
}

function parsePreviewHash(hash: string): string {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const version = params.get("v");
  const payload = params.get("d");

  if (version !== LINK_VERSION || !payload) {
    throw new Error("Unsupported or incomplete preview link");
  }

  return payload;
}
