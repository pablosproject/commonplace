import {
  ownerSecretSchema,
  parseShortLinkFragment,
} from "@commonplace/video-util";

const OWNER_SECRET_KEY_PREFIX = "commonplace:owner:";

export function claimOwnerSecret(id: string, hash: string) {
  const { key, ownerSecret } = parseShortLinkFragment(hash);

  if (ownerSecret === null) {
    return { key, hashWithoutSecret: null };
  }

  if (ownerSecretSchema.safeParse(ownerSecret).success) {
    try {
      localStorage.setItem(OWNER_SECRET_KEY_PREFIX + id, ownerSecret);
    } catch {}
  }

  return { key, hashWithoutSecret: key ? `#k=${key}` : "" };
}

export function readOwnerSecret(id: string) {
  try {
    const secret = localStorage.getItem(OWNER_SECRET_KEY_PREFIX + id);
    return secret && ownerSecretSchema.safeParse(secret).success
      ? secret
      : null;
  } catch {
    return null;
  }
}

export function clearOwnerSecret(id: string) {
  try {
    localStorage.removeItem(OWNER_SECRET_KEY_PREFIX + id);
  } catch {}
}
