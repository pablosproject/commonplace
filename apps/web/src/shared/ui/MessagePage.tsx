import { LogoLink } from "../brand/Logo";
import { MakeRecapLink } from "./MakeRecapLink";
import {
  Card,
  Footer,
  IconBadge,
  Message,
  Shell,
  Title,
  TopBar,
} from "./MessagePage.styles";

const ICON_PATHS = {
  broken: "M9 17H7A5 5 0 0 1 7 7h2M15 7h2a5 5 0 0 1 4 8M8 12h3M3 3l18 18",
  expired: "M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0",
  loading: "M21 12a9 9 0 1 1-6.2-8.6",
  offline:
    "M12 20h.01M8.5 16.4a5 5 0 0 1 7 0M5 12.9a10 10 0 0 1 5.2-2.7M19 12.9a10 10 0 0 0-2-1.4M2 8.8a15 15 0 0 1 4.2-2.6M22 8.8A15 15 0 0 0 10.7 5M3 3l18 18",
};

export type PageMessage = {
  icon: keyof typeof ICON_PATHS;
  title: string;
  message?: string;
};

export function MessagePage({ icon, title, message }: PageMessage) {
  return (
    <Shell>
      <TopBar>
        <LogoLink />
      </TopBar>
      <Card role={icon === "loading" ? "status" : "alert"}>
        <IconBadge data-icon={icon}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d={ICON_PATHS[icon]} />
          </svg>
        </IconBadge>
        <Title>{title}</Title>
        {message ? <Message>{message}</Message> : null}
      </Card>
      <Footer>
        <MakeRecapLink />
      </Footer>
    </Shell>
  );
}
