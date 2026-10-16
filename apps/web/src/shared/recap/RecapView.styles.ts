import { styled } from "@linaria/react";

export const RecapPage = styled.div`
  display: flex;
  flex-direction: column;
  height: 100dvh;

  @media (max-width: 980px) {
    height: auto;
    min-height: 100dvh;
  }
`;

export const Separator = styled.span`
  color: var(--separator);
`;

export const Breadcrumb = styled.span`
  flex-grow: 1;
  min-width: 0;
  overflow: hidden;
  color: var(--muted);
  text-overflow: ellipsis;
  white-space: nowrap;

  @media (max-width: 620px) {
    display: none;
  }
`;

export const WatchLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  white-space: nowrap;

  svg {
    width: 14px;
    height: 14px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  @media (max-width: 620px) {
    span {
      display: none;
    }
  }
`;

export const RecapShell = styled.div`
  --notes-width: max(500px, 25%);
  position: relative;
  flex-grow: 1;
  min-height: 0;
  display: grid;

  &[data-layout="reader"] {
    --notes-width: min(50%, calc(100% - 600px));
    grid-template-columns: minmax(0, var(--notes-width)) minmax(600px, 1fr);
    grid-template-areas: "notes video";
  }

  &[data-layout="watch"] {
    grid-template-columns: minmax(0, 1fr) minmax(500px, var(--notes-width));
    grid-template-areas: "video notes";
  }

  &[data-layout="reader"][data-resized="true"] {
    grid-template-columns: minmax(100px, var(--notes-width)) minmax(100px, 1fr);
  }

  &[data-layout="watch"][data-resized="true"] {
    grid-template-columns: minmax(100px, 1fr) minmax(100px, var(--notes-width));
  }

  &[data-layout="reader"][data-floating="true"] {
    grid-template-columns: minmax(0, 1fr) 0;
  }

  @media (max-width: 980px) {
    &[data-layout] {
      grid-template-columns: minmax(0, 1fr);
      grid-template-areas: "video" "notes";
    }
  }

  @media (max-width: 980px) and (orientation: landscape) {
    &[data-layout] {
      grid-template-columns:
        min(55%, calc((100dvh - 136px) * 16 / 9))
        minmax(0, 1fr);
      grid-template-areas: "video notes";
      align-items: start;
    }
  }
`;

export const VideoColumn = styled.div`
  grid-area: video;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
  min-height: 0;
  overflow-y: auto;

  ${RecapShell}[data-layout="reader"] & {
    gap: 20px;
    padding: 24px;
    border-left: 1px solid var(--border);
    background: var(--surface);
  }

  ${RecapShell}[data-layout="reader"][data-floating="true"] & {
    overflow: hidden;
    padding: 0;
    border: 0;
  }

  ${RecapShell}[data-layout="watch"] & {
    gap: 28px;
    padding: 24px 32px 56px;
  }

  @media (max-width: 980px) {
    ${RecapShell}[data-layout] & {
      position: sticky;
      top: 0;
      z-index: 2;
      justify-content: flex-start;
      overflow: visible;
      padding: 12px 16px 4px;
      border-left: 0;
      border-bottom: 1px solid var(--border);
      background: var(--bg);
    }
  }

  @media (max-width: 980px) and (orientation: landscape) {
    ${RecapShell}[data-layout] & {
      border-bottom: 0;
    }
  }
`;

export const CallToAction = styled.div`
  display: flex;
  flex-shrink: 0;
  justify-content: flex-end;

  @media (min-width: 981px) {
    position: absolute;
    z-index: 1;

    ${RecapShell}[data-layout="reader"] & {
      right: 24px;
      bottom: 24px;
    }

    ${RecapShell}[data-layout="watch"] & {
      bottom: 24px;
      left: 32px;
    }
  }
`;

export const NotesColumn = styled.main`
  grid-area: notes;
  position: relative;
  min-width: 0;
  min-height: 0;

  ${RecapShell}[data-layout="watch"] & {
    border-left: 1px solid var(--border);
    background: var(--surface);
  }
`;

export const NotesScroll = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;

  ${RecapShell}[data-layout="reader"] & {
    gap: 44px;
    padding: 48px max(56px, calc((100% - 700px) / 2)) 80px;
  }

  ${RecapShell}[data-layout="watch"] & {
    gap: 32px;
    padding: 0 28px 64px;
  }

  @media (max-width: 980px) {
    ${RecapShell}[data-layout] & {
      height: auto;
      overflow: visible;
      padding: 24px 16px 48px;
    }
  }
`;

export const Intro = styled.section`
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-width: 820px;

  h1 {
    margin: 0;
    color: var(--text-strong);
    font-size: clamp(26px, 2.8vw, 36px);
    font-weight: 700;
    letter-spacing: -0.02em;
    line-height: 1.14;
  }
`;

export const Meta = styled.div`
  color: var(--muted);
  font-size: 14px;
  font-weight: 500;
`;

export const Abstract = styled.p`
  margin: 0;
  color: var(--text-secondary);
  font-size: 16px;
  line-height: 1.6;
`;

export const PullQuote = styled.section`
  padding-top: 18px;
  border-top: 2px solid var(--rule);

  p {
    margin: 0;
    color: var(--text-strong);
  }

  &[data-size="large"] {
    margin-top: 8px;
  }

  &[data-size="large"] p {
    font-size: 20px;
    font-weight: 500;
    line-height: 1.45;
  }
`;

export const Label = styled.h2`
  margin: 0 0 8px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

export const NotesSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const SectionHeading = styled.div`
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 6px;
  border-bottom: 1px solid var(--border);
  background: var(--surface);

  h2 {
    flex-grow: 1;
    margin: 0;
    color: var(--text-strong);
    font-weight: 700;
    line-height: 1.3;
  }

  ${RecapShell}[data-layout="reader"] & {
    padding-bottom: 10px;
    background: var(--bg);
  }

  ${RecapShell}[data-layout="reader"] & h2 {
    font-size: 20px;
  }

  ${RecapShell}[data-layout="watch"] & {
    position: sticky;
    top: 0;
    z-index: 1;
    padding: 20px 0 10px;
  }

  ${RecapShell}[data-layout="watch"] & h2 {
    font-size: 16px;
  }

  @media (max-width: 980px) {
    ${RecapShell}[data-layout] & {
      position: static;
    }
  }
`;

export const ChapterNumber = styled.span`
  color: var(--faint);
  font-family: var(--font-mono);
  font-size: 12px;
`;

export const HeadingAside = styled.span`
  color: var(--muted);
  font-size: 13px;
  white-space: nowrap;

  &[data-mono="true"] {
    font-family: var(--font-mono);
    font-size: 12px;
  }
`;

export const Footer = styled.footer`
  color: var(--muted);
  font-size: 13px;
  text-align: center;
`;

export const SideResizer = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  right: calc(var(--notes-width) - 7px);
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  cursor: col-resize;
  touch-action: none;

  ${RecapShell}[data-layout="reader"] & {
    right: auto;
    left: calc(var(--notes-width) - 7px);
  }

  &::before {
    content: "";
    width: 4px;
    height: 36px;
    border-radius: 2px;
    background: var(--grip);
    transition: background 0.15s ease;
  }

  &:hover::before {
    background: var(--accent);
  }

  @media (max-width: 980px) {
    display: none;
  }
`;
