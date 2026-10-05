import {
  Eyebrow,
  Message,
  MessageCardBox,
  MessageShell,
  Title,
} from "./MessageCard.styles";

type MessageCardProps = {
  eyebrow: string;
  message: string;
  title: string;
};

export function MessageCard({ eyebrow, message, title }: MessageCardProps) {
  return (
    <MessageShell>
      <MessageCardBox>
        <Eyebrow>{eyebrow}</Eyebrow>
        <Title>{title}</Title>
        <Message>{message}</Message>
      </MessageCardBox>
    </MessageShell>
  );
}
