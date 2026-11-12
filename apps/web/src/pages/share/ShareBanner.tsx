import { buildShortLinkUrl } from "@commonplace/video-util";
import { useEffect, useState } from "react";
import { invalidateLink } from "./api";
import { INVALIDATE_MESSAGES } from "./messages";
import { clearOwnerSecret, readOwnerSecret } from "./owner-secret";
import {
  Actions,
  Banner,
  Button,
  DangerButton,
  Field,
  FieldLabel,
  FieldNote,
  FieldRow,
  LinkInput,
  OwnerPanel,
  Summary,
} from "./ShareBanner.styles";

const COPY_LABELS = {
  idle: "Copy",
  copied: "Copied",
  failed: "Copy failed",
};

type ShareBannerProps = {
  expiresAt: string;
  id: string;
  shareKey: string;
};

type InvalidationStep = "idle" | "confirming" | "pending" | "failed";

export function ShareBanner({ expiresAt, id, shareKey }: ShareBannerProps) {
  const [ownerSecret, setOwnerSecret] = useState(() => readOwnerSecret(id));
  const [step, setStep] = useState<InvalidationStep>("idle");
  const [notice, setNotice] = useState<string | null>(null);
  const expiry = `Expires ${new Date(expiresAt).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  })}.`;

  const invalidate = async () => {
    if (!ownerSecret) {
      return;
    }

    setStep("pending");
    const result = await invalidateLink(id, ownerSecret);

    if (result === "failed") {
      setStep("failed");
      return;
    }

    clearOwnerSecret(id);
    setOwnerSecret(null);
    setNotice(INVALIDATE_MESSAGES[result]);
  };

  if (!ownerSecret) {
    return <Banner role="status">{notice ?? `Shared recap. ${expiry}`}</Banner>;
  }

  const origin = window.location.origin;

  return (
    <Banner>
      <details open>
        <Summary>You created this link. {expiry}</Summary>
        <OwnerPanel>
          <CopyField
            label="Share link"
            value={buildShortLinkUrl(origin, id, shareKey)}
          />
          <CopyField
            label="Manage link (private)"
            note="Keep this link to manage the share link from another browser or device. Don't share it."
            value={buildShortLinkUrl(origin, id, shareKey, ownerSecret)}
          />
          <Actions role="status">
            <InvalidateControls
              step={step}
              onCancel={() => setStep("idle")}
              onConfirm={invalidate}
              onStart={() => setStep("confirming")}
            />
          </Actions>
        </OwnerPanel>
      </details>
    </Banner>
  );
}

function InvalidateControls({
  step,
  onCancel,
  onConfirm,
  onStart,
}: {
  step: InvalidationStep;
  onCancel: () => void;
  onConfirm: () => void;
  onStart: () => void;
}) {
  switch (step) {
    case "idle":
      return (
        <DangerButton type="button" onClick={onStart}>
          Invalidate link
        </DangerButton>
      );
    case "confirming":
      return (
        <>
          <span>
            Invalidate this link? Nobody will be able to open it again.
          </span>
          <DangerButton type="button" onClick={onConfirm}>
            Invalidate
          </DangerButton>
          <Button type="button" onClick={onCancel}>
            Cancel
          </Button>
        </>
      );
    case "pending":
      return <span>Invalidating...</span>;
    case "failed":
      return (
        <>
          <span>{INVALIDATE_MESSAGES.failed}</span>
          <Button type="button" onClick={onConfirm}>
            Try again
          </Button>
        </>
      );
  }
}

function CopyField({
  label,
  note,
  value,
}: {
  label: string;
  note?: string;
  value: string;
}) {
  const [copyState, setCopyState] = useState<keyof typeof COPY_LABELS>("idle");

  useEffect(() => {
    if (copyState === "idle") {
      return;
    }

    const timeout = window.setTimeout(() => setCopyState("idle"), 2000);
    return () => window.clearTimeout(timeout);
  }, [copyState]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  };

  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <FieldRow>
        <LinkInput
          aria-label={label}
          readOnly
          value={value}
          onFocus={(event) => event.currentTarget.select()}
        />
        <Button type="button" onClick={copy}>
          {COPY_LABELS[copyState]}
        </Button>
      </FieldRow>
      {note ? <FieldNote>{note}</FieldNote> : null}
    </Field>
  );
}
