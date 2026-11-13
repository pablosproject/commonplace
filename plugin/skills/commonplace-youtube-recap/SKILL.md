---
name: commonplace-youtube-recap
description: Summarize a YouTube video or ID into a skimmable recap with seekable timestamps and a Commonplace share link. Use for video summaries, key moments, chapters, or deciding whether a video is worth watching.
license: MIT
compatibility: Requires Node.js 20+ with npx, Python 3.10+ for the bundled yt-dlp, and ffmpeg for subtitle conversion.
---

## Purpose

Turn a YouTube video into a recap that helps the user:

- Quickly understand what the video is about.
- Decide whether it is worth watching.
- Find the most valuable moments.
- Jump straight to those moments in the Commonplace web app's embedded player.

The deliverable is a **share link** and its expiry date. The CLI encrypts the recap on the user's machine and uploads only the encrypted recap to Commonplace, which stores it until the link expires. The decryption key stays in the link, after the `#`, so the server cannot read the recap: anyone with the full link can. The task is finished when the user has that link.

## Language

Use an explicitly requested language for the recap. Accept language names or codes from the user's request and convert names to a BCP 47 language tag: an ISO 639 language code with an optional script or region subtag. For example, convert `Italian` to `it`, `Brazilian Portuguese` to `pt-BR` and `Simplified Chinese` to `zh-Hans`. Without an explicit language, write the recap in English.

Pass `--language CODE` to `fetch` only when the user explicitly chose a language.

## Progress

Fetching and writing take a few minutes, and the user sees nothing while commands run. Send one short checklist line as its own message as soon as each step finishes, before running the next command, so the user can follow along:

```text
✓ fetch     transcript · en · uploaded subtitles
✓ write     summary, takeaway, 9 highlights, 4 sections
✓ link      expires 2026-11-26
```

Write the lines in the user's language. Include only facts that help the user, such as the transcript's language (the primary subtag of `fetch`'s language, like `en`), whether captions were auto-generated, and how many highlights and sections you wrote. Mention prerequisites and validation only when they fail. Mark a failed step with `✗` and its reason before retrying or stopping.

The user has already seen the checklist, so don't repeat it in the final reply.

## Run

Check `node --version` (20+), `python3 --version` (3.10+), and `ffmpeg -version` before fetching. If the default Python is older, put an installed newer Python first on `PATH`; on Homebrew macOS, `PATH="/opt/homebrew/bin:$PATH"` may work. Explain missing prerequisites rather than installing them without the user's request.

Use a per-video folder outside the Git checkout unless the user chose an output location. Run these commands from that folder:

```bash
npx --yes commonplace-cli@latest fetch "VIDEO_URL" [--language BCP_47_TAG]
npx --yes commonplace-cli@latest generate-json-stub
# Fill video-recap-data.json from transcript.txt before continuing.
npx --yes commonplace-cli@latest link
```

The first `npx` run may take longer while it fetches the CLI and yt-dlp. `link` validates the recap; run `npx --yes commonplace-cli@latest validate` while iterating when separate diagnostics help.

`fetch` writes `transcript.txt` with `[HH:MM:SS]` cues and `video-info.json` with the video's details. If it reports that it used auto-generated captions, mention that names and terms may be misheard. Retry a transient fetch failure once promptly. If no transcript is available, explain that a faithful recap cannot be made.

Replace every `TODO` in `video-recap-data.json` using the transcript, and preserve the stub's `video` fields. Add as many highlights, sections, and points as the video warrants. Take timestamps from transcript cues: each `time` is `HH:MM:SS`, and `seconds` is the same moment in total seconds (`00:04:07` is `247`). A section begins at its first point. Choose highlights from section points and repeat the same `seconds` so the app marks them as key moments.

## Recap quality

1. **Abstract:** One or two sentences on what the video is about and why it matters.
2. **Main takeaway:** The single strongest idea, argument, or conclusion.
3. **Highlights:** The moments most worth jumping to; choose the number to fit the video's density.
4. **Sections:** The logical parts in order, each with timestamped points that carry the argument.
5. **Conclusion:** A short synthesis of the message, implication, or call to action.

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

## Deliver the link

`link` encrypts and uploads the recap, saves the share link to `preview_url.txt` and prints `Share link:` and `Expires:` in its tool result. It also opens a private page in the browser where the user can invalidate the link. Run it as a tool call without redirecting or filtering its output, and copy the share link from that result; do not construct or regenerate it by hand.

Choose the options from the user's request:

- A lifetime, such as "for a week" or "for a year": pass `--ttl` with a whole number followed by `h`, `d` or `y`, such as `--ttl 7d`. The default is 15 days and the maximum 2 years; if the user asks for longer, use `--ttl 2y` and say so.
- A permanent, unencrypted or long link, or one that isn't stored on a server: run `link --public`. It prints the long preview link, which holds the recap itself, and uploads nothing. `--ttl` doesn't apply.

If `link` says it couldn't reach the short-link service, run `link --public` and tell the user the short-link service was unavailable, so they got a long link that holds the recap unencrypted and that some chat apps may cut off. If the service refused the recap, report its message and stop.

In the final reply, give a brief takeaway, the share link, the manage link and the expiry date, exactly as `link` printed them. Label the manage link as private: it lets the user invalidate the share link and should not be shared. For a `--public` link, point to the opened preview or tool result instead; if neither is accessible to the user, include the full URL once from `preview_url.txt`. `RECAP_SHARE_URL` and `RECAP_APP_URL` target another app instance; `RECAP_NO_OPEN=1` skips browser opening when unavailable.
