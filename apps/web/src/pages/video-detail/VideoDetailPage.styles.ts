import { styled } from "@linaria/react";
import { Link } from "react-router-dom";

export const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  color: var(--text);
  font-weight: 600;

  &:hover {
    color: var(--text);
  }

  svg {
    width: 16px;
    height: 16px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
`;

export const Separator = styled.span`
  color: var(--separator);
`;
