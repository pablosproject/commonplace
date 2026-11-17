import { useLibrary } from "./useLibrary";

export function useSavedRecap(videoId: string | undefined) {
  const { entries, error, actions } = useLibrary();
  const savedRecap = entries.find((entry) => entry.recap.video.id === videoId);

  return { savedRecap, error, actions };
}
