import { styled } from "@linaria/react";

export const Progress = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 6px;
`;

export const ChapterBar = styled.div`
  display: flex;
  gap: 3px;
`;

export const ChapterSegment = styled.button`
  flex-basis: 0;
  min-width: 6px;
  padding: 8px 0;
  border: 0;
  background: none;
  cursor: pointer;

  &::before {
    content: "";
    display: block;
    height: 6px;
    border-radius: 3px;
    background: var(--progress-future);
    transition: background 0.15s ease;
  }

  &[data-state="past"]::before {
    background: var(--progress-past);
  }

  &[data-state="current"]::before,
  &:hover::before {
    background: var(--accent);
  }

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
    border-radius: 4px;
  }
`;

export const PlaybackRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 16px;
`;

export const PlaybackTime = styled.span`
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: 13px;
  white-space: nowrap;

  span {
    color: var(--accent);
    font-weight: 600;
  }
`;

export const CurrentChapter = styled.span`
  flex: 1 1 200px;
  min-width: 0;
  overflow: hidden;
  color: var(--muted);
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const NowCard = styled.div`
  display: grid;
  gap: 4px;
  padding: 16px;
  border-radius: 10px;
  background: var(--surface-muted);
`;

export const NowChapter = styled.span`
  color: var(--muted);
  font-size: 13px;
`;

export const NowTitle = styled.span`
  color: var(--text-strong);
  font-size: 17px;
  font-weight: 700;
`;

export const NowDescription = styled.span`
  color: var(--text-secondary);
  font-size: 14px;
`;

export const NextButton = styled.button`
  display: flex;
  flex: 0 1 360px;
  align-items: center;
  gap: 10px;
  min-width: 0;
  min-height: 40px;
  padding: 0 12px;
  border: 1px solid var(--border-control);
  border-radius: 8px;
  background: var(--surface);
  color: var(--text);
  cursor: pointer;
  text-align: left;

  &:hover {
    background: var(--surface-muted);
  }

  svg {
    flex-shrink: 0;
    width: 16px;
    height: 16px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
`;

export const NextLabel = styled.span`
  color: var(--muted);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  white-space: nowrap;
`;

export const NextTime = styled.span`
  color: var(--accent);
  font-family: var(--font-mono);
  font-size: 13px;
`;

export const NextTitle = styled.span`
  flex-grow: 1;
  min-width: 0;
  overflow: hidden;
  font-size: 14px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
