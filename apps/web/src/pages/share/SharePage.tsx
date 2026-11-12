import { useEffect, useState } from "react";
import {
  ownerSecretSchema,
  parseShortLinkFragment,
} from "@commonplace/video-util";
import { useLocation, useParams } from "react-router-dom";
import { LogoLink } from "../../shared/brand/Logo";
import { RecapView } from "../../shared/recap/RecapView";
import { MakeRecapLink } from "../../shared/ui/MakeRecapLink";
import { MessagePage } from "../../shared/ui/MessagePage";
import type { LoadState } from "../../shared/lib/load-state";
import { loadSharedRecap, type SharedRecap } from "./api";
import { LOAD_ERROR_MESSAGES } from "./messages";
import { ManageMenu } from "./ManageMenu";

export function SharePage() {
  const { id = "" } = useParams();
  const { hash } = useLocation();
  const { key, ownerSecret } = parseShortLinkFragment(hash);
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
    return <MessagePage {...state.error} />;
  }

  return (
    <RecapView
      actions={
        ownerSecret && ownerSecretSchema.safeParse(ownerSecret).success ? (
          <ManageMenu
            key={id}
            expiresAt={state.data.expiresAt}
            id={id}
            ownerSecret={ownerSecret}
            shareKey={key}
          />
        ) : undefined
      }
      callToAction={<MakeRecapLink />}
      nav={<LogoLink />}
      recap={state.data.recap}
    />
  );
}
