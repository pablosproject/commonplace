import { styled } from "@linaria/react";

export const CallToActionLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--text-strong);
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;

  &:hover {
    color: var(--accent-hover);
  }

  &:focus-visible {
    border-radius: 4px;
    outline: 2px solid var(--accent);
    outline-offset: 2px;
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
