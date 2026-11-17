// @vitest-environment jsdom
import type { Recap } from "@commonplace/video-util";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  LibraryStorage,
  sameRecap,
  type SaveRecapResult,
} from "../src/shared/library/storage";
import {
  adminSource,
  linkId,
  recap,
  shareKey,
  source,
} from "./library-fixtures";

const testLibraries: LibraryStorage[] = [];

function newTestLibrary() {
  const library = new LibraryStorage(localStorage);
  testLibraries.push(library);
  return library;
}

function readLibrary() {
  const { entries, error } = newTestLibrary().getSnapshot();
  if (error) {
    throw new Error(error);
  }
  return entries;
}

function saveRecap(
  recap: Recap,
  source: {
    url: string;
    management?: { ownerSecret: string; expiresAt: string };
  },
  replace = false,
) {
  const url = new URL(source.url, "https://example.com");
  const management = source.management
    ? {
        ...source.management,
        linkId: url.pathname.slice(3),
        key: url.hash.slice(3),
      }
    : undefined;
  return newTestLibrary().save({ recap, management }, replace);
}
const savePlaybackPosition: LibraryStorage["saveTime"] = (...args) =>
  newTestLibrary().saveTime(...args);
const removeSavedRecap: LibraryStorage["remove"] = (...args) =>
  newTestLibrary().remove(...args);

beforeEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

afterEach(() => {
  for (const library of testLibraries.splice(0)) {
    library.dispose();
  }
});

describe("browser library", () => {
  test("publishes stable snapshots only after a successful write", () => {
    const library = newTestLibrary();
    const listener = vi.fn();
    const unsubscribe = library.subscribe(listener);
    listener.mockClear();
    const before = library.getSnapshot();
    expect(library.getSnapshot()).toBe(before);

    library.save({ recap });
    const saved = library.getSnapshot();
    expect(saved).not.toBe(before);
    expect(library.getSnapshot()).toBe(saved);
    expect(listener).toHaveBeenCalledTimes(1);

    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Full", "QuotaExceededError");
    });
    expect(() => library.remove(recap.video.id)).toThrow();
    expect(library.getSnapshot()).toBe(saved);
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  test("deduplicates entries during sync and persists the last copy", () => {
    const original = {
      recap,
      managementMatchesRecap: false,
    };
    const latest = {
      ...original,
      recap: { ...recap, abstract: "Updated summary" },
    };
    localStorage.setItem(
      "commonplace.library.v1",
      JSON.stringify({ version: 1, entries: [original, latest] }),
    );

    const library = newTestLibrary();
    expect(library.getSnapshot().entries).toEqual([latest]);
    expect(
      JSON.parse(localStorage.getItem("commonplace.library.v1") ?? "null"),
    ).toEqual({ version: 1, entries: [latest] });
  });

  test("preserves duplicate data when the cleanup write fails", () => {
    const entry = { recap, managementMatchesRecap: false };
    const raw = JSON.stringify({ version: 1, entries: [entry, entry] });
    localStorage.setItem("commonplace.library.v1", raw);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Full", "QuotaExceededError");
    });

    const library = newTestLibrary();
    expect(library.getSnapshot().error).toBeTruthy();
    expect(localStorage.getItem("commonplace.library.v1")).toBe(raw);
  });

  test("synchronizes external changes and preserves data on invalid storage", () => {
    const library = newTestLibrary();
    const listener = vi.fn();
    const unsubscribe = library.subscribe(listener);
    library.save({ recap });
    const saved = library.getSnapshot();
    localStorage.setItem("commonplace.library.v1", "invalid");
    window.dispatchEvent(
      new StorageEvent("storage", { key: "commonplace.library.v1" }),
    );
    expect(library.getSnapshot().entries).toEqual(saved.entries);
    expect(library.getSnapshot().error).toBeTruthy();
    expect(() => library.remove(recap.video.id)).toThrow();
    expect(localStorage.getItem("commonplace.library.v1")).toBe("invalid");
    unsubscribe();
  });
  test("rejects invalid management credentials without saving", () => {
    const library = newTestLibrary();
    expect(() =>
      library.save({
        recap,
        management: {
          linkId: "invalid",
          key: shareKey,
          ownerSecret: adminSource.management.ownerSecret,
          expiresAt: adminSource.management.expiresAt,
        },
      }),
    ).toThrow();
    expect(library.getSnapshot().entries).toEqual([]);
  });

  test("saves optional management credentials separately from the recap", () => {
    const result: SaveRecapResult = saveRecap(recap, adminSource);
    expect(result).toBe("saved");
    expect(readLibrary()[0].management).toEqual({
      ...adminSource.management,
      linkId,
      key: shareKey,
    });
    const persisted = JSON.parse(
      localStorage.getItem("commonplace.library.v1") ?? "null",
    );
    expect(persisted.version).toBe(1);
    expect(persisted.entries[0].management).not.toHaveProperty("kind");
    expect(persisted.entries[0].management).not.toHaveProperty("invalidated");
  });

  test("saves playback progress and preserves it when the recap is saved again", () => {
    saveRecap(recap, source);
    savePlaybackPosition(recap.video.id, 42);
    expect(readLibrary()[0].positionSeconds).toBe(42);

    saveRecap(recap, source);
    expect(readLibrary()[0].positionSeconds).toBe(42);
  });

  test("stores a complete recap without a link, surviving reloads without a server", () => {
    expect(readLibrary()).toEqual([]);
    expect(saveRecap(recap, source)).toBe("saved");
    expect(readLibrary()[0].recap).toEqual(recap);
    expect(readLibrary()[0].management).toBeUndefined();
  });

  test("deduplicates identical contents regardless of JSON property order", () => {
    saveRecap(recap, source);
    const { abstract, ...rest } = recap;
    expect(sameRecap(recap, { ...rest, abstract })).toBe(true);
    saveRecap({ ...rest, abstract }, source);
    expect(readLibrary()).toHaveLength(1);
  });

  test("requires explicit replacement and preserves the administrative link", () => {
    saveRecap(recap, adminSource);
    const next = { ...recap, abstract: "A different summary" };
    const nextSource = { url: `/r/BBBBBBBBBBBBBBBBBBBBBB#k=${shareKey}` };
    expect(saveRecap(next, nextSource)).toBe("replacement-required");
    expect(readLibrary()[0].recap).toEqual(recap);
    saveRecap(next, nextSource, true);
    const [entry] = readLibrary();
    expect(entry.recap).toEqual(next);
    expect(entry.management).toEqual({
      ...adminSource.management,
      linkId,
      key: shareKey,
    });
    expect(entry.managementMatchesRecap).toBe(false);
  });

  test("upgrades management access and never downgrades it with a reader save", () => {
    saveRecap(recap, source);
    saveRecap(recap, adminSource);
    saveRecap(recap, source);
    expect(readLibrary()[0].management).toEqual({
      ...adminSource.management,
      linkId,
      key: shareKey,
    });
  });

  test("replaces an administrative link with another administrative link", () => {
    saveRecap(recap, adminSource);
    const next = {
      ...adminSource,
      url: `/r/BBBBBBBBBBBBBBBBBBBBBB#k=${shareKey}`,
      management: { ...adminSource.management, ownerSecret: "x".repeat(43) },
    };
    expect(saveRecap(recap, next)).toBe("saved");
    expect(readLibrary()[0].management).toEqual({
      ...next.management,
      linkId: "BBBBBBBBBBBBBBBBBBBBBB",
      key: shareKey,
    });
  });

  test("replaces management credentials for the same link", () => {
    saveRecap(recap, adminSource);
    const management = {
      ...adminSource.management,
      ownerSecret: "x".repeat(43),
    };
    expect(saveRecap(recap, { ...adminSource, management })).toBe("saved");
    expect(readLibrary()[0].management).toEqual({
      ...management,
      linkId,
      key: shareKey,
    });
  });

  test("reader and preview URLs never contain administrator access", () => {
    saveRecap(recap, adminSource);
    const [entry] = readLibrary();
    expect(entry.management).toEqual({
      ...adminSource.management,
      linkId,
      key: shareKey,
    });
    saveRecap(recap, { url: "/preview#v=1&d=abc" });
    expect(readLibrary()[0].management).toEqual({
      ...adminSource.management,
      linkId,
      key: shareKey,
    });
  });

  test("does not expire local content or management credentials", () => {
    const expiredSource = {
      ...adminSource,
      management: {
        ...adminSource.management,
        expiresAt: "2020-01-01T00:00:00.000Z",
      },
    };
    saveRecap(recap, expiredSource);
    expect(readLibrary()[0].recap).toEqual(recap);
    expect(readLibrary()[0].management).toEqual({
      ...expiredSource.management,
      linkId,
      key: shareKey,
    });
    saveRecap(recap, source);
    expect(readLibrary()[0].management).toEqual({
      ...expiredSource.management,
      linkId,
      key: shareKey,
    });
  });

  test("sorts alphabetically and removes recap and credentials together", () => {
    saveRecap(
      { ...recap, video: { ...recap.video, title: "Zulu" } },
      adminSource,
    );
    saveRecap(
      {
        ...recap,
        video: { ...recap.video, id: "12345678901", title: "Alpha" },
      },
      { url: `/r/BBBBBBBBBBBBBBBBBBBBBB#k=${shareKey}` },
    );
    expect(readLibrary().map((entry) => entry.recap.video.title)).toEqual([
      "Alpha",
      "Zulu",
    ]);
    removeSavedRecap(recap.video.id);
    expect(readLibrary()).toHaveLength(1);
    expect(
      readLibrary().some((entry) => entry.recap.video.id === recap.video.id),
    ).toBe(false);
  });

  test.each([
    "not json",
    '{"version":2,"entries":[]}',
    '{"version":3,"entries":[]}',
    '{"version":2,"entries":[{}]}',
  ])("does not overwrite corrupt or unsupported storage: %s", (raw) => {
    localStorage.setItem("commonplace.library.v1", raw);
    expect(() => readLibrary()).toThrow();
    expect(() => saveRecap(recap, source)).toThrow();
    expect(localStorage.getItem("commonplace.library.v1")).toBe(raw);
  });

  test("rejects tampered recap contents and inconsistent source references", () => {
    saveRecap(recap, source);
    const entries = readLibrary();
    localStorage.setItem(
      "commonplace.library.v1",
      JSON.stringify({
        version: 1,
        entries: [{ ...entries[0], savedLink: { url: "javascript:alert(1)" } }],
      }),
    );
    expect(() => readLibrary()).toThrow();
    localStorage.setItem(
      "commonplace.library.v1",
      JSON.stringify({
        version: 1,
        entries: [{ ...entries[0], recap: { ...recap, schemaVersion: "2.0" } }],
      }),
    );
    expect(() => readLibrary()).toThrow();
  });

  test("does not lose previous data when a write fails", () => {
    saveRecap(recap, adminSource);
    const original = localStorage.getItem("commonplace.library.v1");
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Full", "QuotaExceededError");
    });
    expect(() =>
      saveRecap({ ...recap, abstract: "Replacement" }, source, true),
    ).toThrow();
    expect(localStorage.getItem("commonplace.library.v1")).toBe(original);
    expect(() => removeSavedRecap(recap.video.id)).toThrow();
    expect(localStorage.getItem("commonplace.library.v1")).toBe(original);
  });
});
