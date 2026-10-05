import { usePersistentChoice } from "../lib/usePersistentChoice";
import { SwitchButton, SwitchGroup } from "./LayoutSwitch.styles";

const LAYOUTS = ["reader", "watch"] as const;
const DEFAULT_LAYOUT: Layout = "watch";

export type Layout = (typeof LAYOUTS)[number];

export function useLayout() {
  const [savedLayout, setLayout] = usePersistentChoice("recap-layout", LAYOUTS);

  return [savedLayout ?? DEFAULT_LAYOUT, setLayout] as const;
}

type LayoutSwitchProps = {
  layout: Layout;
  onChange: (layout: Layout) => void;
};

export function LayoutSwitch({ layout, onChange }: LayoutSwitchProps) {
  return (
    <SwitchGroup role="group" aria-label="Page layout">
      <SwitchButton
        type="button"
        aria-pressed={layout === "reader"}
        onClick={() => onChange("reader")}
        title="Reader: notes first, video on the side"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="M5 8h6M5 12h6M5 16h4" />
          <rect x="14" y="8" width="5" height="4" rx="0.5" />
        </svg>
        <span>Reader</span>
      </SwitchButton>
      <SwitchButton
        type="button"
        aria-pressed={layout === "watch"}
        onClick={() => onChange("watch")}
        title="Watch: video first, notes on the side"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <rect x="5" y="7" width="9" height="6" rx="0.5" />
          <path d="M17 8h2M17 12h2M17 16h2M5 16h9" />
        </svg>
        <span>Watch</span>
      </SwitchButton>
    </SwitchGroup>
  );
}
