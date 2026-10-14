type SubtitleFormat = {
  name?: string;
};

export type TranscriptMetadata = {
  id?: string;
  title?: string;
  channel?: string;
  duration?: number;
  webpage_url?: string;
  language?: string | null;
  subtitles?: Record<string, SubtitleFormat[]> | null;
  automatic_captions?: Record<string, SubtitleFormat[]> | null;
};

export type TranscriptTrack = {
  code: string;
  name: string;
  source: "uploaded subtitles" | "auto-generated captions";
  original: boolean;
};

export class TranscriptCatalog {
  private constructor(
    private tracks: TranscriptTrack[],
    private videoLanguage?: string | null,
  ) {}

  static from(metadata: TranscriptMetadata) {
    const uploaded = TranscriptCatalog.tracksFrom(
      metadata.subtitles,
      "uploaded subtitles",
    );
    const automatic = TranscriptCatalog.tracksFrom(
      metadata.automatic_captions,
      "auto-generated captions",
    );

    /**
     * Order of importance:
     * - Creator uploaded
     * - generated from original audio
     * - translated/generated variant
     */
    return new TranscriptCatalog(
      [
        ...uploaded,
        ...automatic.filter((track) => track.original),
        ...automatic.filter((track) => !track.original),
      ],
      metadata.language,
    );
  }

  candidateTracks(requestedLanguage?: string): TranscriptTrack[] {
    const original =
      (this.videoLanguage && this.transcriptForLanguage(this.videoLanguage)) ||
      this.tracks.find((track) => track.original);

    const candidates = requestedLanguage
      ? [
          this.transcriptForLanguage(requestedLanguage),
          this.transcriptForLanguage("en"),
          original,
        ]
      : [original, this.transcriptForLanguage("en"), this.tracks[0]];

    return candidates.filter(
      (track, index): track is TranscriptTrack =>
        Boolean(track) && candidates.indexOf(track) === index,
    );
  }

  private transcriptForLanguage(code: string) {
    return this.tracks.find((track) => this.isLanguage(track, code));
  }

  private isLanguage(track: TranscriptTrack, code: string) {
    return (
      TranscriptCatalog.languageCode(track.code) ===
      TranscriptCatalog.languageCode(code)
    );
  }

  private static tracksFrom(
    tracks: Record<string, SubtitleFormat[]> | null | undefined,
    source: TranscriptTrack["source"],
  ) {
    return Object.entries(tracks ?? {})
      .filter(([code]) => code !== "live_chat")
      .map(([code, formats]) => ({
        code,
        name: formats[0]?.name ?? code,
        source,
        original: code.toLowerCase().endsWith("-orig"),
      }));
  }

  /**
   * Reduces a BCP 47 or yt-dlp language code to its base language:
   * `en` → `en`, `pt-BR` → `pt`, `zh-Hans` → `zh`, `en-orig` → `en`.
   */
  private static languageCode(code: string) {
    return code
      .toLowerCase()
      .replace(/-orig$/, "")
      .split("-")[0];
  }
}
