import { useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { LogoLink } from "../../shared/brand/Logo";
import { RecapActions } from "../../shared/library/RecapActions";
import { useLibrary } from "../../shared/library/useLibrary";
import { RecapView } from "../../shared/recap/RecapView";
import { MakeRecapLink } from "../../shared/ui/MakeRecapLink";
import { MessagePage } from "../../shared/ui/MessagePage";

export function SavedRecapPage() {
  const { videoId } = useParams();
  const { entries, error, actions } = useLibrary();
  const entry = entries.find((item) => item.recap.video.id === videoId);
  const savePosition = useCallback(
    (seconds: number) => {
      if (videoId) {
        actions.saveTime(videoId, seconds);
      }
    },
    [actions, videoId],
  );
  if (!entry) {
    return (
      <MessagePage
        icon="broken"
        title={
          error
            ? "Could not read saved recaps"
            : "No saved recap in this browser"
        }
        message={
          error ??
          "This address opens a local copy, not a share link. Open the original link and save it in this browser first."
        }
      >
        <Link to="/">Back to Commonplace</Link>
      </MessagePage>
    );
  }

  return (
    <RecapView
      key={videoId}
      nav={<LogoLink compactOnMobile />}
      recap={entry.recap}
      startAtSeconds={entry.positionSeconds ?? 0}
      onPlaybackTime={savePosition}
      actions={<RecapActions webRecap={entry} local />}
      callToAction={<MakeRecapLink />}
    />
  );
}
