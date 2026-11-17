import {
  decryptRecap,
  parseRecap,
  shortLinkIdSchema,
  shortLinkRecordSchema,
  type Recap,
  type ShortLinkRecord,
} from "@commonplace/video-util";

export type SharedRecap = {
  recap: Recap;
  expiresAt: string;
};

export type LoadErrorReason = "incomplete" | "missing" | "unavailable";

export type LoadResult =
  | { status: "ready"; data: SharedRecap }
  | { status: "error"; reason: LoadErrorReason };

export type InvalidateResult =
  "invalidated" | "forbidden" | "missing" | "failed";

export async function loadSharedRecap(
  id: string,
  key: string,
): Promise<LoadResult> {
  if (!shortLinkIdSchema.safeParse(id).success) {
    return { status: "error", reason: "missing" };
  }

  let record: ShortLinkRecord;

  try {
    const response = await fetch(`/api/r/${id}`, {
      headers: { Accept: "application/json" },
    });

    if (response.status === 404) {
      return { status: "error", reason: "missing" };
    }

    if (!response.ok) {
      return { status: "error", reason: "unavailable" };
    }

    record = shortLinkRecordSchema.parse(await response.json());
  } catch {
    return { status: "error", reason: "unavailable" };
  }

  try {
    const recap = parseRecap(await decryptRecap(record.data, key));
    return { status: "ready", data: { recap, expiresAt: record.expiresAt } };
  } catch {
    return { status: "error", reason: "incomplete" };
  }
}

export async function invalidateLink(
  id: string,
  ownerSecret: string,
): Promise<InvalidateResult> {
  try {
    const response = await fetch(`/api/r/${id}/invalidate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ownerSecret }),
    });

    switch (response.status) {
      case 204:
        return "invalidated";
      case 403:
        return "forbidden";
      case 404:
        return "missing";
      default:
        return "failed";
    }
  } catch {
    return "failed";
  }
}
