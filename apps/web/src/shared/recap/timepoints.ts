import type { RecapPoint, RecapSection } from "./types";

export type Chapter = {
  number: number;
  title: string;
  start: number;
  end: number;
  points: RecapPoint[];
};

export function collectTimepoints(
  highlights: RecapPoint[],
  sections: RecapSection[],
) {
  return [...highlights, ...sections.flatMap((section) => section.points)].sort(
    (left, right) => left.seconds - right.seconds,
  );
}

export function buildChapters(
  sections: RecapSection[],
  durationSeconds: number | null,
): Chapter[] {
  const starts = sections.map((section, index) =>
    index === 0 ? 0 : Math.min(...section.points.map((point) => point.seconds)),
  );

  return sections.map((section, index) => {
    const lastPointSeconds = Math.max(
      ...section.points.map((point) => point.seconds),
    );

    return {
      number: index + 1,
      title: section.title,
      start: starts[index],
      end:
        starts[index + 1] ??
        Math.max(durationSeconds ?? lastPointSeconds, starts[index]),
      points: section.points,
    };
  });
}

export function findActiveTime(
  timepoints: RecapPoint[],
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

export function describePlayback(
  chapters: Chapter[],
  timepoints: RecapPoint[],
  activeTime: number,
) {
  return {
    chapter:
      chapters.filter((chapter) => chapter.start <= activeTime).at(-1) ??
      chapters[0],
    activePoint: timepoints.find((point) => point.seconds === activeTime),
    next: timepoints.find((point) => point.seconds > activeTime),
  };
}

export function formatTime(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = (safeSeconds % 60).toString().padStart(2, "0");

  return hours > 0
    ? `${hours}:${minutes.toString().padStart(2, "0")}:${seconds}`
    : `${minutes}:${seconds}`;
}
