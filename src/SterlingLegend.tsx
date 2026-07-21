import type { CSSProperties } from "react";
import { sterlingChartColors, sterlingLegendColors } from "./palette";
import type { SterlingLocale } from "./types";

export type SterlingLegendShape = "circle" | "square" | "triangle" | "line";

export interface SterlingLegendItem {
  label: string;
  colorIndex?: number;
  color?: string;
  textColor?: string;
  shape?: SterlingLegendShape;
}

function LegendMark({ shape = "circle" }: { shape?: SterlingLegendShape }) {
  if (shape === "square") {
    return <rect x="2" y="2" width="8" height="8" rx="1" />;
  }

  if (shape === "triangle") {
    return <path d="M 6 1 L 11 10 L 1 10 Z" />;
  }

  if (shape === "line") {
    return <path d="M 1 6 H 11" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />;
  }

  return <circle cx="6" cy="6" r="4.5" />;
}

export function SterlingInlineLegend({
  items,
  locale,
}: {
  items: SterlingLegendItem[];
  locale: SterlingLocale;
}) {
  const parts = new Intl.ListFormat(locale, {
    style: "long",
    type: "conjunction",
  }).formatToParts(items.map((item) => item.label));
  let itemIndex = 0;

  return (
    <span className="sterling-inline-legend">
      {parts.map((part, partIndex) => {
        if (part.type !== "element") {
          return <span key={`literal-${partIndex}`}>{part.value}</span>;
        }

        const item = items[itemIndex++];
        const colorIndex = Math.max(0, Math.min(sterlingChartColors.length - 1, item.colorIndex ?? 0));
        const style = {
          "--sterling-legend-mark": item.color ?? sterlingChartColors[colorIndex],
          "--sterling-legend-text": item.textColor ?? sterlingLegendColors[colorIndex],
        } as CSSProperties;

        return (
          <span key={`${item.label}-${partIndex}`} className="sterling-inline-legend__item" style={style}>
            <svg viewBox="0 0 12 12" aria-hidden="true" focusable="false">
              <LegendMark shape={item.shape} />
            </svg>
            <span>{item.label}</span>
          </span>
        );
      })}
    </span>
  );
}
