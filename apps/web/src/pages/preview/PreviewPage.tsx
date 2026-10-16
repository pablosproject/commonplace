import { decodePreviewHash, parseRecap } from "@commonplace/video-util";
import { styled } from "@linaria/react";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import type { LoadState } from "../../shared/lib/load-state";
import { LogoLink } from "../../shared/brand/Logo";
import { RecapView } from "../../shared/recap/RecapView";
import type { Recap } from "../../shared/recap/types";
import { EmptyState } from "../../shared/ui/EmptyState";
import { MessagePage } from "../../shared/ui/MessagePage";

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
      .then((value) => {
        const recap = parseRecap(value);

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

  return (
    <RecapView
      key={recapState.data.video.id}
      callToAction={<MakeRecapLink />}
      nav={<LogoLink />}
      recap={recapState.data}
    />
  );
}

function PreviewMessage({ message }: { message: string }) {
  return (
    <MessagePage>
      <EmptyState>{message}</EmptyState>
    </MessagePage>
  );
}

function MakeRecapLink() {
  return (
    <CallToActionLink
      href="https://github.com/pablosproject/commonplace#install-the-skill"
      target="_blank"
      rel="noopener"
    >
      <span>Make your own recap</span>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 17L17 7M8 7h9v9" />
      </svg>
    </CallToActionLink>
  );
}

const CallToActionLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--text-strong);
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;

  &:hover {
    color: var(--accent-hover);
  }

  &:focus-visible {
    border-radius: 4px;
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  svg {
    width: 14px;
    height: 14px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
`;
