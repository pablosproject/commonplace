import { useState, type PointerEvent as ReactPointerEvent } from "react";
import { trackPointer } from "./pointer";
import type { Layout } from "./LayoutSwitch";

const DEFAULT_NOTES_RATIO: Record<Layout, number> = {
  reader: 0.5,
  watch: 0.25,
};
const MIN_READER_VIDEO_WIDTH = 600;
const MIN_WATCH_NOTES_WIDTH = 500;
const MIN_RESIZED_COLUMN_WIDTH = 100;

export function useNotesResize(layout: Layout) {
  const [notesWidth, setNotesWidth] = useState<number | null>(null);
  const direction = layout === "reader" ? 1 : -1;

  const resetNotesWidth = () => {
    setNotesWidth(null);
  };

  const startNotesResize = (event: ReactPointerEvent<HTMLDivElement>) => {
    const startX = event.clientX;
    const startWidth = notesWidth ?? initialNotesWidth(layout);

    trackPointer(event, "split-resizing", (moveEvent) => {
      setNotesWidth(
        clampToResizableRange(
          startWidth + direction * (moveEvent.clientX - startX),
        ),
      );
    });
  };

  return { currentNotesWidth: notesWidth, resetNotesWidth, startNotesResize };
}

function clampToResizableRange(width: number) {
  return Math.max(
    MIN_RESIZED_COLUMN_WIDTH,
    Math.min(width, window.innerWidth - MIN_RESIZED_COLUMN_WIDTH),
  );
}

function initialNotesWidth(layout: Layout) {
  const ratioWidth = window.innerWidth * DEFAULT_NOTES_RATIO[layout];
  const width =
    layout === "reader"
      ? Math.min(ratioWidth, window.innerWidth - MIN_READER_VIDEO_WIDTH)
      : Math.max(ratioWidth, MIN_WATCH_NOTES_WIDTH);

  return width;
}
