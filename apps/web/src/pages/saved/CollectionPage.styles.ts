import { styled } from "@linaria/react";

export const LibraryMain = styled.main`
  flex-grow: 1;
  width: min(808px, 100%);
  margin: 0 auto;
  padding: 56px 24px 64px;
  &[data-view="grid"] {
    width: min(1088px, 100%);
  }
`;

export const Heading = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  h1 {
    margin: 0;
    font-size: 28px;
    font-weight: 600;
    letter-spacing: -0.02em;
  }
`;

export const Count = styled.span`
  margin-left: 10px;
  color: var(--faint);
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 400;
`;

export const ViewSwitch = styled.div`
  display: inline-flex;
  gap: 2px;
`;

export const ViewButton = styled.button`
  display: inline-flex;
  justify-content: center;
  align-items: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--faint);
  cursor: pointer;
  &:hover {
    background: var(--surface-muted);
  }
  &[aria-pressed="true"] {
    color: var(--text-strong);
  }
  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
  svg {
    width: 18px;
    height: 18px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.8;
    stroke-linecap: round;
  }
`;

export const Thumbnail = styled.div`
  position: relative;
  flex-shrink: 0;
  padding-bottom: 9px;
  a {
    display: block;
  }
  img {
    display: block;
    width: 100%;
    aspect-ratio: 16 / 9;
    border-radius: 6px;
    background: var(--surface-muted);
    object-fit: cover;
  }
`;

export const Progress = styled.div`
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 3px;
  overflow: hidden;
  border-radius: 2px;
  background: var(--progress-future);
  span {
    display: block;
    height: 100%;
    background: var(--watched);
  }
`;

export const EntryText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  h2 {
    margin: 0;
    font-size: 16px;
    font-weight: 500;
    line-height: 1.35;
  }
  a {
    color: var(--text-strong);
  }
  a:hover {
    color: var(--accent);
  }
`;

export const Takeaway = styled.p`
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.5;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
`;

export const Meta = styled.p`
  margin: 0;
  color: var(--faint);
  font-size: 13px;
  span + span::before {
    content: " · ";
  }
`;

export const Entry = styled.article`
  display: flex;
  gap: 20px;
  align-items: flex-start;
`;

export const Entries = styled.div`
  display: grid;
  gap: 28px;
  margin-top: 32px;
  ${Thumbnail} {
    width: 160px;
  }
  [data-view="grid"] & {
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr));
    gap: 40px 28px;
  }
  [data-view="grid"] & ${Entry} {
    flex-direction: column;
    gap: 12px;
  }
  [data-view="grid"] & ${Thumbnail} {
    width: 100%;
  }
  [data-view="grid"] & ${Thumbnail} img {
    border-radius: 8px;
  }
  @media (max-width: 520px) {
    ${Thumbnail} {
      width: 112px;
    }
  }
`;

export const Empty = styled.section`
  margin-top: 32px;
  padding: 32px;
  border: 1px dashed var(--border);
  border-radius: 12px;
  color: var(--muted);
  h2 {
    color: var(--text);
    font-size: 20px;
  }
  p {
    margin: 0;
  }
`;

export const LocalNotice = styled.details`
  margin-top: 48px;
  padding-top: 16px;
  border-top: 1px solid var(--border);
  color: var(--muted);
  font-size: 12px;
  summary {
    cursor: pointer;
  }
  p {
    max-width: 740px;
    margin: 10px 0 0;
  }
`;
