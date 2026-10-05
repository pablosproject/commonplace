import {
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { trackPointer } from "./pointer";

const FLOAT_WIDTH_RATIO = 0.31;
const MIN_FLOAT_WIDTH = 280;
const EDGE_PADDING = 16;
const FLOAT_CHROME_HEIGHT = 84;

type FloatState = {
  left: number;
  top: number;
  width: number;
  customSize: boolean;
};

type UseFloatingPlayerOptions = {
  isFloating: boolean;
  onFloatingChange: (isFloating: boolean) => void;
};

export function useFloatingPlayer({
  isFloating,
  onFloatingChange,
}: UseFloatingPlayerOptions) {
  const [floatState, setFloatState] = useState<FloatState>(() =>
    centerFloatState(defaultFloatWidth()),
  );

  const resize = (nextWidth: number) => {
    setFloatState((state) =>
      clampFloatState({
        ...state,
        width: nextWidth,
        customSize: true,
      }),
    );
  };

  const float = () => {
    const width = floatState.customSize
      ? floatState.width
      : defaultFloatWidth();

    setFloatState(centerFloatState(width));
    onFloatingChange(true);
  };

  const startDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isFloating || event.target instanceof HTMLButtonElement) {
      return;
    }

    const start = {
      x: event.clientX,
      y: event.clientY,
      left: floatState.left,
      top: floatState.top,
    };

    trackPointer(event, "dragging", (moveEvent) => {
      setFloatState((state) =>
        clampFloatState({
          ...state,
          left: start.left + moveEvent.clientX - start.x,
          top: start.top + moveEvent.clientY - start.y,
        }),
      );
    });
  };

  const startResize = (event: ReactPointerEvent<HTMLDivElement>) => {
    const startX = event.clientX;
    const startWidth = floatState.width;

    trackPointer(event, "resizing", (moveEvent) => {
      resize(startWidth + moveEvent.clientX - startX);
    });
  };

  const style = isFloating
    ? ({
        "--float-left": `${floatState.left}px`,
        "--float-top": `${floatState.top}px`,
        "--float-width": `${floatState.width}px`,
      } as CSSProperties)
    : undefined;

  return {
    dock: () => onFloatingChange(false),
    float,
    grow: () => resize(floatState.width * 1.16),
    shrink: () => resize(floatState.width * 0.86),
    startDrag,
    startResize,
    style,
  };
}

function centerFloatState(width: number): FloatState {
  const clampedWidth = clamp(width, MIN_FLOAT_WIDTH, maxFloatWidth());
  const estimatedHeight =
    Math.round((clampedWidth * 9) / 16) + FLOAT_CHROME_HEIGHT;

  return clampFloatState({
    customSize: width !== defaultFloatWidth(),
    width: clampedWidth,
    left: Math.round((window.innerWidth - clampedWidth) / 2),
    top: Math.round((window.innerHeight - estimatedHeight) / 2),
  });
}

function clampFloatState(floatState: FloatState): FloatState {
  const width = clamp(floatState.width, MIN_FLOAT_WIDTH, maxFloatWidth());

  return {
    ...floatState,
    width,
    left: clamp(
      floatState.left,
      EDGE_PADDING,
      window.innerWidth - width - EDGE_PADDING,
    ),
    top: clamp(floatState.top, EDGE_PADDING, window.innerHeight - 180),
  };
}

function defaultFloatWidth() {
  return Math.round(window.innerWidth * FLOAT_WIDTH_RATIO);
}

function maxFloatWidth() {
  return window.innerWidth - EDGE_PADDING * 2;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}
