import { styled } from "@linaria/react";
import { LogoLink, LogoMark, PRODUCT_NAME } from "../../shared/brand/Logo";
import { ThemeSelect } from "../../shared/ui/ThemeSelect";
import { TopBar } from "../../shared/ui/TopBar";

export function LandingPage() {
  return (
    <Page>
      <TopBar>
        <LogoLink />
        <Spacer />
        <ThemeSelect />
      </TopBar>
      <Hero>
        <LogoMark size={112} />
        <h1>{PRODUCT_NAME}</h1>
        <Tagline>A commonplace book for video.</Tagline>
        <GitHubLink
          href="https://github.com/pablosproject/commonplace"
          target="_blank"
          rel="noopener"
          aria-label="Commonplace on GitHub"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 1C5.923 1 1 5.923 1 12c0 4.867 3.149 8.979 7.521 10.436.55.096.756-.233.756-.522 0-.262-.013-1.128-.013-2.049-2.764.509-3.479-.674-3.699-1.293-.124-.317-.66-1.293-1.128-1.554-.385-.207-.935-.715-.014-.729.866-.014 1.485.797 1.691 1.128.99 1.663 2.571 1.196 3.204.907.096-.715.385-1.196.701-1.471-2.448-.275-5.005-1.224-5.005-5.445 0-1.196.426-2.186 1.128-2.956-.11-.275-.495-1.402.11-2.915 0 0 .921-.288 3.025 1.128A10.193 10.193 0 0 1 12 6.346a10.2 10.2 0 0 1 2.75.371c2.104-1.43 3.025-1.128 3.025-1.128.605 1.513.22 2.64.11 2.915.702.77 1.128 1.747 1.128 2.956 0 4.235-2.571 5.17-5.019 5.445.399.344.743 1.004.743 2.035 0 1.471-.014 2.654-.014 3.025 0 .289.206.632.756.522A11.02 11.02 0 0 0 23 12c0-6.077-4.922-11-11-11Z" />
          </svg>
        </GitHubLink>
        <InstallLink
          href="https://github.com/pablosproject/commonplace/tree/master/skills/commonplace-youtube-recap#installation"
          target="_blank"
          rel="noopener"
        >
          Install the skill
        </InstallLink>
      </Hero>
    </Page>
  );
}

const Page = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
`;

const Spacer = styled.div`
  flex-grow: 1;
`;

const Hero = styled.main`
  display: grid;
  flex-grow: 1;
  place-content: center;
  justify-items: center;
  gap: 16px;
  padding: 32px 16px 96px;
  color: var(--text-strong);
  text-align: center;

  h1 {
    margin: 8px 0 0;
    font-size: clamp(40px, 7vw, 64px);
    font-weight: 700;
    letter-spacing: -0.03em;
    line-height: 1;
  }

  p {
    max-width: 480px;
    margin: 0;
    color: var(--muted);
    font-size: 16px;
    line-height: 1.6;
  }
`;

const Tagline = styled.p`
  && {
    color: var(--text-secondary);
    font-size: 20px;
  }
`;

const GitHubLink = styled.a`
  display: inline-flex;
  color: var(--text-strong);

  svg {
    width: 32px;
    height: 32px;
    fill: currentColor;
  }

  &:hover {
    color: var(--accent);
  }

  &:focus-visible {
    border-radius: 4px;
    outline: 2px solid var(--accent);
    outline-offset: 4px;
  }
`;

const InstallLink = styled.a`
  color: var(--text-strong);
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 3px;

  &:hover {
    color: var(--accent-hover);
  }
`;
