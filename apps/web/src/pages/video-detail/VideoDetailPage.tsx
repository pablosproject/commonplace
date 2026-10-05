import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useParams } from "react-router-dom";
import { api } from "../../shared/api/client";
import type { LoadState } from "../../shared/lib/load-state";
import { useMediaQuery } from "../../shared/lib/useMediaQuery";
import { EmptyState } from "../../shared/ui/EmptyState";
import { ThemeSelect } from "../../shared/ui/ThemeSelect";
import { TopBar } from "../../shared/ui/TopBar";
import { LayoutSwitch, useLayout, type Layout } from "./LayoutSwitch";
import { PlaybackPanel } from "./PlaybackPanel";
import { trackPointer } from "./pointer";
import { RecapPlayer } from "./RecapPlayer";
import { TimepointList } from "./TimepointList";
import {
  Abstract,
  BackLink,
  Breadcrumb,
  ChapterNumber,
  DetailMessagePage,
  DetailPage,
  DetailShell,
  Footer,
  HeadingAside,
  Intro,
  Label,
  Meta,
  NotesColumn,
  NotesScroll,
  NotesSection,
  PullQuote,
  SectionHeading,
  Separator,
  SideResizer,
  VideoColumn,
  WatchLink,
} from "./VideoDetailPage.styles";
import {
  buildChapters,
  collectTimepoints,
  findActiveTime,
  formatTime,
} from "./timepoints";
import type { SeekRequest } from "./types";

const DEFAULT_SIDE_WIDTH: Record<Layout, number> = { reader: 540, watch: 480 };
const MIN_SIDE_WIDTH = 360;
const MIN_MAIN_WIDTH = 420;
const EDGE_PADDING = 16;
const NARROW_QUERY = "(max-width: 980px)";

export function VideoDetailPage() {
  const { youtubeVideoId } = useParams();
  const [videoState, setVideoState] = useState<LoadState<VideoDetail>>({
    status: "loading",
  });
  const [playbackSeconds, setPlaybackSeconds] = useState(0);
  const [savedLayout, setLayout] = useLayout();
  const isNarrow = useMediaQuery(NARROW_QUERY);
  const layout: Layout = isNarrow ? "watch" : savedLayout;
  const [sideWidth, setSideWidth] = useState<number | null>(null);
  const [isPlayerFloating, setIsPlayerFloating] = useState(false);
  const [seekRequest, setSeekRequest] = useState<SeekRequest>({
    seconds: 0,
    nonce: 0,
  });

  useEffect(() => {
    if (!youtubeVideoId) {
      return;
    }

    let cancelled = false;

    setVideoState({ status: "loading" });
    fetchVideo(youtubeVideoId)
      .then((video) => {
        if (!cancelled) {
          setVideoState({ status: "ready", data: video });
          setPlaybackSeconds(0);
          setSeekRequest({ seconds: 0, nonce: 0 });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setVideoState({
            status: "error",
            message:
              error instanceof Error ? error.message : "Could not load recap.",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [youtubeVideoId]);

  const video = videoState.status === "ready" ? videoState.data : null;
  const recap = video?.recap?.recapJson ?? null;
  const timepoints = useMemo(
    () => collectTimepoints(recap?.highlights ?? [], recap?.sections ?? []),
    [recap],
  );
  const durationSeconds =
    recap?.video.duration?.seconds ?? video?.durationSeconds ?? null;
  const chapters = useMemo(
    () => buildChapters(recap?.sections ?? [], durationSeconds),
    [recap, durationSeconds],
  );
  const keySeconds = useMemo(
    () => new Set(recap?.highlights.map((point) => point.seconds)),
    [recap],
  );

  if (!youtubeVideoId) {
    return <DetailMessage message="Video not found." />;
  }

  if (videoState.status === "loading") {
    return <DetailMessage message="Loading recap..." />;
  }

  if (videoState.status === "error") {
    return <DetailMessage message={videoState.message} />;
  }

  const title = recap?.video.title ?? videoState.data.title;
  const channel = recap?.video.channel ?? videoState.data.channel;
  const abstract = recap?.abstract ?? videoState.data.abstract;
  const takeaway = recap?.mainTakeaway ?? videoState.data.mainTakeaway;
  const highlights = recap?.highlights ?? [];
  const videoUrl = videoState.data.url;
  const activeTime = findActiveTime(timepoints, playbackSeconds);
  const meta = [channel, durationSeconds ? formatTime(durationSeconds) : null]
    .filter(Boolean)
    .join(" · ");

  const seekTo = (seconds: number) => {
    setPlaybackSeconds(seconds);
    setSeekRequest((request) => ({
      seconds,
      nonce: request.nonce + 1,
    }));
  };

  const currentSideWidth = sideWidth ?? DEFAULT_SIDE_WIDTH[layout];

  const changeLayout = (nextLayout: Layout) => {
    setLayout(nextLayout);
    setSideWidth(null);
  };

  const startSideResize = (event: ReactPointerEvent<HTMLDivElement>) => {
    const startX = event.clientX;

    trackPointer(event, "split-resizing", (moveEvent) => {
      setSideWidth(
        clampSideWidth(currentSideWidth - (moveEvent.clientX - startX)),
      );
    });
  };

  const intro = (
    <Intro>
      {meta ? <Meta>{meta}</Meta> : null}
      <h1>{title}</h1>
      <Abstract>{abstract}</Abstract>
      {takeaway ? (
        <PullQuote data-size="large">
          <Label>The takeaway</Label>
          <p>{takeaway}</p>
        </PullQuote>
      ) : null}
    </Intro>
  );

  return (
    <DetailPage>
      <TopBar>
        <BackLink to="/">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Library
        </BackLink>
        <Separator aria-hidden="true">/</Separator>
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

      <DetailShell
        data-layout={layout}
        data-floating={isPlayerFloating}
        style={{ "--side-width": `${currentSideWidth}px` } as CSSProperties}
      >
        <VideoColumn aria-label="Video">
          <RecapPlayer
            isFloating={isPlayerFloating}
            seekRequest={seekRequest}
            title={title}
            youtubeVideoId={youtubeVideoId}
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

            {highlights.length > 0 ? (
              <NotesSection aria-labelledby="key-moments">
                <SectionHeading>
                  <h2 id="key-moments">Key moments</h2>
                  <HeadingAside>{highlights.length}</HeadingAside>
                </SectionHeading>
                <TimepointList
                  points={highlights}
                  activeTime={activeTime}
                  onSeek={seekTo}
                  videoUrl={videoUrl}
                />
              </NotesSection>
            ) : null}

            {chapters.map((chapter) => (
              <NotesSection
                key={chapter.number}
                aria-labelledby={`chapter-${chapter.number}`}
              >
                <SectionHeading>
                  <ChapterNumber>
                    {chapter.number.toString().padStart(2, "0")}
                  </ChapterNumber>
                  <h2 id={`chapter-${chapter.number}`}>{chapter.title}</h2>
                  <HeadingAside data-mono="true">
                    {formatTime(chapter.start)}
                    {layout === "reader"
                      ? ` – ${formatTime(chapter.end)}`
                      : null}
                  </HeadingAside>
                </SectionHeading>
                <TimepointList
                  points={chapter.points}
                  keySeconds={keySeconds}
                  activeTime={activeTime}
                  onSeek={seekTo}
                  videoUrl={videoUrl}
                />
              </NotesSection>
            ))}

            {recap?.conclusion ? (
              <PullQuote>
                <Label>Conclusion</Label>
                <p>{recap.conclusion}</p>
              </PullQuote>
            ) : null}

            {recap?.footerText ? <Footer>{recap.footerText}</Footer> : null}
          </NotesScroll>
        </NotesColumn>

        {layout === "reader" && isPlayerFloating ? null : (
          <SideResizer title="Drag to resize" onPointerDown={startSideResize} />
        )}
      </DetailShell>
    </DetailPage>
  );
}

function DetailMessage({ message }: { message: string }) {
  return (
    <DetailMessagePage>
      <BackLink to="/">← Back to library</BackLink>
      <EmptyState>{message}</EmptyState>
    </DetailMessagePage>
  );
}

async function fetchVideo(youtubeVideoId: string) {
  const response = await api.api.videos[":youtubeVideoId"].$get({
    param: { youtubeVideoId },
  });

  if (response.status === 404) {
    throw new Error("Video not found.");
  }

  if (!response.ok) {
    throw new Error("Could not load recap.");
  }

  const body = await response.json();

  return body.video;
}

type VideoDetail = Awaited<ReturnType<typeof fetchVideo>>;

function clampSideWidth(width: number) {
  return Math.max(MIN_SIDE_WIDTH, Math.min(width, maxSideWidth()));
}

function maxSideWidth() {
  return Math.max(
    MIN_SIDE_WIDTH,
    window.innerWidth - MIN_MAIN_WIDTH - EDGE_PADDING * 3,
  );
}
