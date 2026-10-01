import type { Recap } from "../../../../api/src/schemas/recaps";

export type RecapPoint = Recap["highlights"][number];
export type RecapSection = Recap["sections"][number];

export type SeekRequest = {
  seconds: number;
  nonce: number;
};
