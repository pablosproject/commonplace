import { CallToActionLink } from "./MakeRecapLink.styles";

export function MakeRecapLink() {
  return (
    <CallToActionLink
      href="https://github.com/pablosproject/commonplace#install-the-skill"
      target="_blank"
      rel="noopener"
    >
      <span>Make your own recap</span>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 17L17 7M8 7h9v9" />
      </svg>
    </CallToActionLink>
  );
}
