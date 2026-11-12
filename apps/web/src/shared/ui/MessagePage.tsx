import type { ReactNode } from "react";
import { EmptyState } from "./EmptyState";
import { Shell } from "./MessagePage.styles";

type MessagePageProps = {
  children: ReactNode;
};

export function MessagePage({ children }: MessagePageProps) {
  return <Shell>{children}</Shell>;
}

export function StatusMessagePage({ message }: { message: string }) {
  return (
    <MessagePage>
      <EmptyState>{message}</EmptyState>
    </MessagePage>
  );
}
