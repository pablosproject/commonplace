import { deflateJson, toBase64Url } from "./bytes.js";
import { LINK_VERSION } from "./version.js";

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
