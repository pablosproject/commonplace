import {
  ownerSecretSchema,
  shortLinkIdSchema,
  validRecapSchema,
  type Recap,
} from "@commonplace/video-util";
import { z } from "zod";

const managementSchema = z.strictObject({
  linkId: shortLinkIdSchema,
  key: ownerSecretSchema,
  ownerSecret: ownerSecretSchema,
  expiresAt: z.iso.datetime({ offset: true }),
});

const webRecapSchema = z.strictObject({
  recap: validRecapSchema,
  management: managementSchema.optional(),
});

const librarySchema = z.strictObject({
  version: z.literal(1),
  entries: z.array(
    webRecapSchema.extend({
      positionSeconds: z.number().nonnegative().optional(),
      managementMatchesRecap: z.boolean(),
    }),
  ),
});

export type WebRecap = z.infer<typeof webRecapSchema>;
export type SavedRecap = z.infer<typeof librarySchema>["entries"][number];
export type SaveRecapResult = "saved" | "replacement-required";

const STORAGE_KEY = "commonplace.library.v1";
const READ_ERROR =
  "Your saved library could not be read. Browser storage may be blocked, or its data may be damaged or from an unsupported version. Existing data has not been changed.";

export const LOCAL_STORAGE_NOTICE =
  "Saved only in this browser and profile, not synced between devices. Clearing site data removes your recaps and management access. Private browsing saves are temporary. This is not a backup.";

export function sameRecap(first: Recap, second: Recap) {
  return (
    JSON.stringify(validRecapSchema.parse(first)) ===
    JSON.stringify(validRecapSchema.parse(second))
  );
}

export class LibraryStorage {
  private entries = new Map<string, SavedRecap>();
  private listeners = new Set<() => void>();
  private snapshot: {
    entries: readonly Readonly<SavedRecap>[];
    error: string | null;
  } = {
    entries: [],
    error: null,
  };

  constructor(
    private storage: Pick<Storage, "getItem" | "setItem">,
    private events: Window = window,
  ) {
    this.events.addEventListener("storage", this.onStorage);
    this.sync();
  }

  dispose() {
    this.events.removeEventListener("storage", this.onStorage);
  }

  getSnapshot = () => this.snapshot;

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) {
      this.sync();
    }
  };

  private readLibrary(): SavedRecap[] {
    const raw = this.storage.getItem(STORAGE_KEY);
    if (raw === null) {
      return [];
    }

    const value: unknown = JSON.parse(raw);
    return librarySchema.parse(value).entries;
  }

  private sync() {
    try {
      const entries = this.readLibrary();
      const next = new Map(
        entries.map((entry) => [entry.recap.video.id, entry]),
      );
      if (next.size !== entries.length) {
        this.commit(next);
      } else {
        this.publish(next, null);
      }
    } catch {
      this.publish(this.entries, READ_ERROR);
    }
  }

  private assertReadable() {
    if (this.snapshot.error) {
      throw new Error(this.snapshot.error);
    }
  }

  private commit(next: Map<string, SavedRecap>) {
    const entries = Array.from(next.values());
    const data = librarySchema.parse({ version: 1, entries });
    this.storage.setItem(STORAGE_KEY, JSON.stringify(data));
    this.publish(next, null);
  }

  private publish(entries: Map<string, SavedRecap>, error: string | null) {
    const list = Array.from(entries.values()).sort(
      (a, b) =>
        a.recap.video.title.localeCompare(b.recap.video.title) ||
        a.recap.video.id.localeCompare(b.recap.video.id),
    );
    this.entries = entries;
    this.snapshot = { entries: list, error };
    for (const listener of this.listeners) {
      listener();
    }
  }

  save(input: WebRecap, replace = false): SaveRecapResult {
    const { recap, management } = webRecapSchema.parse(input);

    this.assertReadable();
    const existing = this.entries.get(recap.video.id);
    if (existing && !sameRecap(existing.recap, recap) && !replace) {
      return "replacement-required";
    }

    let managementMatchesRecap = Boolean(management);
    if (!management && existing?.management) {
      managementMatchesRecap =
        existing.managementMatchesRecap && sameRecap(existing.recap, recap);
    }

    const entry = {
      recap,
      positionSeconds: existing?.positionSeconds,
      management: management ?? existing?.management,
      managementMatchesRecap,
    };
    const next = new Map(this.entries);
    next.set(recap.video.id, entry);
    this.commit(next);
    return "saved";
  }

  saveTime(videoId: string, positionSeconds: number) {
    if (!Number.isFinite(positionSeconds) || positionSeconds < 0) {
      return;
    }

    this.assertReadable();
    const entry = this.entries.get(videoId);
    if (
      !entry ||
      Math.abs((entry.positionSeconds ?? 0) - positionSeconds) < 5
    ) {
      return;
    }

    const next = new Map(this.entries);
    next.set(videoId, { ...entry, positionSeconds });
    this.commit(next);
  }

  remove(videoId: string) {
    this.assertReadable();
    if (!this.entries.has(videoId)) {
      return;
    }

    const next = new Map(this.entries);
    next.delete(videoId);
    this.commit(next);
  }
}
