import { useState } from "react";

export function usePersistentChoice<T extends string>(
  key: string,
  options: readonly T[],
) {
  const [choice, setChoice] = useState<T | null>(() =>
    readChoice(key, options),
  );

  const saveChoice = (nextChoice: T | null) => {
    setChoice(nextChoice);

    try {
      if (nextChoice === null) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, nextChoice);
      }
    } catch {}
  };

  return [choice, saveChoice] as const;
}

function readChoice<T extends string>(key: string, options: readonly T[]) {
  try {
    const value = localStorage.getItem(key);
    return options.find((option) => option === value) ?? null;
  } catch {
    return null;
  }
}
