import { expect, test } from "vitest";

import { cleanTranscript } from "../src/youtube-transcript.js";

test("keeps each caption line once, stamped with the cue where it first appears", () => {
  const rollingAutoCaptions = `1
00:00:01,570 --> 00:00:07,510

[Music]

2
00:00:07,510 --> 00:00:07,520
[Music]


3
00:00:07,520 --> 00:00:08,950
[Music]
this program is brought to you by

4
00:00:08,950 --> 00:00:08,960
this program is brought to you by


5
00:00:08,960 --> 00:00:11,870
this program is brought to you by
Stanford University please visit us at
`;

  expect(cleanTranscript(rollingAutoCaptions)).toBe(
    [
      "[00:00:01] [Music]",
      "[00:00:07] this program is brought to you by",
      "[00:00:08] Stanford University please visit us at",
    ].join("\n") + "\n",
  );
});

test("passes through one-line manual captions and joins multi-line cues", () => {
  const manualCaptions = `1
00:00:07,470 --> 00:00:10,369
This program is brought to you by Stanford University.

2
00:01:01,010 --> 00:01:03,894
I dropped out of Reed College
after the first 6 months,
`;

  expect(cleanTranscript(manualCaptions)).toBe(
    [
      "[00:00:07] This program is brought to you by Stanford University.",
      "[00:01:01] I dropped out of Reed College after the first 6 months,",
    ].join("\n") + "\n",
  );
});

test("handles CRLF line endings", () => {
  expect(
    cleanTranscript("1\r\n00:00:05,000 --> 00:00:06,000\r\nHello there\r\n"),
  ).toBe("[00:00:05] Hello there\n");
});
