import { styled } from "@linaria/react";
import { Link } from "react-router-dom";

export const HomeShell = styled.div`
  min-height: 100vh;
`;

export const Brand = styled(Link)`
  flex-grow: 1;
  color: var(--text-strong);
  font-size: 16px;
  font-weight: 700;

  &:hover {
    color: var(--text-strong);
    text-decoration: none;
  }
`;

export const HomeContent = styled.main`
  display: grid;
  gap: 40px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 56px clamp(16px, 4vw, 56px) 80px;

  @media (max-width: 620px) {
    gap: 32px;
    padding-top: 32px;
  }
`;

export const BrowseHero = styled.section`
  display: grid;
  gap: 28px;
  padding-bottom: 40px;
  border-bottom: 1px solid var(--border);
`;

export const HeroContent = styled.div`
  display: grid;
  gap: 14px;
  max-width: 760px;

  h1 {
    margin: 0;
    color: var(--text-strong);
    font-size: clamp(32px, 4.4vw, 48px);
    font-weight: 700;
    letter-spacing: -0.02em;
    line-height: 1.08;
  }
`;

export const Eyebrow = styled.p`
  margin: 0;
  color: var(--muted);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

export const HeroCopy = styled.p`
  margin: 0;
  color: var(--text-secondary);
  font-size: 17px;
  line-height: 1.6;
`;

export const SearchPanel = styled.form`
  display: grid;
  gap: 8px;
  width: min(100%, 640px);

  label {
    color: var(--muted);
    font-size: 13px;
    font-weight: 600;
  }
`;

export const SearchRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;

  input {
    min-width: 0;
    min-height: 44px;
    padding: 0 14px;
    border: 1px solid var(--border-control);
    border-radius: 8px;
    background: var(--surface);
    color: var(--text);
    outline: none;
  }

  input:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-soft);
  }

  input::placeholder {
    color: var(--faint);
  }

  @media (max-width: 620px) {
    grid-template-columns: 1fr;
  }
`;

export const SearchButton = styled.button`
  min-height: 44px;
  padding: 0 20px;
  border: 0;
  border-radius: 8px;
  background: var(--accent);
  color: var(--on-accent);
  cursor: pointer;
  font-weight: 600;

  &:hover {
    background: var(--accent-hover);
  }
`;

export const VideoLibrary = styled.section`
  display: grid;
  gap: 20px;
`;

export const SectionHeading = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 20px;

  h2 {
    margin: 4px 0 0;
    color: var(--text-strong);
    font-size: 22px;
    line-height: 1.2;
  }

  @media (max-width: 620px) {
    display: grid;
  }
`;

export const ResultCount = styled.p`
  margin: 0;
  color: var(--muted);
  font-size: 14px;
`;

export const VideoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;

  @media (max-width: 620px) {
    grid-template-columns: 1fr;
  }
`;

export const LibraryCard = styled.article`
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface);
`;

export const ThumbnailLink = styled(Link)`
  position: relative;
  display: block;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: var(--player-bg);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

export const DurationChip = styled.span`
  position: absolute;
  right: 10px;
  bottom: 10px;
  padding: 2px 7px;
  border-radius: 6px;
  background: rgba(10, 10, 10, 0.85);
  color: #ffffff;
  font-family: var(--font-mono);
  font-size: 12px;
`;

export const LibraryCardBody = styled.div`
  display: grid;
  gap: 8px;
  padding: 16px;

  h3,
  p {
    margin: 0;
  }

  h3 {
    font-size: 17px;
    line-height: 1.3;
  }

  h3 a {
    color: var(--text-strong);
  }

  p {
    display: -webkit-box;
    overflow: hidden;
    color: var(--muted);
    font-size: 14px;
    line-height: 1.55;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 4;
  }
`;

export const VideoMeta = styled.div`
  color: var(--muted);
  font-size: 13px;
  font-weight: 500;
`;
