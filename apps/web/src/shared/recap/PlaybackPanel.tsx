import type { Layout } from "./LayoutSwitch";
import {
  ChapterBar,
  ChapterSegment,
  CurrentChapter,
  NextButton,
  NextLabel,
  NextTime,
  NextTitle,
  NowCard,
  NowChapter,
  NowDescription,
  NowTitle,
  PlaybackRow,
  PlaybackTime,
  Progress,
} from "./PlaybackPanel.styles";
import { describePlayback, formatTime, type Chapter } from "./timepoints";
import type { RecapPoint } from "./types";

type PlaybackPanelProps = {
  activeTime: number;
  chapters: Chapter[];
  durationSeconds: number | null;
  layout: Layout;
  onSeek: (seconds: number) => void;
  playbackSeconds: number;
  timepoints: RecapPoint[];
};

export function PlaybackPanel({
  activeTime,
  chapters,
  durationSeconds,
  layout,
  onSeek,
  playbackSeconds,
  timepoints,
}: PlaybackPanelProps) {
  const { chapter, activePoint, next } = describePlayback(
    chapters,
    timepoints,
    activeTime,
  );
  const chapterLabel = chapter
    ? `Chapter ${chapter.number} of ${chapters.length} · ${chapter.title}`
    : null;

  const nextButton = next ? (
    <NextButton type="button" onClick={() => onSeek(next.seconds)}>
      <NextLabel>Up next</NextLabel>
      <NextTime>{formatTime(next.seconds)}</NextTime>
      <NextTitle>{next.title}</NextTitle>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 18l6-6-6-6" />
      </svg>
    </NextButton>
  ) : null;

  return (
    <>
      <Progress>
        <ChapterBar>
          {chapters.map((item) => (
            <ChapterSegment
              key={item.number}
              type="button"
              style={{ flexGrow: Math.max(item.end - item.start, 1) }}
              data-state={segmentState(item, chapter)}
              onClick={() => onSeek(item.start)}
              aria-label={`Jump to chapter ${item.number}: ${item.title}`}
              title={item.title}
            />
          ))}
        </ChapterBar>
        <PlaybackRow>
          <PlaybackTime>
            <span>{formatTime(playbackSeconds)}</span>
            {durationSeconds ? ` / ${formatTime(durationSeconds)}` : null}
          </PlaybackTime>
          {layout === "watch" && chapterLabel ? (
            <CurrentChapter>{chapterLabel}</CurrentChapter>
          ) : null}
          {layout === "watch" ? nextButton : null}
        </PlaybackRow>
      </Progress>

      {layout === "reader" && activePoint ? (
        <NowCard>
          {chapterLabel ? <NowChapter>{chapterLabel}</NowChapter> : null}
          <NowTitle>{activePoint.title}</NowTitle>
          <NowDescription>{activePoint.description}</NowDescription>
        </NowCard>
      ) : null}
      {layout === "reader" ? nextButton : null}
    </>
  );
}

function segmentState(item: Chapter, current: Chapter | undefined) {
  if (item === current) {
    return "current";
  }

  return current && item.start < current.start ? "past" : "future";
}
