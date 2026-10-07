---
name: youtube-recap
description: Summarize a YouTube video into a structured recap (summary, main takeaway, timestamped highlights and chapters, conclusion) and return a link that opens it in the recap web app with an embedded, seekable player. Use this whenever the user shares a YouTube URL or video ID and wants a summary, recap, TL;DR, key moments, chapters, timestamps, or wants to know whether a video is worth watching, even if they don't say "recap".
license: MIT
compatibility: Requires Node.js 20+ with npx, Python 3.9+ (for the bundled yt-dlp) and ffmpeg (for subtitle conversion); the CLI is fetched from npm on first use and supplies yt-dlp for transcripts.
allowed-tools: Bash(npx *)
---

<!-- managed-by: {{PACKAGE_NAME}}@{{PACKAGE_VERSION}} -->

## Purpose

Turn a YouTube video into a recap that helps the user:

- Quickly understand what the video is about.
- Decide whether it is worth watching.
- Find the most valuable moments.
- Jump straight to those moments in the recap web app's embedded player.

The deliverable is a **preview link**. The recap data travels inside the link itself, in the URL fragment, so nothing is uploaded or stored anywhere: the web app decodes and renders it in the browser. The task is finished when the user has that link.

## Steps

Work in a per-video folder (for example `./<video-title-slug>/`) and run every command from there:

```bash
npx --yes {{PACKAGE_SPEC}} fetch "VIDEO_URL"     # 1. transcript and video info
npx --yes {{PACKAGE_SPEC}} generate-json-stub    # 2. optional skeleton
# 3. read transcript.txt and video-info.json, write video-recap-data.json
npx --yes {{PACKAGE_SPEC}} validate              # 4. check while iterating
npx --yes {{PACKAGE_SPEC}} link                  # 5. build, save and open the link
```

Use the package spec above for every command; it was chosen when the skill was installed. Nothing needs to be installed in the skill folder.

## Transcript Acquisition

`fetch` writes three files:

- `transcript.txt`: the transcript to read, one `[HH:MM:SS] text` line per caption, with the repetition of YouTube's rolling auto-captions removed. Take timestamps from here.
- `video-info.json`: the video's `id`, `title`, `channel`, `duration` (seconds) and canonical `webpage_url`. Use these for the recap's `video` fields rather than guessing them from the URL or the transcript; a `youtu.be` link and a `watch?v=` link give the same `id`.
- `transcript.<lang>.srt`: the raw subtitles, kept for reference.

It prefers subtitles uploaded by the creator, which are punctuated and accurate, and falls back to auto-generated captions. It reports which one it used; mention auto-generated captions as a caveat, since names and terms may be misheard.

If `fetch` fails with an age or login restriction, retry with browser cookies: `RECAP_COOKIES_FROM_BROWSER=chrome npx --yes {{PACKAGE_SPEC}} fetch "VIDEO_URL"`. If YouTube answers `429 Too Many Requests`, wait a few minutes before retrying. If no transcript can be obtained at all, stop and tell the user: a recap invented without the transcript would misrepresent the video.

## Recap Data

Write `video-recap-data.json` conforming to the recap shape below. `generate-json-stub` optionally creates a skeleton if the file does not exist yet. This JSON is the whole recap: the web app renders exactly what is in it.

Required top-level fields: `schemaVersion` (`"1.0"`), `video` (`id`, `url`, `title`, optional `channel` and `duration`), `abstract`, `mainTakeaway`, `highlights`, `sections`, `conclusion`.

Every highlight and section point has:

- `time` as `HH:MM:SS` (zero-padded, e.g. `00:04:07`)
- `seconds`, the same moment as total seconds (`247`)
- `title`
- `description`

`validate` checks the schema and that every `seconds` matches its `time`. A mismatch would make the player jump to the wrong moment, so fix the data rather than the check.

## Analysis Goals

1. **Abstract**: 1–2 sentences on what the video is about and why it matters.
2. **Main takeaway**: the single strongest idea, argument, or conclusion.
3. **Highlights**: the most interesting or valuable moments, each timestamped. These help the user decide where to jump first, so prefer specific moments over generic ones.
4. **Sections**: the video's logical parts in order, each with timestamped key points.
5. **Conclusion**: a short synthesis of the main message, implication, or call to action.

Quality guidelines:

- Preserve the video's logical flow.
- Prefer specific, useful highlights over generic chapter titles.
- Take timestamps from the transcript cues so they land where the point is actually made.
- Be concise but comprehensive. Pick the moments that best support understanding and navigation rather than listing everything.
- Use `emphasis` on a point for phrases worth highlighting.

## The Link

`link` validates the JSON, encodes it and prints:

```
http://localhost:5173/preview#v=1&d=<payload>
```

It also saves the link to `preview_url.txt` and opens it in the browser.

- `RECAP_APP_URL` points the link at a different app instance (default `http://localhost:5173/preview`).
- `RECAP_NO_OPEN=1` skips opening the browser, for example on a headless machine.
- `encode` prints the encoded recap as JSON (`version`, `payload`, `hash`) instead of a full URL, for tools that build the link themselves.

Things to know when reporting the link:

- The default app address is the local development server, so the link opens only on a machine running the recap web app.
- The link is long (typically 3–6 KB). Opening it directly works; some chat apps truncate long links when pasted.
- Anyone with the link can read the recap: it is compressed, not encrypted.

Don't construct links by hand; always use `link` or `encode`.

## Final Response

Answer what the user actually asked first, then hand over the link. If they asked "is this worth watching?", lead with the verdict; if they wanted key moments, list the few best ones with timestamps. The recap page holds the full detail, so the reply stays short.

The link is several kilobytes of encoded text and wraps across dozens of lines in a terminal. Anything after it is easy to miss, so it goes **last**, alone on its line, with nothing after it. Before it, say where else it lives (`preview_url.txt`) so the user can copy it from the file instead.

Shape:

```
<answer to the user's question: verdict, main takeaway, or top 3–5 moments with timestamps>

<caveats, only those that apply: auto-generated captions; the link opens only where the recap app runs (localhost) — matters if they plan to share it; long links can be cut off by chat apps>

Recap data: <path>/video-recap-data.json (regenerate the link any time with the `link` command). Link also saved in <path>/preview_url.txt.

<the preview link>
```
