import { useId, type ReactNode } from "react";
import {
  PlayerActions,
  PlayerButton,
  PlayerCard,
  PlayerDragbar,
  PlayerFrame,
  PlayerLabel,
  PlayerSlot,
  ResizeHandle,
} from "./RecapPlayer.styles";
import type { SeekRequest } from "./types";
import { useFloatingPlayer } from "./useFloatingPlayer";
import { useYouTubePlayer } from "./useYouTubePlayer";

type RecapPlayerProps = {
  allowFloating: boolean;
  children: ReactNode;
  isFloating: boolean;
  onFloatingChange: (isFloating: boolean) => void;
  onPlaybackTime: (seconds: number) => void;
  seekRequest: SeekRequest;
  title: string;
  youtubeVideoId: string;
};

export function RecapPlayer({
  allowFloating,
  children,
  isFloating,
  onFloatingChange,
  onPlaybackTime,
  seekRequest,
  title,
  youtubeVideoId,
}: RecapPlayerProps) {
  const reactId = useId();
  const playerElementId = `youtube-player-${reactId.replaceAll(":", "")}`;
  const floatingPlayer = useFloatingPlayer({
    isFloating,
    onFloatingChange,
  });
  useYouTubePlayer({
    elementId: playerElementId,
    onPlaybackTime,
    seekRequest,
    videoId: youtubeVideoId,
  });

  return (
    <PlayerSlot>
      <PlayerCard
        data-floating={isFloating}
        style={floatingPlayer.style}
        aria-label={`Video player for ${title}`}
      >
        <PlayerDragbar
          data-floating={isFloating}
          onPointerDown={floatingPlayer.startDrag}
          title={isFloating ? "Drag to move the player" : undefined}
        >
          <PlayerLabel>Now playing</PlayerLabel>
          {isFloating || allowFloating ? (
            <PlayerActions aria-label="Video player controls">
              {isFloating ? (
                <>
                  <PlayerButton
                    type="button"
                    onClick={floatingPlayer.shrink}
                    aria-label="Make video smaller"
                  >
                    −
                  </PlayerButton>
                  <PlayerButton
                    type="button"
                    onClick={floatingPlayer.grow}
                    aria-label="Make video larger"
                  >
                    +
                  </PlayerButton>
                  <PlayerButton
                    type="button"
                    onClick={floatingPlayer.dock}
                    aria-label="Dock video in panel"
                  >
                    Dock
                  </PlayerButton>
                </>
              ) : (
                <PlayerButton
                  type="button"
                  onClick={floatingPlayer.float}
                  aria-label="Float video player"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="3" y="4" width="18" height="16" rx="2" />
                    <rect x="12" y="12" width="7" height="6" rx="1" />
                  </svg>
                  Float
                </PlayerButton>
              )}
            </PlayerActions>
          ) : null}
        </PlayerDragbar>

        <PlayerFrame>
          <div id={playerElementId} />
        </PlayerFrame>

        {isFloating ? (
          <ResizeHandle
            onPointerDown={floatingPlayer.startResize}
            title="Drag to resize"
          />
        ) : (
          children
        )}
      </PlayerCard>
    </PlayerSlot>
  );
}
