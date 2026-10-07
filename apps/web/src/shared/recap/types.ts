import type { Recap } from "@commonplace/video-util";

export type { Recap };
export type RecapPoint = Recap["highlights"][number];
export type RecapSection = Recap["sections"][number];

export type SeekRequest = {
  seconds: number;
  nonce: number;
};
