import type { PageMessage } from "../../shared/ui/MessagePage";
import type { InvalidateResult, LoadErrorReason } from "./api";

export const LOAD_ERROR_MESSAGES: Record<LoadErrorReason, PageMessage> = {
  incomplete: {
    icon: "broken",
    title: "This link is incomplete",
    message:
      "Part of the link is missing. Ask the person who shared it for the full link.",
  },
  missing: {
    icon: "expired",
    title: "This link has expired",
    message:
      "It expired or its owner removed it. Ask the person who shared it for a new one.",
  },
  unavailable: {
    icon: "offline",
    title: "Couldn't load this recap",
    message: "Check your connection and try again in a minute.",
  },
};

export const INVALIDATE_MESSAGES: Record<InvalidateResult, string> = {
  invalidated:
    "Link invalidated. It may take up to a minute to stop working everywhere.",
  forbidden: "This manage link is no longer valid.",
  missing: "This link has expired or was removed.",
  failed: "Couldn't invalidate the link.",
};
