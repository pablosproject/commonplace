import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../../shared/api/client";
import type { LoadState } from "../../shared/lib/load-state";
import { EmptyState } from "../../shared/ui/EmptyState";
import { ThemeSelect } from "../../shared/ui/ThemeSelect";
import { TopBar } from "../../shared/ui/TopBar";
import {
  Brand,
  BrowseHero,
  DurationChip,
  Eyebrow,
  HeroContent,
  HeroCopy,
  HomeContent,
  HomeShell,
  LibraryCard,
  LibraryCardBody,
  ResultCount,
  SearchButton,
  SearchPanel,
  SearchRow,
  SectionHeading,
  ThumbnailLink,
  VideoGrid,
  VideoLibrary,
  VideoMeta,
} from "./HomePage.styles";

export function HomePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") ?? "";
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
    <HomeShell>
      <TopBar>
        <Brand to="/">Commonplace</Brand>
        <ThemeSelect />
      </TopBar>

      <HomeContent>
        <BrowseHero aria-labelledby="browse-title">
          <HeroContent>
            <Eyebrow>Commonplace</Eyebrow>
            <h1 id="browse-title">
              Find the useful parts before you press play.
            </h1>
            <HeroCopy>
              Search indexed YouTube recaps, skim the takeaway, then open the
              detail view to jump straight to highlights and sections.
            </HeroCopy>
          </HeroContent>

          <SearchPanel role="search" onSubmit={onSubmit}>
            <label htmlFor="video-search">Search recaps</label>
            <SearchRow>
              <input
                id="video-search"
                type="search"
                value={draftQuery}
                placeholder="Title, channel, summary, takeaway..."
                onChange={(event) => setDraftQuery(event.target.value)}
              />
              <SearchButton type="submit">Search</SearchButton>
            </SearchRow>
          </SearchPanel>
        </BrowseHero>

        <VideoLibrary aria-labelledby="video-library-title">
          <SectionHeading>
            <div>
              <Eyebrow>Library</Eyebrow>
              <h2 id="video-library-title">{title}</h2>
            </div>
            {videosState.status === "ready" ? (
              <ResultCount>
                {videosState.data.length}{" "}
                {videosState.data.length === 1 ? "recap" : "recaps"}
              </ResultCount>
            ) : null}
          </SectionHeading>

          {videosState.status === "loading" ? (
            <EmptyState>Loading recaps...</EmptyState>
          ) : null}

          {videosState.status === "error" ? (
            <EmptyState>{videosState.message}</EmptyState>
          ) : null}

          {videosState.status === "ready" && videosState.data.length === 0 ? (
            <EmptyState>No recaps match this search yet.</EmptyState>
          ) : null}

          {videosState.status === "ready" && videosState.data.length > 0 ? (
            <VideoGrid>
              {videosState.data.map((video) => (
                <VideoCard key={video.youtubeVideoId} video={video} />
              ))}
            </VideoGrid>
          ) : null}
        </VideoLibrary>
      </HomeContent>
    </HomeShell>
  );
}

function VideoCard({ video }: { video: VideoCardData }) {
  return (
    <LibraryCard>
      <ThumbnailLink
        to={`/videos/${video.youtubeVideoId}`}
        aria-label={`Open recap for ${video.title}`}
      >
        <img
          src={youtubeThumbnailUrl(video.youtubeVideoId)}
          alt=""
          loading="lazy"
        />
        {video.durationFormatted ? (
          <DurationChip>{video.durationFormatted}</DurationChip>
        ) : null}
      </ThumbnailLink>

      <LibraryCardBody>
        <VideoMeta>
          <span>{video.channel ?? "Unknown channel"}</span>
        </VideoMeta>
        <h3>
          <Link to={`/videos/${video.youtubeVideoId}`}>{video.title}</Link>
        </h3>
        <p>{video.abstract}</p>
      </LibraryCardBody>
    </LibraryCard>
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

type VideoCards = Awaited<ReturnType<typeof fetchVideos>>;
type VideoCardData = VideoCards[number];

function youtubeThumbnailUrl(youtubeVideoId: string) {
  return `https://i.ytimg.com/vi/${youtubeVideoId}/hqdefault.jpg`;
}
