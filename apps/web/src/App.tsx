import { hc } from "hono/client";
import {
  CSSProperties,
  FormEvent,
  MouseEvent,
  PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { AppType } from "../../api/src/app";
import "./App.css";

const api = hc<AppType>("/");
const FLOAT_WIDTH_RATIO = 0.31;
const MIN_FLOAT_WIDTH = 280;
const EDGE_PADDING = 16;
const ACTIVE_SYNC_INTERVAL_MS = 500;

type LoadState<T> =
  | { status: "loading" }
  | { status: "ready"; data: T }
  | { status: "error"; message: string };

type RecapPoint = {
  time?: string;
  seconds?: number;
  title?: string;
  description?: string;
};

type RecapSection = {
  title?: string;
  points?: RecapPoint[];
};

type RecapData = {
  abstract?: string;
  conclusion?: string;
  footerText?: string;
  highlights?: RecapPoint[];
  mainTakeaway?: string;
  sections?: RecapSection[];
  video?: {
    id?: string;
    url?: string;
    title?: string;
    channel?: string;
    duration?: {
      seconds?: number;
      formatted?: string;
    };
  };
};

type SeekRequest = {
  seconds: number;
  nonce: number;
};

type FloatState = {
  left: number;
  top: number;
  width: number;
  customSize: boolean;
};

type YouTubePlayer = {
  destroy?: () => void;
  getCurrentTime?: () => number;
  playVideo?: () => void;
  seekTo?: (seconds: number, allowSeekAhead: boolean) => void;
};

type YouTubePlayerOptions = {
  videoId: string;
  playerVars: Record<string, string | number>;
  events: {
    onReady: () => void;
    onStateChange: () => void;
  };
};

declare global {
  interface Window {
    YT?: {
      Player: new (
        elementId: string,
        options: YouTubePlayerOptions,
      ) => YouTubePlayer;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

let youtubeApiPromise: Promise<void> | null = null;

export function App() {
  const [locationKey, setLocationKey] = useState(() => currentLocationKey());

  useEffect(() => {
    const onPopState = () => setLocationKey(currentLocationKey());

    window.addEventListener("popstate", onPopState);

    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const route = getRoute(locationKey);

  if (route.name === "detail") {
    return <VideoDetailPage youtubeVideoId={route.youtubeVideoId} />;
  }

  return <BrowsePage query={route.query} />;
}

function BrowsePage({ query }: { query: string }) {
  const [draftQuery, setDraftQuery] = useState(query);
  const [videosState, setVideosState] = useState<LoadState<VideoCards>>({
    status: "loading",
  });

  useEffect(() => {
    setDraftQuery(query);
  }, [query]);

  useEffect(() => {
    let ignore = false;

    setVideosState({ status: "loading" });
    fetchVideos(query)
      .then((videos) => {
        if (!ignore) {
          setVideosState({ status: "ready", data: videos });
        }
      })
      .catch((error: unknown) => {
        if (!ignore) {
          setVideosState({
            status: "error",
            message:
              error instanceof Error ? error.message : "Could not load videos.",
          });
        }
      });

    return () => {
      ignore = true;
    };
  }, [query]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextQuery = draftQuery.trim();
    navigate(nextQuery ? `/?q=${encodeURIComponent(nextQuery)}` : "/");
  };

  const title = query ? `Results for "${query}"` : "Latest video recaps";

  return (
    <main className="app-shell">
      <section className="browse-hero" aria-labelledby="browse-title">
        <div>
          <p className="eyebrow">Video Recaps</p>
          <h1 id="browse-title">
            Find the useful parts before you press play.
          </h1>
          <p className="hero-copy">
            Search indexed YouTube recaps, skim the takeaway, then open the
            detail view to jump straight to highlights and sections.
          </p>
        </div>

        <form className="search-panel" role="search" onSubmit={onSubmit}>
          <label htmlFor="video-search">Search recaps</label>
          <div className="search-row">
            <input
              id="video-search"
              type="search"
              value={draftQuery}
              placeholder="Title, channel, summary, takeaway..."
              onChange={(event) => setDraftQuery(event.target.value)}
            />
            <button type="submit">Search</button>
          </div>
        </form>
      </section>

      <section className="video-library" aria-labelledby="video-library-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Library</p>
            <h2 id="video-library-title">{title}</h2>
          </div>
          {videosState.status === "ready" ? (
            <p className="result-count">
              {videosState.data.length}{" "}
              {videosState.data.length === 1 ? "recap" : "recaps"}
            </p>
          ) : null}
        </div>

        {videosState.status === "loading" ? (
          <p className="empty-state">Loading recaps...</p>
        ) : null}

        {videosState.status === "error" ? (
          <p className="empty-state">{videosState.message}</p>
        ) : null}

        {videosState.status === "ready" && videosState.data.length === 0 ? (
          <p className="empty-state">No recaps match this search yet.</p>
        ) : null}

        {videosState.status === "ready" && videosState.data.length > 0 ? (
          <div className="video-grid">
            {videosState.data.map((video) => (
              <VideoCard key={video.youtubeVideoId} video={video} />
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}

function VideoCard({ video }: { video: VideoCardData }) {
  return (
    <article className="video-card">
      <a
        className="thumbnail-link"
        href={`/videos/${video.youtubeVideoId}`}
        onClick={handleInternalLink}
        aria-label={`Open recap for ${video.title}`}
      >
        <img
          src={youtubeThumbnailUrl(video.youtubeVideoId)}
          alt=""
          loading="lazy"
        />
        {video.durationFormatted ? (
          <span className="duration-chip">{video.durationFormatted}</span>
        ) : null}
      </a>

      <div className="video-card-body">
        <div className="video-meta">
          <span>{video.channel ?? "Unknown channel"}</span>
          <span>0 upvotes</span>
        </div>
        <h3>
          <a
            href={`/videos/${video.youtubeVideoId}`}
            onClick={handleInternalLink}
          >
            {video.title}
          </a>
        </h3>
        <p>{video.abstract}</p>
      </div>
    </article>
  );
}

function VideoDetailPage({ youtubeVideoId }: { youtubeVideoId: string }) {
  const [videoState, setVideoState] = useState<LoadState<VideoDetail>>({
    status: "loading",
  });
  const [activeTime, setActiveTime] = useState(0);
  const [seekRequest, setSeekRequest] = useState<SeekRequest>({
    seconds: 0,
    nonce: 0,
  });

  useEffect(() => {
    let ignore = false;

    setVideoState({ status: "loading" });
    fetchVideo(youtubeVideoId)
      .then((video) => {
        if (!ignore) {
          setVideoState({ status: "ready", data: video });
          setActiveTime(0);
          setSeekRequest({ seconds: 0, nonce: 0 });
        }
      })
      .catch((error: unknown) => {
        if (!ignore) {
          setVideoState({
            status: "error",
            message:
              error instanceof Error ? error.message : "Could not load recap.",
          });
        }
      });

    return () => {
      ignore = true;
    };
  }, [youtubeVideoId]);

  const readyVideo = videoState.status === "ready" ? videoState.data : null;
  const readyRecap = readyVideo ? getRecapData(readyVideo) : null;
  const readyHighlights = readyRecap?.highlights ?? [];
  const readySections = readyRecap?.sections ?? [];
  const timepoints = useMemo(
    () => collectTimepoints(readyHighlights, readySections),
    [readyHighlights, readySections],
  );

  const syncPlayingTime = useCallback(
    (seconds: number) => {
      setActiveTime(findActiveTime(timepoints, seconds));
    },
    [timepoints],
  );

  if (videoState.status === "loading") {
    return (
      <main className="app-shell">
        <p className="empty-state">Loading recap...</p>
      </main>
    );
  }

  if (videoState.status === "error") {
    return (
      <main className="app-shell">
        <a href="/" onClick={handleInternalLink} className="back-link">
          Back to library
        </a>
        <p className="empty-state">{videoState.message}</p>
      </main>
    );
  }

  const video = videoState.data;
  const recap = readyRecap;
  const title = recap?.video?.title ?? video.title;
  const abstract = recap?.abstract ?? video.abstract;
  const takeaway = recap?.mainTakeaway ?? video.mainTakeaway;
  const highlights = readyHighlights;
  const sections = readySections;
  const conclusion = recap?.conclusion;
  const footerText = recap?.footerText;

  const seekTo = (seconds: number) => {
    setActiveTime(seconds);
    setSeekRequest((request) => ({
      seconds,
      nonce: request.nonce + 1,
    }));
  };

  return (
    <main className="detail-shell">
      <article className="recap-pane">
        <a href="/" onClick={handleInternalLink} className="back-link">
          Back to library
        </a>

        <header className="recap-header">
          <p className="eyebrow">YouTube Summary</p>
          <h1>{title}</h1>
          <p className="video-byline">
            {video.channel ?? "Unknown channel"}
            {video.durationFormatted ? ` / ${video.durationFormatted}` : ""}
          </p>
          <p className="hero-copy">{abstract}</p>
          <a href={video.url} target="_blank" rel="noreferrer">
            Watch on YouTube
          </a>
        </header>

        <nav className="recap-nav" aria-label="Recap sections">
          <a href="#highlights">Highlights</a>
          {sections.map((section, index) => (
            <a
              key={`${section.title ?? "section"}-${index}`}
              href={`#${sectionId(index)}`}
            >
              {section.title ?? `Section ${index + 1}`}
            </a>
          ))}
          {conclusion ? <a href="#conclusion">Conclusion</a> : null}
        </nav>

        <section className="takeaway-panel" aria-labelledby="main-takeaway">
          <h2 id="main-takeaway">Main Takeaway</h2>
          <p>{takeaway}</p>
        </section>

        <section className="recap-section" id="highlights">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Fast Scan</p>
              <h2>Key Highlights</h2>
            </div>
          </div>
          <TimepointList
            points={highlights}
            activeTime={activeTime}
            onSeek={seekTo}
            videoUrl={video.url}
          />
        </section>

        {sections.map((section, index) => (
          <section
            className="recap-section"
            id={sectionId(index)}
            key={`${section.title ?? "section"}-${index}`}
          >
            <h2>{section.title ?? `Section ${index + 1}`}</h2>
            <TimepointList
              points={section.points ?? []}
              activeTime={activeTime}
              onSeek={seekTo}
              videoUrl={video.url}
            />
          </section>
        ))}

        {conclusion ? (
          <section className="takeaway-panel" id="conclusion">
            <h2>Conclusion</h2>
            <p>{conclusion}</p>
          </section>
        ) : null}

        {footerText ? <footer>{footerText}</footer> : null}
      </article>

      <RecapPlayer
        activeTime={activeTime}
        seekRequest={seekRequest}
        title={title}
        youtubeVideoId={youtubeVideoId}
        onPlaybackTime={syncPlayingTime}
      />
    </main>
  );
}

function RecapPlayer({
  activeTime,
  onPlaybackTime,
  seekRequest,
  title,
  youtubeVideoId,
}: {
  activeTime: number;
  onPlaybackTime: (seconds: number) => void;
  seekRequest: SeekRequest;
  title: string;
  youtubeVideoId: string;
}) {
  const playerElementId = useMemo(
    () => `youtube-player-${youtubeVideoId}`,
    [youtubeVideoId],
  );
  const cardRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const pendingSeekRef = useRef<number | null>(null);
  const [isFloating, setIsFloating] = useState(false);
  const [status, setStatus] = useState("Ready for timestamps.");
  const [floatState, setFloatState] = useState<FloatState>(() =>
    centerFloatState(defaultFloatWidth(), 0),
  );

  useEffect(() => {
    let ignore = false;
    let syncTimer: number | null = null;

    loadYouTubeApi().then(() => {
      if (ignore || !window.YT) {
        return;
      }

      playerRef.current = new window.YT.Player(playerElementId, {
        videoId: youtubeVideoId,
        playerVars: {
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
        },
        events: {
          onReady: () => {
            syncTimer = window.setInterval(() => {
              const currentTime = playerRef.current?.getCurrentTime?.();

              if (
                typeof currentTime === "number" &&
                !Number.isNaN(currentTime)
              ) {
                onPlaybackTime(currentTime);
              }
            }, ACTIVE_SYNC_INTERVAL_MS);

            const pendingSeek = pendingSeekRef.current;

            if (pendingSeek !== null) {
              if (seekPlayer(playerRef.current, pendingSeek)) {
                pendingSeekRef.current = null;
              }
            }
          },
          onStateChange: () => {
            const currentTime = playerRef.current?.getCurrentTime?.();

            if (typeof currentTime === "number" && !Number.isNaN(currentTime)) {
              onPlaybackTime(currentTime);
            }
          },
        },
      });
    });

    return () => {
      ignore = true;

      if (syncTimer !== null) {
        window.clearInterval(syncTimer);
      }

      playerRef.current?.destroy?.();
      playerRef.current = null;
    };
  }, [onPlaybackTime, playerElementId, youtubeVideoId]);

  useEffect(() => {
    if (seekRequest.nonce === 0) {
      return;
    }

    if (!playerRef.current) {
      pendingSeekRef.current = seekRequest.seconds;
      setStatus(`Queued ${formatTime(seekRequest.seconds)}`);
      return;
    }

    if (seekPlayer(playerRef.current, seekRequest.seconds)) {
      setStatus(`Jumped to ${formatTime(seekRequest.seconds)}`);
      return;
    }

    pendingSeekRef.current = seekRequest.seconds;
    setStatus(`Queued ${formatTime(seekRequest.seconds)}`);
  }, [seekRequest]);

  const floatStyle = isFloating
    ? ({
        "--float-left": `${floatState.left}px`,
        "--float-top": `${floatState.top}px`,
        "--float-width": `${floatState.width}px`,
      } as CSSProperties)
    : undefined;

  const showFloatingPlayer = () => {
    const width = floatState.customSize
      ? floatState.width
      : defaultFloatWidth();
    setFloatState(centerFloatState(width, cardRef.current?.offsetHeight ?? 0));
    setIsFloating(true);
  };

  const resizeFloatingVideo = (nextWidth: number) => {
    setFloatState((state) =>
      clampFloatState({
        ...state,
        width: nextWidth,
        customSize: true,
      }),
    );
  };

  const dragFloatingVideo = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isFloating || event.target instanceof HTMLButtonElement) {
      return;
    }

    const start = {
      x: event.clientX,
      y: event.clientY,
      left: floatState.left,
      top: floatState.top,
    };

    trackPointer(event, "video-dragging", (moveEvent) => {
      setFloatState((state) =>
        clampFloatState({
          ...state,
          left: start.left + moveEvent.clientX - start.x,
          top: start.top + moveEvent.clientY - start.y,
        }),
      );
    });
  };

  const startFloatingResize = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isFloating) {
      showFloatingPlayer();
    }

    const startX = event.clientX;
    const startWidth = floatState.width;

    trackPointer(event, "video-resizing", (moveEvent) => {
      resizeFloatingVideo(startWidth + moveEvent.clientX - startX);
    });
  };

  return (
    <aside
      className={`player-pane ${isFloating ? "video-floating" : ""}`}
      aria-label="Video player"
    >
      <div className="player-slot">
        <div
          className="player-card"
          ref={cardRef}
          style={floatStyle}
          aria-label={`Video player for ${title}`}
        >
          <div
            className="player-heading"
            onPointerDown={dragFloatingVideo}
            title="Drag to move the player while floating"
          >
            <span>Video</span>
            <div className="player-actions" aria-label="Video player controls">
              {!isFloating ? (
                <button
                  className="player-button"
                  type="button"
                  onClick={showFloatingPlayer}
                  aria-label="Float video player"
                >
                  Float
                </button>
              ) : null}
              {isFloating ? (
                <>
                  <button
                    className="player-button"
                    type="button"
                    onClick={() => resizeFloatingVideo(floatState.width * 0.86)}
                    aria-label="Make video smaller"
                  >
                    -
                  </button>
                  <button
                    className="player-button"
                    type="button"
                    onClick={() => resizeFloatingVideo(floatState.width * 1.16)}
                    aria-label="Make video larger"
                  >
                    +
                  </button>
                  <button
                    className="player-button"
                    type="button"
                    onClick={() => setIsFloating(false)}
                    aria-label="Dock video player"
                  >
                    Dock
                  </button>
                </>
              ) : null}
              <span className="player-time">{formatTime(activeTime)}</span>
            </div>
          </div>
          <div className="player-frame">
            <div id={playerElementId} />
          </div>
          <p>
            Click any timestamp to seek the video. Float keeps playback alive
            while you scan the recap.
          </p>
          <p className="now-playing">{status}</p>
          <div
            className="resize-handle"
            onPointerDown={startFloatingResize}
            title="Drag to resize"
          />
        </div>
      </div>
    </aside>
  );
}

function TimepointList({
  activeTime,
  onSeek,
  points,
  videoUrl,
}: {
  activeTime: number;
  onSeek: (seconds: number) => void;
  points: RecapPoint[];
  videoUrl: string;
}) {
  if (points.length === 0) {
    return <p className="empty-state">No timestamped notes yet.</p>;
  }

  return (
    <ol className="timepoint-list">
      {points.map((point, index) => {
        const seconds = point.seconds ?? 0;
        const isActive = activeTime === seconds;

        return (
          <li
            className={isActive ? "active-timepoint" : ""}
            key={`${seconds}-${index}`}
          >
            <a
              className="time-pill"
              href={`${videoUrl}&t=${seconds}s`}
              target="_blank"
              rel="noreferrer"
              title={`Seek video to ${formatTime(seconds)}`}
              onClick={(event) => {
                event.preventDefault();
                onSeek(seconds);
              }}
            >
              {point.time ?? formatTime(seconds)}
            </a>
            <div>
              <h3>{point.title ?? "Untitled moment"}</h3>
              {point.description ? <p>{point.description}</p> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

async function fetchVideos(query: string) {
  const trimmedQuery = query.trim();
  const response = trimmedQuery
    ? await api.api.search.$get({ query: { q: trimmedQuery } })
    : await api.api.videos.$get();

  if (!response.ok) {
    throw new Error("Could not load videos.");
  }

  const body = await response.json();

  return body.videos;
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

type VideoCards = Awaited<ReturnType<typeof fetchVideos>>;
type VideoCardData = VideoCards[number];
type VideoDetail = Awaited<ReturnType<typeof fetchVideo>>;

function getRoute(locationKey: string) {
  const url = new URL(locationKey, window.location.origin);
  const detailMatch = url.pathname.match(/^\/videos\/([^/]+)$/);

  if (detailMatch?.[1]) {
    return {
      name: "detail" as const,
      youtubeVideoId: decodeURIComponent(detailMatch[1]),
    };
  }

  return {
    name: "browse" as const,
    query: url.searchParams.get("q") ?? "",
  };
}

function getRecapData(video: VideoDetail) {
  const recapJson = video.recap?.recapJson;

  if (!recapJson || typeof recapJson !== "object") {
    return null;
  }

  return recapJson as RecapData;
}

function handleInternalLink(event: MouseEvent<HTMLAnchorElement>) {
  const href = event.currentTarget.getAttribute("href");

  if (!href?.startsWith("/")) {
    return;
  }

  event.preventDefault();
  navigate(href);
}

function navigate(path: string) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo({ top: 0 });
}

function currentLocationKey() {
  return `${window.location.pathname}${window.location.search}`;
}

function youtubeThumbnailUrl(youtubeVideoId: string) {
  return `https://i.ytimg.com/vi/${youtubeVideoId}/hqdefault.jpg`;
}

function sectionId(index: number) {
  return `section-${index + 1}`;
}

function collectTimepoints(highlights: RecapPoint[], sections: RecapSection[]) {
  return [...highlights, ...sections.flatMap((section) => section.points ?? [])]
    .filter(
      (point): point is RecapPoint & { seconds: number } =>
        typeof point.seconds === "number" && Number.isFinite(point.seconds),
    )
    .sort((left, right) => left.seconds - right.seconds);
}

function findActiveTime(
  timepoints: Array<RecapPoint & { seconds: number }>,
  currentSeconds: number,
) {
  let activeTime = timepoints[0]?.seconds ?? 0;

  for (const timepoint of timepoints) {
    if (timepoint.seconds > currentSeconds) {
      break;
    }

    activeTime = timepoint.seconds;
  }

  return activeTime;
}

function loadYouTubeApi() {
  if (window.YT?.Player) {
    return Promise.resolve();
  }

  if (!youtubeApiPromise) {
    youtubeApiPromise = new Promise((resolve) => {
      const previousReadyHandler = window.onYouTubeIframeAPIReady;

      window.onYouTubeIframeAPIReady = () => {
        previousReadyHandler?.();
        resolve();
      };

      if (!document.querySelector("script[data-youtube-iframe-api]")) {
        const script = document.createElement("script");

        script.src = "https://www.youtube.com/iframe_api";
        script.dataset.youtubeIframeApi = "true";
        document.head.appendChild(script);
      }
    });
  }

  return youtubeApiPromise;
}

function seekPlayer(player: YouTubePlayer | null, seconds: number) {
  if (!player?.seekTo) {
    return false;
  }

  player.seekTo(seconds, true);
  player.playVideo?.();

  return true;
}

function trackPointer(
  event: ReactPointerEvent<HTMLElement>,
  className: string,
  onMove: (event: PointerEvent) => void,
) {
  event.preventDefault();
  document.body.classList.add(className);
  event.currentTarget.setPointerCapture(event.pointerId);

  const stopTracking = () => {
    document.body.classList.remove(className);
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", stopTracking);
  };

  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", stopTracking, { once: true });
}

function centerFloatState(width: number, cardHeight: number): FloatState {
  const clampedWidth = clamp(width, MIN_FLOAT_WIDTH, maxFloatWidth());
  const estimatedHeight =
    cardHeight > 0 ? cardHeight : Math.round((clampedWidth * 9) / 16) + 92;

  return clampFloatState({
    customSize: width !== defaultFloatWidth(),
    width: clampedWidth,
    left: Math.round((window.innerWidth - clampedWidth) / 2),
    top: Math.round((window.innerHeight - estimatedHeight) / 2),
  });
}

function clampFloatState(floatState: FloatState): FloatState {
  const width = clamp(floatState.width, MIN_FLOAT_WIDTH, maxFloatWidth());

  return {
    ...floatState,
    width,
    left: clamp(
      floatState.left,
      EDGE_PADDING,
      window.innerWidth - width - EDGE_PADDING,
    ),
    top: clamp(floatState.top, EDGE_PADDING, window.innerHeight - 180),
  };
}

function defaultFloatWidth() {
  return Math.round(window.innerWidth * FLOAT_WIDTH_RATIO);
}

function maxFloatWidth() {
  return window.innerWidth - EDGE_PADDING * 2;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}

function formatTime(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = Math.floor(safeSeconds % 60);

  return [hours, minutes, seconds]
    .map((part) => part.toString().padStart(2, "0"))
    .join(":");
}
