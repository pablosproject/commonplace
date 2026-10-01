import { EmptyState } from "../../shared/ui/EmptyState";
import { formatTime } from "./timepoints";
import { TimeLink, Timepoint, Timepoints } from "./TimepointList.styles";
import type { RecapPoint } from "./types";

type TimepointListProps = {
  activeTime: number;
  onSeek: (seconds: number) => void;
  points: RecapPoint[];
  videoUrl: string;
};

export function TimepointList({
  activeTime,
  onSeek,
  points,
  videoUrl,
}: TimepointListProps) {
  if (points.length === 0) {
    return <EmptyState>No timestamped notes yet.</EmptyState>;
  }

  return (
    <Timepoints>
      {points.map((point, index) => {
        const seconds = point.seconds ?? 0;

        return (
          <Timepoint
            data-active={activeTime === seconds}
            key={`${seconds}-${index}`}
          >
            <TimeLink
              href={`${videoUrl}&t=${seconds}s`}
              data-seconds={seconds}
              target="_blank"
              rel="noopener"
              title={`Seek video to ${formatTime(seconds)}`}
              onClick={(event) => {
                event.preventDefault();
                onSeek(seconds);
              }}
            >
              {point.time ?? formatTime(seconds)}
            </TimeLink>{" "}
            <strong>{point.title ?? "Untitled moment"}</strong>
            {point.description ? ` — ${point.description}` : null}
          </Timepoint>
        );
      })}
    </Timepoints>
  );
}
