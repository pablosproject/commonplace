import { styled } from "@linaria/react";

export const Timepoints = styled.ul`
  display: grid;
  gap: 2px;
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const PointTime = styled.span`
  padding-top: 2px;
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: 13px;
`;

export const TimepointRow = styled.a`
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  gap: 12px;
  min-height: 44px;
  margin: 0 -12px;
  padding: 10px 12px;
  border-radius: 8px;
  color: var(--text);

  &:hover {
    color: var(--text);
    text-decoration: none;
    background: var(--surface-muted);
  }

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  &[data-active="true"] {
    background: var(--accent-soft);
  }

  &[data-active="true"] ${PointTime} {
    color: var(--accent);
    font-weight: 600;
  }
`;

export const PointBody = styled.span`
  display: block;
  min-width: 0;
`;

export const PointTitle = styled.span`
  display: block;
  font-weight: 600;
`;

export const PointDescription = styled.span`
  display: block;
  color: var(--muted);
  font-size: 14px;
`;

export const KeyBadge = styled.span`
  display: inline-block;
  margin-left: 8px;
  padding: 1px 6px;
  border-radius: 4px;
  background: var(--accent-soft);
  color: var(--accent-soft-text);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  vertical-align: 1px;
`;
