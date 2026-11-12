import type { PageMessage } from "../ui/MessagePage";

export type LoadState<T> =
  | { status: "loading" }
  | { status: "ready"; data: T }
  | { status: "error"; error: PageMessage };
