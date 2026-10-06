import { LINK_VERSION } from "./encode.js";
import { recapSchema, type Recap } from "./codec.js";

export const MAX_DECOMPRESSED_BYTES = 1_000_000;

export function parsePreviewHash(hash: string): string {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const version = params.get("v");
  const payload = params.get("d");

  if (version !== LINK_VERSION || !payload) {
    throw new Error("Unsupported or incomplete preview link");
  }

  return payload;
}

export async function decodePreviewPayload(
  payload: string,
  maxDecompressedBytes = MAX_DECOMPRESSED_BYTES,
): Promise<Recap> {
  const parsed: unknown = JSON.parse(
    await inflateBase64Url(payload, maxDecompressedBytes),
  );
  const result = recapSchema.safeParse(parsed);

  if (!result.success) {
    throw new Error("Preview link does not match the recap schema");
  }

  return result.data;
}

export async function decodePreviewHash(hash: string): Promise<Recap> {
  return decodePreviewPayload(parsePreviewHash(hash));
}

async function inflateBase64Url(
  payload: string,
  maxDecompressedBytes: number,
): Promise<string> {
  const binary = atob(toBase64(payload));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  const stream = new Blob([bytes])
    .stream()
    .pipeThrough(new DecompressionStream("deflate-raw"));
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  for (let read = await reader.read(); !read.done; read = await reader.read()) {
    total += read.value.byteLength;

    if (total > maxDecompressedBytes) {
      await reader.cancel();
      throw new Error("Preview link payload is too large");
    }

    chunks.push(read.value);
  }

  const inflated = new Uint8Array(total);
  let offset = 0;

  for (const chunk of chunks) {
    inflated.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return new TextDecoder().decode(inflated);
}

function toBase64(payload: string): string {
  const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
  const padding = (4 - (base64.length % 4)) % 4;
  return base64.padEnd(base64.length + padding, "=");
}
