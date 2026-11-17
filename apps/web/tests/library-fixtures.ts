import type { Recap } from "@commonplace/video-util";

const point = {
  time: "00:00:01",
  seconds: 1,
  title: "Example",
  description: "A useful point",
};
export const recap: Recap = {
  schemaVersion: "1.0",
  video: {
    id: "abcdefghijk",
    url: "https://www.youtube.com/watch?v=abcdefghijk",
    title: "Example video",
    channel: "Example channel",
  },
  abstract: "A summary",
  mainTakeaway: "An important idea",
  highlights: [point],
  sections: [{ title: "Section", points: [point] }],
  conclusion: "A conclusion",
};
export const linkId = "AAAAAAAAAAAAAAAAAAAAAA";
export const shareKey = "k".repeat(43);
export const expiresAt = "2030-01-01T00:00:00.000Z";
export const source = {
  url: `/r/${linkId}#k=${shareKey}`,
};
export const adminSource = {
  ...source,
  management: {
    ownerSecret: "s".repeat(43),
    expiresAt,
  },
};
