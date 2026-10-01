import { useId, useRef } from "react";
import {
  NowPlaying,
  PlayerActions,
  PlayerButton,
  PlayerCard,
  PlayerDragbar,
  PlayerFrame,
  PlayerHelp,
  PlayerLabel,
  PlayerSlot,
  ResizeHandle,
} from "./RecapPlayer.styles";
import { formatTime } from "./timepoints";
import type { SeekRequest } from "./types";
import { useFloatingPlayer } from "./useFloatingPlayer";
import { useYouTubePlayer } from "./useYouTubePlayer";

type RecapPlayerProps = {
  activeTime: number;
  isFloating: boolean;
  onFloatingChange: (isFloating: boolean) => void;
  onPlaybackTime: (seconds: number) => void;
  seekRequest: SeekRequest;
  title: string;
  youtubeVideoId: string;
};

export function RecapPlayer({
  activeTime,
  isFloating,
  onFloatingChange,
  onPlaybackTime,
  seekRequest,
  title,
  youtubeVideoId,
}: RecapPlayerProps) {
  const reactId = useId();
  const playerElementId = `youtube-player-${reactId.replaceAll(":", "")}`;
  const cardRef = useRef<HTMLDivElement | null>(null);
  const floatingPlayer = useFloatingPlayer({
    cardRef,
    isFloating,
    onFloatingChange,
  });
  const status = useYouTubePlayer({
    elementId: playerElementId,
    onPlaybackTime,
    seekRequest,
    videoId: youtubeVideoId,
  });

  return (
    <PlayerSlot>
      <PlayerCard
        data-floating={isFloating}
        ref={cardRef}
        style={floatingPlayer.style}
        aria-label={`Video player for ${title}`}
      >
        <PlayerDragbar
          data-floating={isFloating}
          onPointerDown={floatingPlayer.startDrag}
          title="Drag to move the player while floating"
        >
          <PlayerLabel>Video</PlayerLabel>
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
                Float
              </PlayerButton>
            )}
          </PlayerActions>
        </PlayerDragbar>

        <PlayerFrame>
          <div id={playerElementId} />
        </PlayerFrame>

        {!isFloating ? (
          <PlayerHelp>
            Click any timestamp in the notes to seek the video. Drag the divider
            to resize the split, or Float to detach the player.
          </PlayerHelp>
        ) : null}
        <NowPlaying>
          {status || `Now playing ${formatTime(activeTime)}`}
        </NowPlaying>
        {isFloating ? (
          <ResizeHandle
            onPointerDown={floatingPlayer.startResize}
            title="Drag to resize"
          />
        ) : null}
      </PlayerCard>
    </PlayerSlot>
  );
}
