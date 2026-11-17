import { styled } from "@linaria/react";

export const Wrapper = styled.div`
  position: relative;
  flex-shrink: 0;
`;

export const SaveTrigger = styled.button`
  display: inline-flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  &:hover,
  &[aria-expanded="true"] {
    background: var(--surface-muted);
    color: var(--text);
  }
  &[data-saved="true"] {
    color: var(--accent);
  }
  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
  svg {
    width: 20px;
    height: 20px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  @media (max-width: 620px) {
    width: 44px;
    height: 44px;
  }
`;

export const Popover = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 20;
  display: grid;
  gap: 12px;
  width: 320px;
  max-height: min(640px, calc(100dvh - 88px));
  overflow-y: auto;
  padding: 18px;
  border: 1px solid var(--border-control);
  border-radius: 10px;
  background: var(--surface);
  color: var(--text);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18);
  font-size: 13px;
  h2 {
    margin: 0;
    font-size: 15px;
    line-height: 1.3;
  }
  p {
    margin: 0;
  }
  summary {
    cursor: pointer;
    font-weight: 600;
  }
  &:focus {
    outline: none;
  }
  @media (max-width: 620px) {
    position: fixed;
    top: 64px;
    right: 16px;
    left: 16px;
    width: auto;
  }
`;

export const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
`;

export const Button = styled.button`
  min-height: 40px;
  padding: 8px 12px;
  border: 1px solid var(--border-control);
  border-radius: 8px;
  background: var(--surface);
  color: var(--text);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  &:hover {
    background: var(--surface-muted);
  }
  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
  &:disabled {
    opacity: 0.65;
    cursor: default;
  }
  &[data-primary="true"] {
    background: var(--text-strong);
    border-color: transparent;
    color: var(--bg);
  }
  &[data-danger="true"] {
    color: var(--danger);
  }
  @media (max-width: 620px) {
    min-height: 44px;
  }
`;

export const Hint = styled.p`
  color: var(--muted);
  font-size: 13px;
`;

export const ErrorNotice = styled.p`
  color: var(--danger);
  font-size: 13px;
`;

export const Toast = styled.div`
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 30;
  width: max-content;
  max-width: calc(100% - 32px);
  padding: 12px 16px;
  border: 1px solid var(--border-control);
  border-radius: 9px;
  background: var(--text-strong);
  color: var(--bg);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  font-size: 13px;
`;
