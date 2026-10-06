import { styled } from "@linaria/react";
import { Link } from "react-router-dom";

export const PRODUCT_NAME = "Commonplace";

export function LogoMark({ size }: { size: number }) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden="true"
    >
      <rect x="18" y="8" width="24" height="13" rx="6.5" />
      <rect x="15" y="26" width="46" height="13" rx="6.5" />
      <rect x="12" y="44" width="72" height="13" rx="6.5" />
      <rect x="15" y="62" width="46" height="13" rx="6.5" />
      <rect x="18" y="80" width="24" height="13" rx="6.5" />
    </svg>
  );
}

export function LogoLink() {
  return (
    <Lockup to="/">
      <LogoMark size={22} />
      {PRODUCT_NAME}
    </Lockup>
  );
}

const Lockup = styled(Link)`
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 8px;
  color: var(--text-strong);
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.02em;

  &:hover {
    color: var(--text-strong);
    text-decoration: none;
  }
`;
