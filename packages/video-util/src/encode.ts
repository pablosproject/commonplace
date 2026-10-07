import { LINK_VERSION } from "./version.js";

type LinkVersion = typeof LINK_VERSION;

export type EncodedPreviewPayload = {
  version: LinkVersion;
  payload: string;
  hash: string;
};

export async function encodePreviewPayload(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  const stream = new Blob([bytes])
    .stream()
    .pipeThrough(new CompressionStream("deflate-raw"));
  const compressed = new Uint8Array(await new Response(stream).arrayBuffer());

  return toBase64Url(compressed);
}

export async function encodePreview(value: unknown): Promise<EncodedPreviewPayload> {
  const payload = await encodePreviewPayload(value);

  return {
    version: LINK_VERSION,
    payload,
    hash: `#v=${LINK_VERSION}&d=${payload}`,
  };
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
