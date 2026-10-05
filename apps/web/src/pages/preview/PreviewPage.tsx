import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import type { LoadState } from "../../shared/lib/load-state";
import { RecapView } from "../../shared/recap/RecapView";
import type { Recap } from "../../shared/recap/types";
import { EmptyState } from "../../shared/ui/EmptyState";
import { MessagePage } from "../../shared/ui/MessagePage";
import { decodePreviewHash } from "./previewLink";

const INVALID_PREVIEW_MESSAGE = "This preview link is invalid or incomplete.";

export function PreviewPage() {
  const { hash } = useLocation();
  const [recapState, setRecapState] = useState<LoadState<Recap>>({
    status: "loading",
  });

  useEffect(() => {
    let cancelled = false;

    setRecapState({ status: "loading" });
    decodePreviewHash(hash)
      .then((recap) => {
        if (!cancelled) {
          setRecapState({ status: "ready", data: recap });
        }
      })
      .catch((error: unknown) => {
        if (import.meta.env.DEV) {
          console.warn("Could not decode preview link", error);
        }

        if (!cancelled) {
          setRecapState({ status: "error", message: INVALID_PREVIEW_MESSAGE });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [hash]);

  if (recapState.status === "loading") {
    return <PreviewMessage message="Loading preview..." />;
  }

  if (recapState.status === "error") {
    return <PreviewMessage message={recapState.message} />;
  }

  return <RecapView key={recapState.data.video.id} recap={recapState.data} />;
}

function PreviewMessage({ message }: { message: string }) {
  return (
    <MessagePage>
      <EmptyState>{message}</EmptyState>
    </MessagePage>
  );
}
