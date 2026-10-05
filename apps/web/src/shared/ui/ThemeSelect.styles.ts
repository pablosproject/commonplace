import { styled } from "@linaria/react";

export const SelectWrapper = styled.div`
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;

  svg {
    position: absolute;
    left: 10px;
    width: 16px;
    height: 16px;
    fill: none;
    stroke: var(--text);
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
    pointer-events: none;
  }

  &::after {
    content: "";
    position: absolute;
    right: 12px;
    width: 6px;
    height: 6px;
    border-right: 1.5px solid var(--muted);
    border-bottom: 1.5px solid var(--muted);
    transform: translateY(-2px) rotate(45deg);
    pointer-events: none;
  }
`;

export const Select = styled.select`
  appearance: none;
  height: 40px;
  padding: 0 32px 0 34px;
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

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
`;

export const HiddenLabel = styled.label`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
`;
