import { buildShortLinkUrl } from "@commonplace/video-util";
import { useEffect, useRef, useState } from "react";
import { invalidateLink } from "./api";
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
};

type Step = "idle" | "confirming" | "pending" | "failed" | "done";

const HOUR_MS = 60 * 60 * 1000; // 1 hour
const DAY_MS = 24 * HOUR_MS; // 1 day

export function ManageMenu({
  expiresAt,
  id,
  ownerSecret,
  shareKey,
}: ManageMenuProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("idle");
  const [notice, setNotice] = useState("");
  const [copied, setCopied] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timeout = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  const copyShareLink = () => {
    setCopied(true);
    navigator.clipboard
      .writeText(buildShortLinkUrl(window.location.origin, id, shareKey))
      .catch(() => setCopied(false));
  };

  const invalidate = async () => {
    setStep("pending");
    const result = await invalidateLink(id, ownerSecret);

    if (result === "failed") {
      setStep("failed");
      return;
    }

    setNotice(INVALIDATE_MESSAGES[result]);
    setStep("done");
  };

  const msLeft = new Date(expiresAt).getTime() - Date.now();
  const daysLeft = Math.ceil(msLeft / DAY_MS);
  const hoursLeft = Math.max(1, Math.ceil(msLeft / HOUR_MS));
  const [label, shortLabel] =
    step === "done"
      ? ["Link invalidated", "Off"]
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
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={`Manage link, ${label.toLowerCase()}`}
        title={`Manage link · expires ${expiry}`}
        data-done={step === "done"}
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
        <Menu>
          <Header>
            <strong>This is your manage link</strong>
            <span>
              Don't share this URL. Anyone with it can invalidate the recap.
            </span>
            <span>
              Expires <b>{expiry}</b>
            </span>
          </Header>

          {step === "done" ? (
            <Notice role="status">{notice}</Notice>
          ) : (
            <>
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
                    The link to send to people. It can't manage the recap.
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
                          <b>Invalidate this link?</b> Nobody will be able to
                          open it again.
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
