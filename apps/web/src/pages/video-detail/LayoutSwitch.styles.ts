import { styled } from "@linaria/react";

export const SwitchGroup = styled.div`
  display: inline-flex;
  flex-shrink: 0;
  padding: 3px;
  border: 1px solid var(--border-control);
  border-radius: 10px;
  background: var(--bg);

  @media (max-width: 980px) {
    display: none;
  }
`;

export const SwitchButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 10px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;

  &:hover {
    color: var(--text);
  }

  &[aria-pressed="true"] {
    background: var(--surface);
    color: var(--text-strong);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
  }

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
  }

  svg {
    width: 16px;
    height: 16px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
`;
