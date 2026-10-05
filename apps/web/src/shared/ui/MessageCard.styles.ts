import { styled } from "@linaria/react";

export const MessageShell = styled.main`
  display: grid;
  min-height: 100dvh;
  place-items: center;
  padding: 24px;
`;

export const MessageCardBox = styled.section`
  width: min(100%, 560px);
  padding: 32px;
  border: 1px solid var(--border);
  border-radius: 20px;
  background: var(--surface);
  box-shadow: 0 24px 80px rgba(24, 24, 27, 0.08);
`;

export const Eyebrow = styled.div`
  color: var(--muted);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

export const Title = styled.h1`
  margin: 8px 0 12px;
  color: var(--text-strong);
  font-size: clamp(30px, 6vw, 52px);
  line-height: 1;
  letter-spacing: -0.04em;
`;

export const Message = styled.p`
  margin: 0;
  color: var(--text-secondary);
  font-size: 16px;
`;
