import { useEffect, useState } from "react";
import {
  ownerSecretSchema,
  parseShortLinkFragment,
} from "@commonplace/video-util";
import { Link, useLocation, useParams } from "react-router-dom";
import { LogoLink } from "../../shared/brand/Logo";
import { RecapView } from "../../shared/recap/RecapView";
import { MakeRecapLink } from "../../shared/ui/MakeRecapLink";
import { MessagePage } from "../../shared/ui/MessagePage";
import type { LoadState } from "../../shared/lib/load-state";
import { loadSharedRecap, type SharedRecap } from "../../shared/sharing/api";
import { LOAD_ERROR_MESSAGES } from "../../shared/sharing/messages";
import { RecapActions } from "../../shared/library/RecapActions";
import { useLibrary } from "../../shared/library/useLibrary";

export function SharePage() {
  const { id = "" } = useParams();
  const { hash } = useLocation();
  const { key, ownerSecret } = parseShortLinkFragment(hash);
  const { entries } = useLibrary();
  const savedCopy = entries.find(
    (entry) =>
      entry.managementMatchesRecap &&
      entry.management?.linkId === id &&
      entry.management.key === key,
  );
  const [state, setState] = useState<LoadState<SharedRecap>>({
    status: "loading",
  });

  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex";
    document.head.append(meta);

    return () => meta.remove();
  }, []);

  useEffect(() => {
    if (!key) {
      return;
    }

    let cancelled = false;
    setState({ status: "loading" });

    loadSharedRecap(id, key).then((result) => {
      if (cancelled) {
        return;
      }

      setState(
        result.status === "ready"
          ? result
          : { status: "error", error: LOAD_ERROR_MESSAGES[result.reason] },
      );
    });

    return () => {
      cancelled = true;
    };
  }, [id, key]);

  if (!key) {
    return <MessagePage {...LOAD_ERROR_MESSAGES.incomplete} />;
  }

  if (state.status === "loading") {
    return <MessagePage icon="loading" title="Loading recap…" />;
  }

  if (state.status === "error") {
    return (
      <MessagePage {...state.error}>
        {savedCopy ? (
          <>
            <p>
              This link could not be opened. You have a copy saved in this
              browser.
            </p>
            <Link to={`/saved/${savedCopy.recap.video.id}`}>
              Open saved copy
            </Link>
          </>
        ) : null}
      </MessagePage>
    );
  }

  return (
    <RecapView
      key={`${id}:${key}`}
      actions={
        <RecapActions
          key={`${id}:${key}:${ownerSecret}`}
          webRecap={{
            recap: state.data.recap,
            ...(ownerSecret && ownerSecretSchema.safeParse(ownerSecret).success
              ? {
                  management: {
                    linkId: id,
                    key,
                    ownerSecret,
                    expiresAt: state.data.expiresAt,
                  },
                }
              : {}),
          }}
        />
      }
      callToAction={<MakeRecapLink />}
      nav={<LogoLink compactOnMobile />}
      recap={state.data.recap}
    />
  );
}
