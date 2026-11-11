const MAX_DECOMPRESSED_BYTES = 1_000_000;

export async function deflateJson(
  value: unknown,
): Promise<Uint8Array<ArrayBuffer>> {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  const stream = new Blob([bytes])
    .stream()
    .pipeThrough(new CompressionStream("deflate-raw"));

  return new Uint8Array(await new Response(stream).arrayBuffer());
}

export async function inflateJson(
  bytes: Uint8Array<ArrayBuffer>,
): Promise<unknown> {
  const stream = new Blob([bytes])
    .stream()
    .pipeThrough(new DecompressionStream("deflate-raw"));
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  for (let read = await reader.read(); !read.done; read = await reader.read()) {
    total += read.value.byteLength;

    if (total > MAX_DECOMPRESSED_BYTES) {
      await reader.cancel();
      throw new Error("Payload is too large");
    }

    chunks.push(read.value);
  }

  const inflated = new Uint8Array(total);
  let offset = 0;

  for (const chunk of chunks) {
    inflated.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return JSON.parse(new TextDecoder().decode(inflated));
}

export function toBase64Url(bytes: Uint8Array): string {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function fromBase64Url(value: string): Uint8Array<ArrayBuffer> {
  if (!isBase64Url(value)) {
    throw new Error("Invalid base64url");
  }

  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));

  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

export function isBase64Url(value: string): boolean {
  return /^[A-Za-z0-9_-]*$/.test(value) && value.length % 4 !== 1;
}

export function base64UrlByteLength(value: string): number {
  return Math.floor((value.length * 3) / 4);
}
