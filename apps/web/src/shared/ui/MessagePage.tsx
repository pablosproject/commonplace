import type { ReactNode } from "react";
import { Shell } from "./MessagePage.styles";

type MessagePageProps = {
  children: ReactNode;
};

export function MessagePage({ children }: MessagePageProps) {
  return <Shell>{children}</Shell>;
}
