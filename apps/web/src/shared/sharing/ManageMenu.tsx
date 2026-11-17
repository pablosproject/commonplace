import { buildShortLinkUrl } from "@commonplace/video-util";
import { useEffect, useId, useState } from "react";
import { usePopover } from "../ui/usePopover";
import { invalidateLink, type InvalidateResult } from "./api";
import { INVALIDATE_MESSAGES } from "./messages";
import {
  ConfirmBox,
  ConfirmButton,
  Header,
  Hint,
  Item,
  Menu,
  Notice,
  Trigger,
  Wrapper,
} from "./ManageMenu.styles";

type ManageMenuProps = {
  expiresAt: string;
  id: string;
  ownerSecret: string;
  shareKey: string;
  historical?: boolean;
};

type Step = "idle" | "confirming" | "pending" | "failed" | "done";

const HOUR_MS = 60 * 60 * 1000; // 1 hour
const DAY_MS = 24 * HOUR_MS; // 1 day

export function ManageMenu({
  expiresAt,
  id,
  ownerSecret,
  shareKey,
  historical = false,
}: ManageMenuProps) {
  const { open, setOpen, wrapperRef, triggerRef } = usePopover();
  const dialogId = useId();
  const [step, setStep] = useState<Step>("idle");
  const [outcome, setOutcome] = useState<InvalidateResult | null>(null);
  const [notice, setNotice] = useState("");
  const [copied, setCopied] = useState(false);
  const closed = step === "done";

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timeout = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(
        buildShortLinkUrl(window.location.origin, id, shareKey),
      );
      setCopied(true);
    } catch {
      setNotice("Could not copy the link. Clipboard access may be blocked.");
    }
  };

  const invalidate = async () => {
    setStep("pending");
    const result = await invalidateLink(id, ownerSecret);

    if (result === "failed") {
      setStep("failed");
      return;
    }

    setNotice(INVALIDATE_MESSAGES[result]);
    setOutcome(result);
    setStep("done");
  };

  const msLeft = new Date(expiresAt).getTime() - Date.now();
  const daysLeft = Math.ceil(msLeft / DAY_MS);
  const hoursLeft = Math.max(1, Math.ceil(msLeft / HOUR_MS));
  const [label, shortLabel] = closed
    ? outcome === "forbidden"
      ? ["Management unavailable", "No access"]
      : outcome === "missing"
        ? ["Link unavailable", "Off"]
        : ["Link invalidated", "Off"]
    : msLeft <= 0
      ? ["Link expired", "Expired"]
      : daysLeft > 1
        ? [`Expires in ${daysLeft} days`, `${daysLeft}d`]
        : [`Expires in ${hoursLeft}h`, `${hoursLeft}h`];
  const expiry = new Date(expiresAt).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <Wrapper ref={wrapperRef}>
      <Trigger
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={open ? dialogId : undefined}
        aria-label={`Manage link, ${label.toLowerCase()}`}
        title={`Manage link ${id} · expires ${expiry}`}
        data-done={closed}
        onClick={() => setOpen(!open)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4M12 15v2" />
        </svg>
        <span data-size="long">{label}</span>
        <span data-size="short">{shortLabel}</span>
      </Trigger>

      {open ? (
        <Menu
          id={dialogId}
          role="dialog"
          aria-label="Manage link"
          data-popover
          tabIndex={-1}
        >
          <Header>
            <strong>This is your manage link</strong>
            <span>Link {id}</span>
            {historical ? (
              <span>
                This is a previously saved link. It may contain an earlier
                recap.
              </span>
            ) : null}
            <span>
              Don't share the manage URL. Anyone with it can invalidate this
              link.
            </span>
            <span>
              Expires <b>{expiry}</b>
            </span>
          </Header>

          {closed ? (
            <Notice role="status">{notice}</Notice>
          ) : (
            <>
              {notice ? <Notice role="status">{notice}</Notice> : null}
              <Item type="button" onClick={copyShareLink}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="9" y="9" width="12" height="12" rx="2" />
                  <path d="M5 15V5a2 2 0 0 1 2-2h10" />
                </svg>
                <span>
                  <span data-copied={copied}>
                    {copied ? "Copied" : "Copy share link"}
                  </span>
                  <Hint>
                    The link to send to people. It can't manage this link.
                  </Hint>
                </span>
              </Item>

              {step === "idle" ? (
                <Item
                  type="button"
                  data-danger
                  onClick={() => setStep("confirming")}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" />
                    <path d="m5.6 5.6 12.8 12.8" />
                  </svg>
                  <span>Invalidate link…</span>
                </Item>
              ) : (
                <ConfirmBox role="status">
                  {step === "pending" ? (
                    <p>Invalidating…</p>
                  ) : (
                    <p>
                      {step === "failed" ? (
                        INVALIDATE_MESSAGES.failed
                      ) : (
                        <>
                          <b>Invalidate this link?</b> It will no longer load
                          from the server. Copies already saved by recipients
                          will remain available.
                        </>
                      )}
                    </p>
                  )}
                  <div>
                    <ConfirmButton
                      type="button"
                      disabled={step === "pending"}
                      onClick={() => setStep("idle")}
                    >
                      Cancel
                    </ConfirmButton>
                    <ConfirmButton
                      type="button"
                      data-danger
                      disabled={step === "pending"}
                      onClick={invalidate}
                    >
                      {step === "failed" ? "Try again" : "Invalidate"}
                    </ConfirmButton>
                  </div>
                </ConfirmBox>
              )}
            </>
          )}
        </Menu>
      ) : null}
    </Wrapper>
  );
}
