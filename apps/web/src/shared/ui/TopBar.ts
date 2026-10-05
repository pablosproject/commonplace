import { styled } from "@linaria/react";

export const TopBar = styled.header`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 16px;
  height: 56px;
  padding: 0 28px;
  border-bottom: 1px solid var(--border);
  background: var(--surface);

  @media (max-width: 620px) {
    gap: 12px;
    padding: 0 16px;
  }
`;
