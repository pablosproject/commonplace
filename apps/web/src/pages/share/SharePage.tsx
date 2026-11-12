import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { LogoLink } from "../../shared/brand/Logo";
import { RecapView } from "../../shared/recap/RecapView";
import { MakeRecapLink } from "../../shared/ui/MakeRecapLink";
import { StatusMessagePage } from "../../shared/ui/MessagePage";
import type { LoadState } from "../../shared/lib/load-state";
import { loadSharedRecap, type SharedRecap } from "./api";
import { LOAD_ERROR_MESSAGES } from "./messages";
import { claimOwnerSecret } from "./owner-secret";
import { ShareBanner } from "./ShareBanner";

export function SharePage() {
  const { id = "" } = useParams();
  const { hash, pathname } = useLocation();
  const navigate = useNavigate();
  const { key, hashWithoutSecret } = claimOwnerSecret(id, hash);
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
    if (hashWithoutSecret !== null) {
      navigate({ pathname, hash: hashWithoutSecret }, { replace: true });
    }
  }, [hashWithoutSecret, navigate, pathname]);

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
          : { status: "error", message: LOAD_ERROR_MESSAGES[result.reason] },
      );
    });

    return () => {
      cancelled = true;
    };
  }, [id, key]);

  if (!key) {
    return <StatusMessagePage message={LOAD_ERROR_MESSAGES.incomplete} />;
  }

  if (state.status === "loading") {
    return <StatusMessagePage message="Loading recap..." />;
  }

  if (state.status === "error") {
    return <StatusMessagePage message={state.message} />;
  }

  return (
    <RecapView
      banner={
        <ShareBanner
          key={id}
          expiresAt={state.data.expiresAt}
          id={id}
          shareKey={key}
        />
      }
      callToAction={<MakeRecapLink />}
      nav={<LogoLink />}
      recap={state.data.recap}
    />
  );
}
