import { styled } from "@linaria/react";

export const Banner = styled.section`
  flex-shrink: 0;
  padding: 10px 28px;
  border-bottom: 1px solid var(--border);
  background: var(--surface-muted);
  color: var(--text-secondary);
  font-size: 14px;

  @media (max-width: 620px) {
    padding: 10px 16px;
  }
`;

export const Summary = styled.summary`
  cursor: pointer;
  color: var(--text-strong);
  font-weight: 600;
`;

export const OwnerPanel = styled.div`
  display: grid;
  gap: 12px;
  max-width: 760px;
  padding: 12px 0 4px;
`;

export const Field = styled.div`
  display: grid;
  gap: 4px;
`;

export const FieldLabel = styled.span`
  color: var(--muted);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
`;

export const FieldRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
`;

export const FieldNote = styled.span`
  color: var(--muted);
  font-size: 13px;
`;

export const LinkInput = styled.input`
  min-width: 0;
  height: 36px;
  padding: 0 10px;
  border: 1px solid var(--border-control);
  border-radius: 8px;
  background: var(--surface);
  color: var(--text);
  font-family: var(--font-mono);
  font-size: 13px;

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
  }
`;

export const Button = styled.button`
  height: 36px;
  padding: 0 14px;
  border: 1px solid var(--border-control);
  border-radius: 8px;
  background: var(--surface);
  color: var(--text-strong);
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;

  &:hover {
    border-color: var(--separator);
  }

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
`;

export const DangerButton = styled(Button)`
  color: var(--danger);
`;

export const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
`;
