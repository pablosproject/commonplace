import { useEffect, useId, type ChangeEvent } from "react";
import { useMediaQuery } from "../lib/useMediaQuery";
import { usePersistentChoice } from "../lib/usePersistentChoice";
import { HiddenLabel, Select, SelectWrapper } from "./ThemeSelect.styles";

const THEMES = ["light", "dark"] as const;

export function ThemeSelect() {
  const selectId = useId();
  const [savedTheme, setSavedTheme] = usePersistentChoice("theme", THEMES);
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
  const theme = savedTheme ?? (prefersDark ? "dark" : "light");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const onChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSavedTheme(
      THEMES.find((option) => option === event.target.value) ?? null,
    );
  };

  return (
    <SelectWrapper>
      <HiddenLabel htmlFor={selectId}>Theme</HiddenLabel>
      {theme === "dark" ? <MoonIcon /> : <SunIcon />}
      <Select id={selectId} value={savedTheme ?? "system"} onChange={onChange}>
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </Select>
    </SelectWrapper>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}
