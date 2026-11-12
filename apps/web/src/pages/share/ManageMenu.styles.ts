import { styled } from "@linaria/react";

const NARROW = "@media (max-width: 620px)";

export const Wrapper = styled.div`
  position: relative;
  flex-shrink: 0;
`;

export const Trigger = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 12px;
  border: 1px solid var(--border-control);
  border-radius: 8px;
  background: var(--surface);
  color: var(--muted);
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;

  &::after {
    content: "";
    width: 6px;
    height: 6px;
    margin: 0 2px 0 4px;
    border-right: 1.5px solid var(--muted);
    border-bottom: 1.5px solid var(--muted);
    transform: translateY(-2px) rotate(45deg);
  }

  &:hover,
  &[aria-expanded="true"] {
    background: var(--surface-muted);
    color: var(--text);
  }

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  &[data-done="true"] {
    color: var(--faint);
  }

  svg {
    width: 16px;
    height: 16px;
    fill: none;
    stroke: var(--faint);
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  [data-size="short"] {
    display: none;
  }

  ${NARROW} {
    gap: 6px;
    padding: 0 10px;

    &::after {
      display: none;
    }

    [data-size="long"] {
      display: none;
    }

    [data-size="short"] {
      display: inline;
      font-family: var(--font-mono);
      font-size: 12.5px;
    }
  }
`;

export const Menu = styled.div`
  position: absolute;
  z-index: 20;
  top: calc(100% + 8px);
  right: 0;
  width: 300px;
  padding: 6px;
  border: 1px solid var(--border-control);
  border-radius: 10px;
  background: var(--surface);
  box-shadow:
    0 12px 32px rgba(0, 0, 0, 0.18),
    0 2px 6px rgba(0, 0, 0, 0.08);

  svg {
    flex-shrink: 0;
    width: 16px;
    height: 16px;
    margin-top: 2px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  ${NARROW} {
    position: fixed;
    top: 64px;
    right: 16px;
    left: 16px;
    width: auto;
  }
`;

export const Header = styled.div`
  display: grid;
  gap: 2px;
  margin-bottom: 4px;
  padding: 10px 10px 8px;
  border-bottom: 1px solid var(--border);
  color: var(--muted);
  font-size: 12.5px;

  strong {
    color: var(--text-strong);
    font-size: 13px;
  }

  span:last-child {
    margin-top: 4px;
    color: var(--faint);
  }

  b {
    color: var(--text-secondary);
    font-weight: 600;
  }
`;

export const Item = styled.button`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  width: 100%;
  padding: 9px 10px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: var(--text);
  cursor: pointer;
  font-size: 13.5px;
  font-weight: 600;
  text-align: left;

  &:hover,
  &:focus-visible {
    background: var(--surface-muted);
    outline: none;
  }

  &[data-danger] {
    color: var(--danger);
  }

  &[data-danger]:hover {
    background: color-mix(in srgb, var(--danger) 12%, transparent);
  }

  [data-copied="true"] {
    color: var(--accent);
  }
`;

export const Hint = styled.span`
  display: block;
  color: var(--muted);
  font-size: 12.5px;
  font-weight: 400;
`;

export const ConfirmBox = styled.div`
  margin: 2px 4px 4px;
  padding: 10px;
  border: 1px solid var(--border-control);
  border-radius: 8px;
  background: color-mix(in srgb, var(--danger) 10%, transparent);
  font-size: 13px;

  p {
    margin: 0 0 10px;
    color: var(--text);
  }

  b {
    color: var(--text-strong);
  }

  div {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
`;

export const ConfirmButton = styled.button`
  height: 32px;
  padding: 0 12px;
  border: 1px solid var(--border-control);
  border-radius: 7px;
  background: var(--surface);
  color: var(--text);
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;

  &:hover {
    background: var(--surface-muted);
  }

  &:disabled {
    cursor: default;
    opacity: 0.6;
  }

  &[data-danger] {
    border-color: transparent;
    background: var(--danger);
    color: var(--surface);
  }
`;

export const Notice = styled.p`
  margin: 0;
  padding: 10px;
  color: var(--text-secondary);
  font-size: 13px;
`;
