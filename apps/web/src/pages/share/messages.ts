import type { InvalidateResult, LoadErrorReason } from "./api";

export const LOAD_ERROR_MESSAGES: Record<LoadErrorReason, string> = {
  incomplete: "This link is incomplete. Ask for the full link.",
  missing: "This link has expired or was removed.",
  unavailable: "Couldn't load this link. Try again in a minute.",
};

export const INVALIDATE_MESSAGES: Record<InvalidateResult, string> = {
  invalidated:
    "Link invalidated. It may take up to a minute to stop working everywhere.",
  forbidden: "This browser can no longer manage this link.",
  missing: LOAD_ERROR_MESSAGES.missing,
  failed: "Couldn't invalidate the link.",
};
