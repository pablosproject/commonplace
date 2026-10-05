import { recapSchema } from "../../../../api/src/schemas/recaps";
import type { Recap } from "../../shared/recap/types";

const MAX_DECOMPRESSED_BYTES = 1_000_000;

export async function decodePreviewHash(hash: string): Promise<Recap> {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const version = params.get("v");
  const payload = params.get("d");

  if (version !== "1" || !payload) {
    throw new Error("Unsupported or incomplete preview link");
  }

  const parsed = JSON.parse(await inflateBase64Url(payload));
  const result = recapSchema.safeParse(parsed);

  if (!result.success) {
    throw new Error("Preview link does not match the recap schema");
  }

  return result.data;
}

async function inflateBase64Url(payload: string) {
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

    if (total > MAX_DECOMPRESSED_BYTES) {
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

function toBase64(payload: string) {
  return payload.replace(/-/g, "+").replace(/_/g, "/");
}
