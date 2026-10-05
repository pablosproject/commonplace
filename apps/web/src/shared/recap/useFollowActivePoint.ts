import { useEffect, useRef, type RefObject } from "react";

export function useFollowActivePoint(
  containerRef: RefObject<HTMLElement>,
  activeTime: number,
  enabled: boolean,
) {
  const followedTimeRef = useRef(activeTime);

  useEffect(() => {
    if (followedTimeRef.current === activeTime) {
      return;
    }

    followedTimeRef.current = activeTime;
    if (!enabled) {
      return;
    }

    containerRef.current
      ?.querySelector('[data-chapter] [aria-current="time"]')
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeTime]);

  const skipFollowTo = (time: number) => {
    followedTimeRef.current = time;
  };

  return skipFollowTo;
}
