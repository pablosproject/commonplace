import { styled } from "@linaria/react";
import { Link } from "react-router-dom";

export const DetailPage = styled.main`
  width: 100%;
  height: 100dvh;
  margin: 0;
  padding: 8px;

  @media (max-width: 980px) {
    height: auto;
    min-height: 100dvh;
  }
`;

export const DetailShell = styled.div`
  --dock-width: 50vw;
  position: relative;
  height: 100%;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(360px, var(--dock-width));
  gap: 12px;
  align-items: stretch;

  &[data-floating="true"] {
    grid-template-columns: minmax(0, 1fr);
  }

  @media (max-width: 980px) {
    height: auto;
    grid-template-columns: 1fr;
  }
`;

export const NotesPane = styled.article`
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }

  @media (max-width: 980px) {
    overflow: visible;
  }
`;

export const BackLink = styled(Link)`
  display: inline-flex;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: rgba(17, 24, 39, 0.92);
  color: var(--text);
  font-size: 13px;
  font-weight: 800;
  padding: 7px 12px;
  margin-bottom: 20px;
`;

export const SummaryHeader = styled.header`
  padding: 34px;
  border: 1px solid var(--border);
  border-radius: 24px;
  background: linear-gradient(
    135deg,
    rgba(17, 24, 39, 0.96),
    rgba(31, 41, 55, 0.82)
  );
  box-shadow: 0 24px 60px var(--shadow);
  margin-bottom: 28px;

  h1 {
    margin: 10px 0 14px;
    font-size: clamp(30px, 5vw, 52px);
    line-height: 1.05;
  }
`;

export const Eyebrow = styled.div`
  color: var(--accent-2);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 12px;
`;

export const Subtitle = styled.p`
  color: var(--muted);
  font-size: 18px;
  max-width: 880px;
`;

export const Source = styled.p`
  margin-top: 20px;
`;

export const HeroTakeaway = styled.div`
  margin-top: 22px;
  padding: 18px 20px;
  border: 1px solid rgba(52, 211, 153, 0.32);
  border-radius: 18px;
  background: linear-gradient(
    135deg,
    rgba(6, 78, 59, 0.36),
    rgba(17, 24, 39, 0.7)
  );

  h2 {
    color: #bbf7d0;
    margin: 0 0 8px;
    font-size: 20px;
  }

  p {
    margin: 0;
  }
`;

export const Content = styled.article`
  min-width: 0;
`;

export const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 18px;
`;

export const SummarySection = styled.section`
  padding: 26px;
  border: 1px solid var(--border);
  border-radius: 20px;
  background: rgba(17, 24, 39, 0.82);
  box-shadow: 0 14px 34px rgba(0, 0, 0, 0.22);

  h2 {
    margin: 0 0 14px;
    font-size: 24px;
  }
`;

export const ConclusionSection = styled(SummarySection)`
  border-color: rgba(52, 211, 153, 0.32);
  background: linear-gradient(
    135deg,
    rgba(6, 78, 59, 0.42),
    rgba(17, 24, 39, 0.86)
  );

  h2 {
    color: #bbf7d0;
  }
`;

export const SummaryFooter = styled.footer`
  color: var(--muted);
  text-align: center;
  margin-top: 28px;
  font-size: 13px;
`;

export const VideoPane = styled.aside`
  position: relative;
  min-width: 0;
  min-height: 0;

  &[data-floating="true"] {
    position: absolute;
    width: 0;
    height: 0;
  }
`;

export const DockResizer = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  left: -14px;
  width: 28px;
  cursor: col-resize;
  z-index: 5;
  touch-action: none;

  &::before {
    content: "";
    position: absolute;
    left: 13px;
    top: 18px;
    bottom: 18px;
    width: 2px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.12);
    transition: background 0.15s ease;
  }

  &:hover::before {
    background: rgba(96, 165, 250, 0.6);
  }

  @media (max-width: 980px) {
    display: none;
  }
`;

export const DetailMessagePage = styled(DetailPage)`
  display: grid;
  place-content: center;
  gap: 12px;
`;
