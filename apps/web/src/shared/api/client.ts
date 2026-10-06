import { hc } from "hono/client";
import type { AppType } from "../../../../api/src/app";

const apiOrigin = import.meta.env.VITE_API_ORIGIN ?? "/";

export const api = hc<AppType>(apiOrigin);
