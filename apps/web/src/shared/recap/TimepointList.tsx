import { EmptyState } from "../ui/EmptyState";
import { formatTime } from "./timepoints";
import {
  KeyBadge,
  PointBody,
  PointDescription,
  PointTime,
  PointTitle,
  TimepointRow,
  Timepoints,
} from "./TimepointList.styles";
import type { RecapPoint } from "./types";

type TimepointListProps = {
  activeTime: number;
  keySeconds?: Set<number>;
  onSeek: (seconds: number) => void;
  points: RecapPoint[];
  videoUrl: string;
};

export function TimepointList({
  activeTime,
  keySeconds,
  onSeek,
  points,
  videoUrl,
}: TimepointListProps) {
  if (points.length === 0) {
    return <EmptyState>No timestamped notes yet.</EmptyState>;
  }

  return (
    <Timepoints>
      {points.map((point, index) => (
        <li key={`${point.seconds}-${index}`}>
          <TimepointRow
            href={`${videoUrl}&t=${point.seconds}s`}
            data-active={activeTime === point.seconds}
            aria-current={activeTime === point.seconds ? "time" : undefined}
            onClick={(event) => {
              event.preventDefault();
              onSeek(point.seconds);
            }}
          >
            <PointTime>{formatTime(point.seconds)}</PointTime>
            <PointBody>
              <PointTitle>
                {point.title}
                {keySeconds?.has(point.seconds) ? (
                  <KeyBadge>Key</KeyBadge>
                ) : null}
              </PointTitle>
              <PointDescription>{point.description}</PointDescription>
            </PointBody>
          </TimepointRow>
        </li>
      ))}
    </Timepoints>
  );
}
