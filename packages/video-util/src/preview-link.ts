import {
  deflateJson,
  fromBase64Url,
  inflateJson,
  toBase64Url,
} from "./link-encoding.js";

const LINK_VERSION = "1";

export async function encodePreview(value: unknown) {
  const payload = toBase64Url(await deflateJson(value));

  return {
    version: LINK_VERSION,
    payload,
    hash: `#v=${LINK_VERSION}&d=${payload}`,
  };
}

export async function decodePreviewHash(hash: string): Promise<unknown> {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const version = params.get("v");
  const payload = params.get("d");

  if (version !== LINK_VERSION || !payload) {
    throw new Error("Unsupported or incomplete preview link");
  }

  return inflateJson(fromBase64Url(payload));
}
