import { styled } from "@linaria/react";

export const PlayerSlot = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  min-width: 0;
  min-height: 0;
`;

export const PlayerCard = styled.div`
  --float-left: 50%;
  --float-top: 50%;
  --float-width: 31vw;
  position: relative;
  width: 100%;
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: 20px;
  background: rgba(15, 23, 42, 0.78);
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.26);

  &[data-floating="true"] {
    position: fixed;
    top: var(--float-top);
    left: var(--float-left);
    width: var(--float-width);
    z-index: 1000;
    background: rgba(15, 23, 42, 0.96);
    border-color: rgba(96, 165, 250, 0.35);
    box-shadow: 0 24px 80px rgba(0, 0, 0, 0.55);
    backdrop-filter: blur(14px);
  }

  @media (max-width: 980px) {
    &[data-floating="true"] {
      left: 16px;
      top: auto;
      bottom: 16px;
      width: min(420px, calc(100vw - 32px));
    }
  }
`;

export const PlayerDragbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  cursor: default;
  user-select: none;
  touch-action: none;
  margin-bottom: 10px;

  &[data-floating="true"] {
    cursor: grab;
  }

  &[data-floating="true"]:active {
    cursor: grabbing;
  }
`;

export const PlayerLabel = styled.div`
  color: var(--accent-2);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
`;

export const PlayerActions = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

export const PlayerButton = styled.button`
  appearance: none;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: var(--text);
  cursor: pointer;
  font:
    700 12px/1 ui-sans-serif,
    system-ui,
    sans-serif;
  padding: 6px 8px;

  &:hover {
    background: rgba(96, 165, 250, 0.18);
    border-color: rgba(96, 165, 250, 0.42);
  }
`;

export const PlayerFrame = styled.div`
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border-radius: 14px;
  background: #020617;
  border: 1px solid rgba(255, 255, 255, 0.1);

  & > div,
  iframe {
    width: 100%;
    height: 100%;
  }

  iframe {
    display: block;
    border: 0;
  }
`;

export const PlayerHelp = styled.p`
  color: var(--muted);
  font-size: 13px;
  margin: 10px 2px 0;
`;

export const NowPlaying = styled.p`
  color: #bfdbfe;
  font-size: 13px;
  margin: 10px 2px 0;
  min-height: 1.4em;
`;

export const ResizeHandle = styled.div`
  position: absolute;
  right: 5px;
  bottom: 5px;
  width: 18px;
  height: 18px;
  cursor: nwse-resize;
  opacity: 0.75;

  &::before {
    content: "";
    position: absolute;
    right: 2px;
    bottom: 2px;
    width: 10px;
    height: 10px;
    border-right: 2px solid rgba(191, 219, 254, 0.8);
    border-bottom: 2px solid rgba(191, 219, 254, 0.8);
  }
`;
