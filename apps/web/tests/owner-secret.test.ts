import { beforeEach, describe, expect, test, vi } from "vitest";
import {
  claimOwnerSecret,
  clearOwnerSecret,
  readOwnerSecret,
} from "../src/pages/share/owner-secret";

const id = "AAAAAAAAAAAAAAAAAAAAAA";
const key = "k".repeat(43);
const ownerSecret = "s".repeat(43);

function memoryStorage(): Storage {
  const values = new Map<string, string>();

  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (name) => values.get(name) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (name) => values.delete(name),
    setItem: (name, value) => values.set(name, value),
  };
}

let storage: Storage;

beforeEach(() => {
  storage = memoryStorage();
  vi.stubGlobal("localStorage", storage);
});

describe("claimOwnerSecret", () => {
  test("saves the owner secret and returns the hash without it", () => {
    expect(claimOwnerSecret(id, `#k=${key}&m=${ownerSecret}`)).toEqual({
      key,
      hashWithoutSecret: `#k=${key}`,
    });
    expect(storage.getItem(`commonplace:owner:${id}`)).toBe(ownerSecret);
    expect(readOwnerSecret(id)).toBe(ownerSecret);
  });

  test("leaves a share link untouched", () => {
    expect(claimOwnerSecret(id, `#k=${key}`)).toEqual({
      key,
      hashWithoutSecret: null,
    });
    expect(readOwnerSecret(id)).toBeNull();
  });

  test("strips but does not save a malformed secret", () => {
    expect(claimOwnerSecret(id, `#k=${key}&m=short`)).toEqual({
      key,
      hashWithoutSecret: `#k=${key}`,
    });
    expect(readOwnerSecret(id)).toBeNull();
  });

  test("saves the secret even when the key is missing", () => {
    expect(claimOwnerSecret(id, `#m=${ownerSecret}`)).toEqual({
      key: null,
      hashWithoutSecret: "",
    });
    expect(readOwnerSecret(id)).toBe(ownerSecret);
  });

  test("clears the saved secret", () => {
    claimOwnerSecret(id, `#k=${key}&m=${ownerSecret}`);
    clearOwnerSecret(id);

    expect(readOwnerSecret(id)).toBeNull();
  });
});
