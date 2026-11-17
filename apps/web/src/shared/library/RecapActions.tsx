import { useEffect, useId, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { buildShortLinkUrl } from "@commonplace/video-util";
import { ManageMenu } from "../sharing/ManageMenu";
import { usePopover } from "../ui/usePopover";
import {
  Actions,
  Button,
  ErrorNotice,
  Hint,
  Popover,
  SaveTrigger,
  Toast,
  Wrapper,
} from "./Library.styles";
import { LOCAL_STORAGE_NOTICE, sameRecap, type WebRecap } from "./storage";
import { useLibrary } from "./useLibrary";

export function RecapActions({
  webRecap,
  local = false,
}: {
  webRecap: WebRecap;
  local?: boolean;
}) {
  const { recap, management } = webRecap;
  const { entries, error: readError, actions } = useLibrary();
  const { open, setOpen, wrapperRef, triggerRef } = usePopover();
  const dialogId = useId();
  const navigate = useNavigate();
  const [confirmation, setConfirmation] = useState<"replace" | "remove" | null>(
    null,
  );
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const entry = entries.find((item) => item.recap.video.id === recap.video.id);
  const savedManagement = entry?.management;
  const hasManagement = Boolean(
    management &&
    savedManagement?.linkId === management.linkId &&
    savedManagement.key === management.key &&
    savedManagement.ownerSecret === management.ownerSecret,
  );
  const saved = Boolean(
    entry && sameRecap(entry.recap, recap) && (!management || hasManagement),
  );
  const shareUrl = management
    ? buildShortLinkUrl(
        window.location.origin,
        management.linkId,
        management.key,
      )
    : undefined;

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timeout = window.setTimeout(() => setNotice(""), 5000);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  function save(replace = false) {
    setError("");
    try {
      const result = actions.save(
        { recap, ...(management ? { management } : {}) },
        replace,
      );
      if (result === "replacement-required") {
        setConfirmation("replace");
      } else {
        setConfirmation(null);
        setOpen(false);
        triggerRef.current?.focus();
        setNotice(
          management
            ? "Recap and administrator access saved in this browser."
            : "Recap saved in this browser.",
        );
      }
    } catch {
      setError(
        "Could not save. Browser storage may be full or unavailable. Your previous saved data has not been changed.",
      );
    }
  }

  function remove() {
    setError("");
    try {
      actions.remove(recap.video.id);
      setConfirmation(null);
      setOpen(false);
      triggerRef.current?.focus();
      if (local) {
        navigate("/saved");
      } else {
        setNotice(
          "Removed from this browser. Links have not been invalidated.",
        );
      }
    } catch {
      setError("Could not remove this recap. Browser storage is unavailable.");
    }
  }

  async function share() {
    if (!shareUrl) {
      return;
    }

    setError("");
    try {
      await navigator.clipboard.writeText(shareUrl);
      setNotice("Reader link copied. Administrator access is not included.");
    } catch {
      setError(
        "Could not copy. Clipboard access may be blocked. Use the reader link below.",
      );
    }
  }

  return (
    <>
      {management ? (
        <ManageMenu
          key={management.linkId}
          id={management.linkId}
          shareKey={management.key}
          ownerSecret={management.ownerSecret}
          expiresAt={management.expiresAt}
          historical={Boolean(local && entry && !entry.managementMatchesRecap)}
        />
      ) : null}
      <Wrapper ref={wrapperRef}>
        <SaveTrigger
          ref={triggerRef}
          type="button"
          aria-label={saved ? "Saved recap options" : "Save recap"}
          title={saved ? "Saved in this browser" : "Save in this browser"}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={open ? dialogId : undefined}
          data-saved={saved}
          onClick={() => {
            setOpen(!open);
            setConfirmation(null);
            setError("");
          }}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d={saved ? "m5 12 4 4L19 6" : "M12 5v14M5 12h14"} />
          </svg>
        </SaveTrigger>
        {open ? (
          <Popover
            id={dialogId}
            role="dialog"
            aria-label="Your recaps"
            data-popover
            tabIndex={-1}
          >
            <h2>{saved ? "Saved in this browser" : "Save to your recaps"}</h2>
            {!saved ? (
              <>
                <Hint>
                  Keep a complete copy in this browser, even after the link
                  expires.
                </Hint>
                {management ? (
                  <Hint>
                    Management access will also be saved. Anyone using this
                    browser profile can manage this link.
                  </Hint>
                ) : null}
                <Button
                  type="button"
                  data-primary="true"
                  disabled={Boolean(readError)}
                  onClick={() => save()}
                >
                  {entry &&
                  sameRecap(entry.recap, recap) &&
                  management &&
                  !hasManagement
                    ? "Save administrator access"
                    : "Save in this browser"}
                </Button>
              </>
            ) : null}
            {confirmation === "replace" ? (
              <div role="group" aria-label="Replace saved recap">
                <p>
                  You already saved a different recap of this video. Replace it?
                  Existing administrator access is kept if the new recap has
                  none; otherwise it is replaced.
                </p>
                <Actions>
                  <Button type="button" onClick={() => setConfirmation(null)}>
                    Cancel
                  </Button>
                  <Button type="button" onClick={() => save(true)}>
                    Replace saved recap
                  </Button>
                </Actions>
              </div>
            ) : null}
            {saved || entry ? <Link to="/saved">View your recaps</Link> : null}
            {entry && !local ? (
              <Link to={`/saved/${recap.video.id}`}>Open saved copy</Link>
            ) : null}
            {shareUrl && saved && (!local || entry?.managementMatchesRecap) ? (
              <>
                <Button type="button" onClick={share}>
                  Copy reader link
                </Button>
                <a href={shareUrl}>Open original reader link</a>
              </>
            ) : null}
            {entry &&
            local &&
            entry.management &&
            !entry.managementMatchesRecap ? (
              <Hint>
                The saved administrator link may open a different recap.
              </Hint>
            ) : null}
            {entry && saved ? (
              <>
                <Button
                  type="button"
                  data-danger="true"
                  onClick={() =>
                    entry.management ? setConfirmation("remove") : remove()
                  }
                >
                  Remove from saved
                </Button>
                {confirmation === "remove" ? (
                  <div role="group" aria-label="Remove saved recap">
                    <p>
                      Remove this recap and all its saved administrator access
                      from this browser? Without the original manage links, that
                      access cannot be recovered. Links will not be invalidated.
                    </p>
                    <Actions>
                      <Button
                        type="button"
                        onClick={() => setConfirmation(null)}
                      >
                        Cancel
                      </Button>
                      <Button type="button" data-danger="true" onClick={remove}>
                        Remove recap and administrator access
                      </Button>
                    </Actions>
                  </div>
                ) : null}
              </>
            ) : null}
            <Hint>{LOCAL_STORAGE_NOTICE}</Hint>
            {error || readError ? (
              <ErrorNotice role="alert">{error || readError}</ErrorNotice>
            ) : null}
          </Popover>
        ) : null}
        {notice ? <Toast role="status">{notice}</Toast> : null}
      </Wrapper>
    </>
  );
}
