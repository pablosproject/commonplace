import { useSyncExternalStore } from "react";
import { LibraryStorage } from "./storage";

const library = new LibraryStorage({
  getItem: (key) => window.localStorage.getItem(key),
  setItem: (key, value) => window.localStorage.setItem(key, value),
});
const actions = {
  save: library.save.bind(library),
  saveTime: library.saveTime.bind(library),
  remove: library.remove.bind(library),
};

export function useLibrary() {
  const state = useSyncExternalStore(library.subscribe, library.getSnapshot);
  return { ...state, actions };
}
