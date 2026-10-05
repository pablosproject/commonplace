import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { useMediaQuery } from "../lib/useMediaQuery";
import { ThemeSelect } from "../ui/ThemeSelect";
import { TopBar } from "../ui/TopBar";
import { ChapterSection } from "./ChapterSection";
import { LayoutSwitch, useLayout, type Layout } from "./LayoutSwitch";
import { PlaybackPanel } from "./PlaybackPanel";
import { RecapIntro } from "./RecapIntro";
import { RecapPlayer } from "./RecapPlayer";
import { TimepointList } from "./TimepointList";
import {
  Breadcrumb,
  Footer,
  HeadingAside,
  Label,
  NotesColumn,
  NotesScroll,
  NotesSection,
  PullQuote,
  RecapPage,
  RecapShell,
  SectionHeading,
  SideResizer,
  VideoColumn,
  WatchLink,
} from "./RecapView.styles";
import {
  buildChapters,
  collectTimepoints,
  findActiveTime,
  formatTime,
} from "./timepoints";
import type { Recap, SeekRequest } from "./types";
import { useSideResize } from "./useSideResize";

const NARROW_QUERY = "(max-width: 980px)";

type RecapViewProps = {
  nav?: ReactNode;
  recap: Recap;
};

export function RecapView({ nav, recap }: RecapViewProps) {
  const [playbackSeconds, setPlaybackSeconds] = useState(0);
  const [savedLayout, setLayout] = useLayout();
  const isNarrow = useMediaQuery(NARROW_QUERY);
  const layout: Layout = isNarrow ? "watch" : savedLayout;
  const { currentSideWidth, resetSideWidth, startSideResize } =
    useSideResize(layout);
  const [isPlayerFloating, setIsPlayerFloating] = useState(false);
  const [seekRequest, setSeekRequest] = useState<SeekRequest>({
    seconds: 0,
    nonce: 0,
  });

  const timepoints = useMemo(
    () => collectTimepoints(recap.highlights, recap.sections),
    [recap],
  );
  const durationSeconds = recap.video.duration?.seconds ?? null;
  const chapters = useMemo(
    () => buildChapters(recap.sections, durationSeconds),
    [recap, durationSeconds],
  );
  const keySeconds = useMemo(
    () => new Set(recap.highlights.map((point) => point.seconds)),
    [recap],
  );

  const title = recap.video.title;
  const channel = recap.video.channel;
  const activeTime = findActiveTime(timepoints, playbackSeconds);
  const meta = [channel, durationSeconds ? formatTime(durationSeconds) : null]
    .filter(Boolean)
    .join(" · ");
  const videoUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(recap.video.id)}`;

  const seekTo = (seconds: number) => {
    setPlaybackSeconds(seconds);
    setSeekRequest((request) => ({
      seconds,
      nonce: request.nonce + 1,
    }));
  };

  const changeLayout = (nextLayout: Layout) => {
    setLayout(nextLayout);
    resetSideWidth();
  };

  const intro = (
    <RecapIntro
      abstract={recap.abstract}
      mainTakeaway={recap.mainTakeaway}
      meta={meta}
      title={title}
    />
  );

  return (
    <RecapPage>
      <TopBar>
        {nav}
        <Breadcrumb>{title}</Breadcrumb>
        <WatchLink href={videoUrl} target="_blank" rel="noopener">
          <span>Watch on YouTube</span>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 17L17 7M8 7h9v9" />
          </svg>
        </WatchLink>
        <LayoutSwitch layout={savedLayout} onChange={changeLayout} />
        <ThemeSelect />
      </TopBar>

      <RecapShell
        data-layout={layout}
        data-floating={isPlayerFloating}
        style={{ "--side-width": `${currentSideWidth}px` } as CSSProperties}
      >
        <VideoColumn aria-label="Video">
          <RecapPlayer
            isFloating={isPlayerFloating}
            seekRequest={seekRequest}
            title={title}
            youtubeVideoId={recap.video.id}
            onFloatingChange={setIsPlayerFloating}
            onPlaybackTime={setPlaybackSeconds}
          >
            <PlaybackPanel
              activeTime={activeTime}
              chapters={chapters}
              durationSeconds={durationSeconds}
              layout={layout}
              onSeek={seekTo}
              playbackSeconds={playbackSeconds}
              timepoints={timepoints}
            />
          </RecapPlayer>
          {layout === "watch" ? intro : null}
        </VideoColumn>

        <NotesColumn>
          <NotesScroll>
            {layout === "reader" ? intro : null}

            <NotesSection aria-labelledby="key-moments">
              <SectionHeading>
                <h2 id="key-moments">Key moments</h2>
                <HeadingAside>{recap.highlights.length}</HeadingAside>
              </SectionHeading>
              <TimepointList
                points={recap.highlights}
                activeTime={activeTime}
                onSeek={seekTo}
                videoUrl={videoUrl}
              />
            </NotesSection>

            {chapters.map((chapter) => (
              <ChapterSection
                key={chapter.number}
                activeTime={activeTime}
                chapter={chapter}
                keySeconds={keySeconds}
                layout={layout}
                onSeek={seekTo}
                videoUrl={videoUrl}
              />
            ))}

            <PullQuote>
              <Label>Conclusion</Label>
              <p>{recap.conclusion}</p>
            </PullQuote>

            {recap.footerText ? <Footer>{recap.footerText}</Footer> : null}
          </NotesScroll>
        </NotesColumn>

        {layout === "reader" && isPlayerFloating ? null : (
          <SideResizer title="Drag to resize" onPointerDown={startSideResize} />
        )}
      </RecapShell>
    </RecapPage>
  );
}
