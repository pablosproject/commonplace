import type { Recap } from "../src/index";

export const point = {
  time: "00:00:01",
  seconds: 1,
  title: "Example point",
  description: "Example description",
};

export const recap: Recap = {
  schemaVersion: "1.0",
  video: {
    id: "abcdefghijk",
    url: "https://www.youtube.com/watch?v=abcdefghijk",
    title: "Example – “quoted”",
  },
  abstract: "Short summary",
  mainTakeaway: "Main point",
  highlights: [point],
  sections: [{ title: "Example section", points: [point] }],
  conclusion: "Done",
  generation: { createdAt: "2026-11-10T10:00:00Z" },
};
