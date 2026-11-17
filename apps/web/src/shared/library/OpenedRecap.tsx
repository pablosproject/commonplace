import { useCallback, useState } from "react";
import { LogoLink } from "../brand/Logo";
import { RecapView } from "../recap/RecapView";
import { MakeRecapLink } from "../ui/MakeRecapLink";
import { RecapActions } from "./RecapActions";
import { sameRecap, type WebRecap } from "./storage";
import { useSavedRecap } from "./useSavedRecap";

export function OpenedRecap({ webRecap }: { webRecap: WebRecap }) {
  const videoId = webRecap.recap.video.id;
  const { savedRecap, actions } = useSavedRecap(videoId);
  const [showLinkRecap, setShowLinkRecap] = useState(false);
  const different = Boolean(
    savedRecap && !sameRecap(savedRecap.recap, webRecap.recap),
  );
  const recap =
    savedRecap && !showLinkRecap ? savedRecap.recap : webRecap.recap;
  const displayedWebRecap = {
    recap,
    management: different && !showLinkRecap ? undefined : webRecap.management,
  };
  const savePosition = useCallback(
    (seconds: number) => actions.saveTime(videoId, seconds),
    [actions, videoId],
  );

  return (
    <RecapView
      key={showLinkRecap ? "link" : "saved"}
      recap={recap}
      savedRecap={savedRecap}
      onPlaybackTime={savePosition}
      nav={<LogoLink compactOnMobile />}
      callToAction={<MakeRecapLink />}
      actions={
        <>
          {different ? (
            <button
              type="button"
              onClick={() => setShowLinkRecap(!showLinkRecap)}
            >
              {showLinkRecap ? "View saved recap" : "View link recap"}
            </button>
          ) : null}
          <RecapActions
            key={webRecap.management?.ownerSecret}
            webRecap={displayedWebRecap}
          />
        </>
      }
    />
  );
}
