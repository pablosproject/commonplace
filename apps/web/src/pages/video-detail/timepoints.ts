import type { RecapPoint, RecapSection } from "./types";

export function collectTimepoints(
  highlights: RecapPoint[],
  sections: RecapSection[],
) {
  return [...highlights, ...sections.flatMap((section) => section.points ?? [])]
    .filter(
      (point): point is RecapPoint & { seconds: number } =>
        typeof point.seconds === "number" && Number.isFinite(point.seconds),
    )
    .sort((left, right) => left.seconds - right.seconds);
}

export function findActiveTime(
  timepoints: Array<RecapPoint & { seconds: number }>,
  currentSeconds: number,
) {
  let activeTime = timepoints[0]?.seconds ?? 0;

  for (const timepoint of timepoints) {
    if (timepoint.seconds > currentSeconds) {
      break;
    }

    activeTime = timepoint.seconds;
  }

  return activeTime;
}

export function formatTime(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = Math.floor(safeSeconds % 60);

  return [hours, minutes, seconds]
    .map((part) => part.toString().padStart(2, "0"))
    .join(":");
}
