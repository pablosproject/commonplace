import { fromBase64Url, inflateJson } from "./bytes.js";
import { LINK_VERSION } from "./version.js";

function parsePreviewHash(hash: string): string {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const version = params.get("v");
  const payload = params.get("d");

  if (version !== LINK_VERSION || !payload) {
    throw new Error("Unsupported or incomplete preview link");
  }

  return payload;
}

export async function decodePreviewPayload(payload: string): Promise<unknown> {
  return inflateJson(fromBase64Url(payload));
}

export async function decodePreviewHash(hash: string): Promise<unknown> {
  return decodePreviewPayload(parsePreviewHash(hash));
}
