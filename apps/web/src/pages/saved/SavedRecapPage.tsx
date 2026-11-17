import { useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { LogoLink } from "../../shared/brand/Logo";
import { RecapActions } from "../../shared/library/RecapActions";
import { useSavedRecap } from "../../shared/library/useSavedRecap";
import { RecapView } from "../../shared/recap/RecapView";
import { MakeRecapLink } from "../../shared/ui/MakeRecapLink";
import { MessagePage } from "../../shared/ui/MessagePage";

export function SavedRecapPage() {
  const { videoId } = useParams();
  const { savedRecap: entry, error, actions } = useSavedRecap(videoId);
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
      savedRecap={entry}
      onPlaybackTime={savePosition}
      actions={<RecapActions webRecap={entry} local />}
      callToAction={<MakeRecapLink />}
    />
  );
}
