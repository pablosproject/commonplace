import { useState, type PointerEvent as ReactPointerEvent } from "react";
import { trackPointer } from "./pointer";
import type { Layout } from "./LayoutSwitch";

const DEFAULT_NOTES_WIDTH: Record<Layout, number> = { reader: 812, watch: 480 };
const MIN_NOTES_WIDTH = 360;
const MIN_VIDEO_WIDTH = 420;
const EDGE_PADDING = 16;

export function useNotesResize(layout: Layout) {
  const [notesWidth, setNotesWidth] = useState<number | null>(null);
  const currentNotesWidth = notesWidth ?? DEFAULT_NOTES_WIDTH[layout];
  const direction = layout === "reader" ? 1 : -1;

  const resetNotesWidth = () => {
    setNotesWidth(null);
  };

  const startNotesResize = (event: ReactPointerEvent<HTMLDivElement>) => {
    const startX = event.clientX;

    trackPointer(event, "split-resizing", (moveEvent) => {
      setNotesWidth(
        clampNotesWidth(
          currentNotesWidth + direction * (moveEvent.clientX - startX),
        ),
      );
    });
  };

  return { currentNotesWidth, resetNotesWidth, startNotesResize };
}

function clampNotesWidth(width: number) {
  return Math.max(MIN_NOTES_WIDTH, Math.min(width, maxNotesWidth()));
}

function maxNotesWidth() {
  return Math.max(
    MIN_NOTES_WIDTH,
    window.innerWidth - MIN_VIDEO_WIDTH - EDGE_PADDING * 3,
  );
}
