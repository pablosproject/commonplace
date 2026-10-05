import {
  ChapterNumber,
  HeadingAside,
  NotesSection,
  SectionHeading,
} from "./RecapView.styles";
import { TimepointList } from "./TimepointList";
import { formatTime, type Chapter } from "./timepoints";
import type { Layout } from "./LayoutSwitch";

type ChapterSectionProps = {
  activeTime: number;
  chapter: Chapter;
  keySeconds: Set<number>;
  layout: Layout;
  onSeek: (seconds: number) => void;
  videoUrl: string;
};

export function ChapterSection({
  activeTime,
  chapter,
  keySeconds,
  layout,
  onSeek,
  videoUrl,
}: ChapterSectionProps) {
  return (
    <NotesSection aria-labelledby={`chapter-${chapter.number}`}>
      <SectionHeading>
        <ChapterNumber>
          {chapter.number.toString().padStart(2, "0")}
        </ChapterNumber>
        <h2 id={`chapter-${chapter.number}`}>{chapter.title}</h2>
        <HeadingAside data-mono="true">
          {formatTime(chapter.start)}
          {layout === "reader" ? ` – ${formatTime(chapter.end)}` : null}
        </HeadingAside>
      </SectionHeading>
      <TimepointList
        points={chapter.points}
        keySeconds={keySeconds}
        activeTime={activeTime}
        onSeek={onSeek}
        videoUrl={videoUrl}
      />
    </NotesSection>
  );
}
