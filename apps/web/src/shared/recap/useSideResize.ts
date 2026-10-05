import { useState, type PointerEvent as ReactPointerEvent } from "react";
import { trackPointer } from "./pointer";
import type { Layout } from "./LayoutSwitch";

const DEFAULT_SIDE_WIDTH: Record<Layout, number> = { reader: 540, watch: 480 };
const MIN_SIDE_WIDTH = 360;
const MIN_MAIN_WIDTH = 420;
const EDGE_PADDING = 16;

export function useSideResize(layout: Layout) {
  const [sideWidth, setSideWidth] = useState<number | null>(null);
  const currentSideWidth = sideWidth ?? DEFAULT_SIDE_WIDTH[layout];

  const resetSideWidth = () => {
    setSideWidth(null);
  };

  const startSideResize = (event: ReactPointerEvent<HTMLDivElement>) => {
    const startX = event.clientX;

    trackPointer(event, "split-resizing", (moveEvent) => {
      setSideWidth(
        clampSideWidth(currentSideWidth - (moveEvent.clientX - startX)),
      );
    });
  };

  return { currentSideWidth, resetSideWidth, startSideResize };
}

function clampSideWidth(width: number) {
  return Math.max(MIN_SIDE_WIDTH, Math.min(width, maxSideWidth()));
}

function maxSideWidth() {
  return Math.max(
    MIN_SIDE_WIDTH,
    window.innerWidth - MIN_MAIN_WIDTH - EDGE_PADDING * 3,
  );
}
