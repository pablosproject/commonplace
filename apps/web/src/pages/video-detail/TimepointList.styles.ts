import { styled } from "@linaria/react";

export const Timepoints = styled.ul`
  margin: 0;
  padding-left: 0;
  list-style: none;
`;

export const Timepoint = styled.li`
  margin: 12px 0;
  padding-left: 0;

  strong {
    color: #f9fafb;
  }

  &[data-active="true"] {
    background: rgba(96, 165, 250, 0.09);
    border-radius: 12px;
    box-shadow: inset 3px 0 0 rgba(96, 165, 250, 0.9);
    padding: 8px 10px;
    margin-left: -10px;
  }
`;

export const TimeLink = styled.a`
  cursor: pointer;
  display: inline-block;
  color: #bfdbfe;
  background: rgba(96, 165, 250, 0.13);
  border: 1px solid rgba(96, 165, 250, 0.24);
  border-radius: 999px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  padding: 2px 8px;
  margin-right: 8px;
  white-space: nowrap;
  text-decoration: none;
`;
