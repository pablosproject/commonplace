import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../shared/api/client";
import type { LoadState } from "../../shared/lib/load-state";
import { RecapView } from "../../shared/recap/RecapView";
import { EmptyState } from "../../shared/ui/EmptyState";
import { MessagePage } from "../../shared/ui/MessagePage";
import { BackLink, Separator } from "./VideoDetailPage.styles";

export function VideoDetailPage() {
  const { youtubeVideoId } = useParams();
  const [videoState, setVideoState] = useState<LoadState<VideoDetail>>({
    status: "loading",
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

  if (!youtubeVideoId) {
    return <DetailMessage message="Video not found." />;
  }

  if (videoState.status === "loading") {
    return <DetailMessage message="Loading recap..." />;
  }

  if (videoState.status === "error") {
    return <DetailMessage message={videoState.message} />;
  }

  const recap = videoState.data.recap?.recapJson;

  if (!recap) {
    return <DetailMessage message="Recap not found." />;
  }

  return <RecapView key={recap.video.id} recap={recap} nav={<DetailNav />} />;
}

function DetailNav() {
  return (
    <>
      <BackLink to="/">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Library
      </BackLink>
      <Separator aria-hidden="true">/</Separator>
    </>
  );
}

function DetailMessage({ message }: { message: string }) {
  return (
    <MessagePage>
      <BackLink to="/">← Back to library</BackLink>
      <EmptyState>{message}</EmptyState>
    </MessagePage>
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
