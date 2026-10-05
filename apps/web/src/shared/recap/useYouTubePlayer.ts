import { useEffect, useRef } from "react";
import type { SeekRequest } from "./types";

const ACTIVE_SYNC_INTERVAL_MS = 500;

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

type UseYouTubePlayerOptions = {
  elementId: string;
  onPlaybackTime: (seconds: number) => void;
  seekRequest: SeekRequest;
  videoId: string;
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

export function useYouTubePlayer({
  elementId,
  onPlaybackTime,
  seekRequest,
  videoId,
}: UseYouTubePlayerOptions) {
  const playerRef = useRef<YouTubePlayer | null>(null);
  const pendingSeekRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    let syncTimer: number | null = null;

    loadYouTubeApi().then(() => {
      if (cancelled || !window.YT) {
        return;
      }

      playerRef.current = new window.YT.Player(elementId, {
        videoId,
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

            if (
              pendingSeek !== null &&
              seekPlayer(playerRef.current, pendingSeek)
            ) {
              pendingSeekRef.current = null;
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
      cancelled = true;

      if (syncTimer !== null) {
        window.clearInterval(syncTimer);
      }

      playerRef.current?.destroy?.();
      playerRef.current = null;
    };
  }, [elementId, onPlaybackTime, videoId]);

  useEffect(() => {
    if (seekRequest.nonce === 0) {
      return;
    }

    if (!seekPlayer(playerRef.current, seekRequest.seconds)) {
      pendingSeekRef.current = seekRequest.seconds;
    }
  }, [seekRequest]);
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
