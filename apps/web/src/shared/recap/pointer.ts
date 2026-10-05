import type { PointerEvent as ReactPointerEvent } from "react";

export function trackPointer(
  event: ReactPointerEvent<HTMLElement>,
  mode: "dragging" | "resizing" | "split-resizing",
  onMove: (event: PointerEvent) => void,
) {
  event.preventDefault();
  document.body.dataset.pointerMode = mode;
  event.currentTarget.setPointerCapture(event.pointerId);

  const stopTracking = () => {
    delete document.body.dataset.pointerMode;
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", stopTracking);
  };

  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", stopTracking, { once: true });
}
