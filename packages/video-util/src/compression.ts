const MAX_DECOMPRESSED_BYTES = 1000 * 1000; // 1 MB

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
