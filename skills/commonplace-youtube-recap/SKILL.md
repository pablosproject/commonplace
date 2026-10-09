---
name: commonplace-youtube-recap
description: Summarize a YouTube video into a structured recap (summary, main takeaway, timestamped highlights and chapters, conclusion) and return a link that opens it in the Commonplace web app with an embedded, seekable player. Use this whenever the user shares a YouTube URL or video ID and wants a summary, recap, TL;DR, key moments, chapters, timestamps, or wants to know whether a video is worth watching, even if they don't say "recap".
license: MIT
compatibility: Requires Node.js 20+ with npx, Python 3.10+ (for the bundled yt-dlp) and ffmpeg (for subtitle conversion); the CLI is fetched from npm on first use and supplies yt-dlp for transcripts.
allowed-tools: Bash(node --version) Bash(npx --yes {{PACKAGE_SPEC}} *)
---

## Purpose

Turn a YouTube video into a recap that helps the user:

- Quickly understand what the video is about.
- Decide whether it is worth watching.
- Find the most valuable moments.
- Jump straight to those moments in the Commonplace web app's embedded player.

The deliverable is a **preview link**. The recap data travels inside the link itself, in the URL fragment, so nothing is uploaded or stored anywhere: the web app decodes and renders it in the browser. The task is finished when the user has that link.

## Before You Start

Every command runs through `npx`, so nothing has to be installed in advance except Node.js 20+. Check it once with `node --version`.

If Node is missing or older than 20, stop and tell the user: the skill needs Node.js 20+ to run its `commonplace` command. Suggest the install that fits their system (the installer from nodejs.org, `brew install node` on macOS, or a version manager such as nvm), and do not install it yourself unless they ask you to.

The first command downloads the CLI and `yt-dlp`, so it can take a while; later runs reuse the npm cache.

## Steps

Work in a per-video folder (for example `./<video-title-slug>/`) and run every command from there:

```bash
npx --yes {{PACKAGE_SPEC}} fetch "VIDEO_URL"   # 1. transcript and video info
npx --yes {{PACKAGE_SPEC}} generate-json-stub  # 2. video-recap-data.json skeleton
# 3. read transcript.txt and replace every TODO in video-recap-data.json
npx --yes {{PACKAGE_SPEC}} validate            # 4. check while iterating
npx --yes {{PACKAGE_SPEC}} link                # 5. build, save and open the link
```

Run the commands yourself; never ask the user to paste them. Use the package spec above for every command: it was chosen when the skill was installed, and nothing needs to be installed in the skill folder.

## Transcript Acquisition

`fetch` writes three files:

- `transcript.txt`: the transcript to read, one `[HH:MM:SS] text` line per caption, with the repetition of YouTube's rolling auto-captions removed. Take timestamps from here.
- `video-info.json`: the video's `id`, `title`, `channel`, `duration` and canonical URL, which `generate-json-stub` copies into the recap's `video` fields.
- `transcript.<lang>.srt`: the raw subtitles, kept for reference.

It prefers subtitles uploaded by the creator, which are punctuated and accurate, and falls back to auto-generated captions. It reports which one it used; mention auto-generated captions as a caveat, since names and terms may be misheard.

If `fetch` fails with an age or login restriction, retry with browser cookies: `RECAP_COOKIES_FROM_BROWSER=chrome npx --yes {{PACKAGE_SPEC}} fetch "VIDEO_URL"`. If YouTube answers `429 Too Many Requests`, wait a few minutes before retrying. If no transcript can be obtained at all, stop and tell the user: a recap invented without the transcript would misrepresent the video.

## Recap Data

`generate-json-stub` writes `video-recap-data.json` with the `video` fields already filled in and a `TODO` for everything you write. Keep the `video` fields as they are, replace each `TODO`, and add as many highlights, sections and points as the video needs; the stub has one of each only to show the shape.

Every timepoint has `time` as `HH:MM:SS` and `seconds` as the same moment in total seconds (`00:04:07` is `247`). `validate` checks the schema and that the two agree. A mismatch would make the player jump to the wrong moment, so fix the data rather than the check.

## Analysis Goals

1. **Abstract**: 1–2 sentences on what the video is about and why it matters.
2. **Main takeaway**: the single strongest idea, argument, or conclusion.
3. **Highlights**: the moments most worth jumping to, shown as "Key moments" above the chapters. How many depends on the video: a dense talk has more than a slow interview. Pick each one from your section points and repeat it with the same `seconds`; the app marks the matching section point as "Key".
4. **Sections**: the video's logical parts in order, each with timestamped key points. A chapter starts at its first point, so begin each section with the moment that part of the video starts.
5. **Conclusion**: a short synthesis of the main message, implication, or call to action.

Quality guidelines:

- Preserve the video's logical flow.
- Take timestamps from the transcript cues so they land where the point is actually made.
- Be concise but comprehensive. Pick the moments that best support understanding and navigation rather than listing everything.
- Write titles as complete short phrases and let the description add what the title doesn't say.

A highlight tells the user what they will learn by jumping there. Compare:

```json
{
  "time": "00:12:40",
  "seconds": 760,
  "title": "Benchmarks",
  "description": "The speaker talks about performance."
}
```

```json
{
  "time": "00:12:40",
  "seconds": 760,
  "title": "Rewrite cuts startup time from 4s to 300ms",
  "description": "Most of the gain comes from loading fonts lazily, not from the new language."
}
```

The first could describe any video; the second gives a reason to watch that moment. Sections follow the same idea, with points that carry the argument. The highlight above is repeated here as the section's second point:

```json
{
  "title": "What the rewrite bought",
  "points": [
    {
      "time": "00:11:15",
      "seconds": 675,
      "title": "Measuring before and after on the same laptop",
      "description": "Both builds run on a five-year-old machine so the numbers reflect real users."
    },
    {
      "time": "00:12:40",
      "seconds": 760,
      "title": "Rewrite cuts startup time from 4s to 300ms",
      "description": "Most of the gain comes from loading fonts lazily, not from the new language."
    }
  ]
}
```

## The Link

`link` validates the JSON, encodes it, saves the link to `preview_url.txt`, opens it in the browser and prints it:

```
http://localhost:5173/preview#v=1&d=<payload>
```

- `RECAP_APP_URL` points the link at a different app instance (default `http://localhost:5173/preview`).
- `RECAP_NO_OPEN=1` skips opening the browser, for example on a headless machine.

Don't construct links by hand; always use `link`.

Once `link` succeeds, reply with the link. If the transcript came from auto-generated captions, add one line above it saying so.
