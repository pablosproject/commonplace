import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useParams } from "react-router-dom";
import { api } from "../../shared/api/client";
import type { LoadState } from "../../shared/lib/load-state";
import { EmptyState } from "../../shared/ui/EmptyState";
import { trackPointer } from "./pointer";
import { RecapPlayer } from "./RecapPlayer";
import { TimepointList } from "./TimepointList";
import {
  BackLink,
  ConclusionSection,
  Content,
  ContentGrid,
  DetailMessagePage,
  DetailPage,
  DetailShell,
  DockResizer,
  Eyebrow,
  HeroTakeaway,
  NotesPane,
  Source,
  Subtitle,
  SummaryFooter,
  SummaryHeader,
  SummarySection,
  VideoPane,
} from "./VideoDetailPage.styles";
import { collectTimepoints, findActiveTime } from "./timepoints";
import type { SeekRequest } from "./types";

const MIN_DOCK_WIDTH = 360;
const MIN_NOTES_WIDTH = 420;
const EDGE_PADDING = 16;

export function VideoDetailPage() {
  const { youtubeVideoId } = useParams();
  const [videoState, setVideoState] = useState<LoadState<VideoDetail>>({
    status: "loading",
  });
  const [activeTime, setActiveTime] = useState(0);
  const [dockWidth, setDockWidth] = useState<number | null>(null);
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
          setActiveTime(0);
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

  const syncPlayingTime = useCallback(
    (seconds: number) => {
      setActiveTime(findActiveTime(timepoints, seconds));
    },
    [timepoints],
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

  const title = recap?.video?.title ?? videoState.data.title;
  const abstract = recap?.abstract ?? videoState.data.abstract;
  const takeaway = recap?.mainTakeaway ?? videoState.data.mainTakeaway;
  const highlights = recap?.highlights ?? [];
  const sections = recap?.sections ?? [];

  const seekTo = (seconds: number) => {
    setActiveTime(seconds);
    setSeekRequest((request) => ({
      seconds,
      nonce: request.nonce + 1,
    }));
  };

  const shellStyle = dockWidth
    ? ({ "--dock-width": `${dockWidth}px` } as CSSProperties)
    : undefined;

  const startDockResize = (event: ReactPointerEvent<HTMLDivElement>) => {
    const startX = event.clientX;
    const startWidth = dockWidth ?? defaultDockWidth();

    trackPointer(event, "split-resizing", (moveEvent) => {
      setDockWidth(clampDockWidth(startWidth - (moveEvent.clientX - startX)));
    });
  };

  return (
    <DetailPage>
      <DetailShell data-floating={isPlayerFloating} style={shellStyle}>
        <NotesPane>
          <SummaryHeader>
            <nav aria-label="Detail navigation">
              <BackLink to="/">← Back to search</BackLink>
            </nav>
            <Eyebrow>YouTube Summary</Eyebrow>
            <h1>{title}</h1>
            <Subtitle>{abstract}</Subtitle>
            <Source>
              <a href={videoState.data.url} target="_blank" rel="noopener">
                Watch on YouTube
              </a>
            </Source>

            <HeroTakeaway>
              <h2>Main Takeaway</h2>
              <p>{takeaway}</p>
            </HeroTakeaway>
          </SummaryHeader>

          <Content>
            <ContentGrid>
              <SummarySection>
                <h2>Key Highlights</h2>
                <TimepointList
                  points={highlights}
                  activeTime={activeTime}
                  onSeek={seekTo}
                  videoUrl={videoState.data.url}
                />
              </SummarySection>

              {sections.map((section, index) => (
                <SummarySection key={`${section.title ?? "section"}-${index}`}>
                  <h2>{section.title ?? `Section ${index + 1}`}</h2>
                  <TimepointList
                    points={section.points ?? []}
                    activeTime={activeTime}
                    onSeek={seekTo}
                    videoUrl={videoState.data.url}
                  />
                </SummarySection>
              ))}

              {recap?.conclusion ? (
                <ConclusionSection>
                  <h2>Conclusion</h2>
                  <p>{recap.conclusion}</p>
                </ConclusionSection>
              ) : null}
            </ContentGrid>

            {recap?.footerText ? (
              <SummaryFooter>{recap.footerText}</SummaryFooter>
            ) : null}
          </Content>
        </NotesPane>

        <VideoPane data-floating={isPlayerFloating} aria-label="Video panel">
          {!isPlayerFloating ? (
            <DockResizer
              title="Drag to resize the split"
              onPointerDown={startDockResize}
            />
          ) : null}
          <RecapPlayer
            activeTime={activeTime}
            isFloating={isPlayerFloating}
            seekRequest={seekRequest}
            title={title}
            youtubeVideoId={youtubeVideoId}
            onFloatingChange={setIsPlayerFloating}
            onPlaybackTime={syncPlayingTime}
          />
        </VideoPane>
      </DetailShell>
    </DetailPage>
  );
}

function DetailMessage({ message }: { message: string }) {
  return (
    <DetailMessagePage>
      <BackLink to="/">Back to library</BackLink>
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

function defaultDockWidth() {
  return Math.round(window.innerWidth * 0.5);
}

function clampDockWidth(width: number) {
  return Math.max(MIN_DOCK_WIDTH, Math.min(width, maxDockWidth()));
}

function maxDockWidth() {
  return Math.max(
    MIN_DOCK_WIDTH,
    window.innerWidth - MIN_NOTES_WIDTH - EDGE_PADDING * 3,
  );
}
