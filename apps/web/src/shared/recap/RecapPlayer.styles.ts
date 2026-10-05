import { styled } from "@linaria/react";

export const PlayerSlot = styled.div`
  min-width: 0;
`;

export const PlayerCard = styled.div`
  --float-left: 50%;
  --float-top: 50%;
  --float-width: 31vw;
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 12px;

  &[data-floating="true"] {
    position: fixed;
    top: var(--float-top);
    left: var(--float-left);
    z-index: 1000;
    width: var(--float-width);
    padding: 14px;
    border: 1px solid var(--border-control);
    border-radius: 14px;
    background: var(--surface);
    box-shadow: 0 24px 64px rgba(0, 0, 0, 0.35);
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
  user-select: none;
  touch-action: none;

  &[data-floating="true"] {
    cursor: grab;
  }

  &[data-floating="true"]:active {
    cursor: grabbing;
  }
`;

export const PlayerLabel = styled.span`
  color: var(--muted);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

export const PlayerActions = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

export const PlayerButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 36px;
  min-height: 36px;
  justify-content: center;
  padding: 0 12px;
  border: 1px solid var(--border-control);
  border-radius: 8px;
  background: var(--surface);
  color: var(--text);
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;

  &:hover {
    background: var(--surface-muted);
  }

  svg {
    width: 14px;
    height: 14px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
`;

export const PlayerFrame = styled.div`
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border-radius: 10px;
  background: var(--player-bg);

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

export const ResizeHandle = styled.div`
  position: absolute;
  right: 5px;
  bottom: 5px;
  width: 18px;
  height: 18px;
  cursor: nwse-resize;

  &::before {
    content: "";
    position: absolute;
    right: 2px;
    bottom: 2px;
    width: 10px;
    height: 10px;
    border-right: 2px solid var(--faint);
    border-bottom: 2px solid var(--faint);
  }
`;
