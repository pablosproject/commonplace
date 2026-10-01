import { styled } from "@linaria/react";
import { Link } from "react-router-dom";

export const HomeShell = styled.main`
  display: grid;
  gap: 32px;
  min-height: 100vh;
  padding: 32px clamp(18px, 4vw, 56px);
  background: #0c100e;
  color: #edf3ef;

  @media (max-width: 620px) {
    padding: 22px 14px;
  }
`;

export const BrowseHero = styled.section`
  display: grid;
  justify-items: center;
  gap: 24px;
  padding: 52px 20px 44px;
  border-bottom: 1px solid #2b332f;
  text-align: center;
`;

export const HeroContent = styled.div`
  display: grid;
  justify-items: center;

  h1 {
    margin-bottom: 18px;
    max-width: 960px;
    font-size: 3.25rem;
    line-height: 1;
  }

  @media (max-width: 620px) {
    h1 {
      font-size: 2rem;
    }
  }
`;

export const Eyebrow = styled.p`
  margin: 0 0 10px;
  color: #9aa8a0;
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

export const HeroCopy = styled.p`
  margin-bottom: 0;
  max-width: 780px;
  color: #acb8b1;
  font-size: 1.06rem;
  line-height: 1.6;
`;

export const SearchPanel = styled.form`
  display: grid;
  gap: 10px;
  width: min(100%, 680px);
  padding: 16px;
  border: 1px solid #303a35;
  border-radius: 8px;
  background: #151b18;
  text-align: left;

  label {
    color: #c3ccc7;
    font-size: 0.85rem;
    font-weight: 800;
  }
`;

export const SearchRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;

  input {
    min-width: 0;
    border: 1px solid #3b4741;
    border-radius: 8px;
    padding: 12px 14px;
    background: #0f1412;
    color: #edf3ef;
    outline: none;
  }

  input:focus {
    border-color: #76bdf2;
    box-shadow: 0 0 0 3px rgba(118, 189, 242, 0.18);
  }

  input::placeholder {
    color: #738078;
  }

  @media (max-width: 620px) {
    grid-template-columns: 1fr;
  }
`;

export const SearchButton = styled.button`
  border: 0;
  border-radius: 8px;
  padding: 0 18px;
  background: #d8f171;
  color: #101510;
  cursor: pointer;
  font-weight: 700;

  &:hover {
    background: #e5f79a;
  }

  @media (max-width: 620px) {
    min-height: 44px;
  }
`;

export const VideoLibrary = styled.section`
  display: grid;
  gap: 18px;
`;

export const SectionHeading = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: end;

  h2,
  p {
    margin-bottom: 0;
  }

  h2 {
    font-size: 1.45rem;
    line-height: 1.15;
  }

  @media (max-width: 620px) {
    display: grid;
  }
`;

export const ResultCount = styled.p`
  color: #9aa8a0;
`;

export const VideoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 360px));
  gap: 18px;

  @media (max-width: 620px) {
    grid-template-columns: 1fr;
  }
`;

export const LibraryCard = styled.article`
  overflow: hidden;
  border: 1px solid #2b332f;
  border-radius: 8px;
  background: #151b18;
`;

export const ThumbnailLink = styled(Link)`
  position: relative;
  display: block;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: #111a16;

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
  border-radius: 6px;
  background: rgba(17, 26, 22, 0.9);
  color: #ffffff;
  font-size: 0.76rem;
  font-weight: 800;
  padding: 4px 7px;
`;

export const LibraryCardBody = styled.div`
  display: grid;
  gap: 10px;
  padding: 16px;

  h3,
  p {
    margin-bottom: 0;
  }

  h3 {
    font-size: 1.05rem;
    line-height: 1.25;
  }

  p {
    display: -webkit-box;
    overflow: hidden;
    color: #acb8b1;
    line-height: 1.5;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 4;
  }
`;

export const VideoMeta = styled.div`
  display: flex;
  color: #95a29b;
  font-size: 0.82rem;
  font-weight: 700;
`;
