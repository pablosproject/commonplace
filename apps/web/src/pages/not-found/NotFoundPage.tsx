import { MessageCard } from "../../shared/ui/MessageCard";

export function NotFoundPage() {
  return (
    <MessageCard
      eyebrow="404"
      title="Page not found"
      message="This app currently only supports preview links. Open a valid /preview#v=1&d=... link to view a recap."
    />
  );
}
