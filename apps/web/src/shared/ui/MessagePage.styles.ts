import { styled } from "@linaria/react";

export const Shell = styled.main`
  display: grid;
  grid-template-rows: auto 1fr auto;
  min-height: 100dvh;
  padding: 16px 24px 24px;
`;

export const TopBar = styled.header`
  display: flex;
  align-items: center;
  height: 40px;
`;

export const Card = styled.section`
  display: grid;
  justify-items: center;
  align-self: center;
  justify-self: center;
  gap: 16px;
  width: min(100%, 520px);
  padding: 40px 32px;
  border: 1px solid var(--border);
  border-radius: 20px;
  background: var(--surface);
  text-align: center;
`;

export const IconBadge = styled.div`
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--accent-soft);
  color: var(--accent-soft-text);

  svg {
    width: 26px;
    height: 26px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  &[data-icon="loading"] svg {
    animation: message-spin 0.9s linear infinite;
  }

  @keyframes message-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    &[data-icon="loading"] svg {
      animation: none;
    }
  }
`;

export const Title = styled.h1`
  margin: 0;
  color: var(--text-strong);
  font-size: clamp(24px, 4vw, 32px);
  line-height: 1.15;
  letter-spacing: -0.02em;
`;

export const Message = styled.p`
  margin: 0;
  max-width: 40ch;
  color: var(--text-secondary);
  font-size: 17px;
  line-height: 1.5;
`;

export const Footer = styled.footer`
  display: flex;
  justify-content: center;
  padding-top: 24px;
`;
