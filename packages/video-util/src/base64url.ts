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
