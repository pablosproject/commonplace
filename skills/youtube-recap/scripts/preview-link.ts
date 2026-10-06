// Generated from packages/video-util/src/encode.ts. Do not edit by hand.

export const LINK_VERSION = "1";

export async function encodePreviewPayload(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  const stream = new Blob([bytes])
    .stream()
    .pipeThrough(new CompressionStream("deflate-raw"));
  const compressed = new Uint8Array(await new Response(stream).arrayBuffer());

  return toBase64Url(compressed);
}

export async function buildPreviewHash(value: unknown): Promise<string> {
  return `#v=${LINK_VERSION}&d=${await encodePreviewPayload(value)}`;
}

export async function buildPreviewLink(
  appUrl: string,
  value: unknown,
): Promise<string> {
  return `${appUrl}${await buildPreviewHash(value)}`;
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
