# Commonplace

A commonplace book for video. This plugin adds the `commonplace-youtube-recap` skill: give your agent a YouTube URL and it writes a recap (summary, main takeaway, timestamped highlights and chapters, conclusion) and returns a short link that opens it on [commonplace.video](https://commonplace.video) next to a seekable player.

## Requirements

The skill runs on your machine, so it works in local agents such as Claude Code. It needs Node.js 20+ with `npx`, Python 3.10+ (for the bundled yt-dlp) and ffmpeg. It runs the [`commonplace-cli`](https://www.npmjs.com/package/commonplace-cli) npm package.

## Privacy

The recap is encrypted on your machine before upload; the key stays in the link, so the server can't read it. Links expire after 15 days by default. Optionally, yt-dlp can read YouTube cookies from a browser you name with `RECAP_COOKIES_FROM_BROWSER`; nothing else is read from your machine. Details: [sharing and privacy](https://github.com/pablosproject/commonplace/blob/master/docs/sharing.md).

See the [skill README](skills/commonplace-youtube-recap/README.md) for usage and options.

## License

MIT
