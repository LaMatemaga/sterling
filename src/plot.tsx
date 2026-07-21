import { scaleLinear, scaleTime } from "d3-scale";
import type { ScaleLinear, ScaleTime } from "d3-scale";
import { sterlingDivergentColors } from "./palette";
import { sterlingVisualStyle } from "./visualStyle";

/**
 * Shared cartesian foundation for every Sterling chart.
 *
 * One geometry, one axis grammar: gridlines, tick marks, tick labels, and axis
 * titles are drawn the same way everywhere so the whole catalog reads as a
 * single visualization package. Colors come from the theme tokens only.
 */

export const axisText = "var(--sterling-text)";
export const axisMuted = "var(--sterling-muted)";
export const axisGrid = "var(--sterling-grid)";
export const axisLine = "var(--sterling-edge)";
const MONO = "var(--font-mono)";

export const TICK = 5;
export const TICK_LABEL = 11;
export const AXIS_TITLE = 12;

export interface Margin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** Room on the left/bottom for tick labels plus an axis title. */
export const defaultMargin: Margin = { top: 26, right: 26, bottom: 56, left: 70 };

export interface Frame {
  width: number;
  height: number;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

export function frame(width: number, height: number, margin: Margin = defaultMargin): Frame {
  return {
    width,
    height,
    x0: margin.left,
    x1: width - margin.right,
    y0: margin.top,
    y1: height - margin.bottom,
  };
}

/** Linear scale with a nice domain; `zero` anchors magnitude charts at 0. */
export function linearScale(
  values: number[],
  range: [number, number],
  { zero = false, padFraction = 0.05 }: { zero?: boolean; padFraction?: number } = {},
): ScaleLinear<number, number> {
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    min = 0;
    max = 1;
  }
  if (min === max) {
    // Degenerate range: open it up so ticks and the mark stay visible.
    const bump = Math.abs(min) || 1;
    min -= bump;
    max += bump;
  }
  if (zero) {
    min = Math.min(0, min);
    max = Math.max(0, max);
  } else {
    const pad = (max - min) * padFraction;
    min -= pad;
    max += pad;
  }
  return scaleLinear().domain([min, max]).nice().range(range);
}

export function timeScale(domain: [number, number], range: [number, number]): ScaleTime<number, number> {
  return scaleTime().domain(domain).range(range).nice();
}

function tickValues(scale: ScaleLinear<number, number>, count: number): number[] {
  return scale.ticks(count);
}

/** Horizontal gridlines aligned to the left-axis ticks. */
export function Gridlines({
  scale,
  x0,
  x1,
  count = 5,
}: {
  scale: ScaleLinear<number, number>;
  x0: number;
  x1: number;
  count?: number;
}) {
  return (
    <g aria-hidden="true">
      {tickValues(scale, count).map((value) => (
        <line key={value} x1={x0} x2={x1} y1={scale(value)} y2={scale(value)} stroke={axisGrid} strokeWidth={sterlingVisualStyle.stroke.grid} />
      ))}
    </g>
  );
}

export function AxisLeft({
  scale,
  x,
  gridX1,
  count = 5,
  title,
  format,
}: {
  scale: ScaleLinear<number, number>;
  x: number;
  gridX1?: number;
  count?: number;
  title?: string;
  format?: (value: number) => string;
}) {
  const values = tickValues(scale, count);
  const fmt = format ?? ((value: number) => scale.tickFormat(count)(value));
  const [yBottom, yTop] = scale.range();
  return (
    <g>
      {gridX1 !== undefined
        ? values.map((value) => (
            <line key={`g${value}`} x1={x} x2={gridX1} y1={scale(value)} y2={scale(value)} stroke={axisGrid} strokeWidth={sterlingVisualStyle.stroke.grid} />
          ))
        : null}
      <line x1={x} x2={x} y1={yBottom} y2={yTop} stroke={axisLine} />
      {values.map((value) => (
        <g key={value}>
          <line x1={x - TICK} x2={x} y1={scale(value)} y2={scale(value)} stroke={axisLine} />
          <text x={x - TICK - 4} y={scale(value) + 3.6} textAnchor="end" fill={axisMuted} fontSize={TICK_LABEL} fontFamily={MONO}>
            {fmt(value)}
          </text>
        </g>
      ))}
      {title ? (
        <text
          transform={`translate(${x - 48} ${(yBottom + yTop) / 2}) rotate(-90)`}
          textAnchor="middle"
          fill={axisMuted}
          fontSize={AXIS_TITLE}
          fontFamily={MONO}
        >
          {title}
        </text>
      ) : null}
    </g>
  );
}

export function AxisBottom({
  scale,
  y,
  count = 6,
  title,
  format,
  titleGap = 42,
}: {
  scale: ScaleLinear<number, number>;
  y: number;
  count?: number;
  title?: string;
  format?: (value: number) => string;
  titleGap?: number;
}) {
  const values = tickValues(scale, count);
  const fmt = format ?? ((value: number) => scale.tickFormat(count)(value));
  const [x0, x1] = scale.range();
  return (
    <g>
      <line x1={x0} x2={x1} y1={y} y2={y} stroke={axisLine} />
      {values.map((value) => (
        <g key={value}>
          <line x1={scale(value)} x2={scale(value)} y1={y} y2={y + TICK} stroke={axisLine} />
          <text x={scale(value)} y={y + TICK + 13} textAnchor="middle" fill={axisMuted} fontSize={TICK_LABEL} fontFamily={MONO}>
            {fmt(value)}
          </text>
        </g>
      ))}
      {title ? (
        <text x={(x0 + x1) / 2} y={y + titleGap} textAnchor="middle" fill={axisMuted} fontSize={AXIS_TITLE} fontFamily={MONO}>
          {title}
        </text>
      ) : null}
    </g>
  );
}

/**
 * Time axis whose interval adapts to the span and the available width: d3
 * chooses days, weeks, months, or years and formats each tick to match. One
 * tick roughly every `targetPx` pixels keeps labels from ever colliding.
 */
export function TimeAxisBottom({
  scale,
  y,
  title,
  targetPx = 96,
  titleGap = 42,
}: {
  scale: ScaleTime<number, number>;
  y: number;
  title?: string;
  targetPx?: number;
  titleGap?: number;
}) {
  const [x0, x1] = scale.range();
  const count = Math.max(2, Math.round((x1 - x0) / targetPx));
  const values = scale.ticks(count);
  const fmt = scale.tickFormat(count);
  return (
    <g>
      <line x1={x0} x2={x1} y1={y} y2={y} stroke={axisLine} />
      {values.map((value) => (
        <g key={+value}>
          <line x1={scale(value)} x2={scale(value)} y1={y} y2={y + TICK} stroke={axisLine} />
          <text x={scale(value)} y={y + TICK + 13} textAnchor="middle" fill={axisMuted} fontSize={TICK_LABEL} fontFamily={MONO}>
            {fmt(value)}
          </text>
        </g>
      ))}
      {title ? (
        <text x={(x0 + x1) / 2} y={y + titleGap} textAnchor="middle" fill={axisMuted} fontSize={AXIS_TITLE} fontFamily={MONO}>
          {title}
        </text>
      ) : null}
    </g>
  );
}

/** Evenly spaced band centers for categorical axes. */
export function bandCenters(count: number, x0: number, x1: number): { centers: number[]; step: number } {
  const step = (x1 - x0) / Math.max(count, 1);
  const centers = Array.from({ length: count }, (_, index) => x0 + step * (index + 0.5));
  return { centers, step };
}

/**
 * Signed diverging color with the brand orientation: violet encodes positive,
 * teal encodes negative. The palette token order is violet -> ... -> teal, so a
 * positive value maps to the low (violet) end. Palette values are never mutated.
 */
export function divergentSignedColor(value: number, maxAbs: number): string {
  const stops = sterlingDivergentColors.length - 1;
  const t = Math.max(0, Math.min(1, (value + maxAbs) / (2 * maxAbs))); // 0 = most negative, 1 = most positive
  return sterlingDivergentColors[Math.round((1 - t) * stops)];
}

/** Legend ramp for signed diverging scales, left (negative/teal) to right (positive/violet). */
export const divergentSignedRamp: readonly string[] = [...sterlingDivergentColors].reverse();

/** Tukey five-number summary with 1.5*IQR fences and the outliers beyond them. */
export function tukeySummary(values: number[]) {
  const sorted = [...values].sort((left, right) => left - right);
  const q = (p: number) => {
    if (sorted.length === 0) return 0;
    const position = (sorted.length - 1) * p;
    const lower = Math.floor(position);
    const upper = Math.ceil(position);
    if (lower === upper) return sorted[lower];
    return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
  };
  const q1 = q(0.25);
  const median = q(0.5);
  const q3 = q(0.75);
  const iqr = q3 - q1;
  const lowerFence = q1 - 1.5 * iqr;
  const upperFence = q3 + 1.5 * iqr;
  const inside = sorted.filter((value) => value >= lowerFence && value <= upperFence);
  const whiskerLow = inside.length ? inside[0] : q1;
  const whiskerHigh = inside.length ? inside[inside.length - 1] : q3;
  const outliers = sorted.filter((value) => value < lowerFence || value > upperFence);
  return { q1, median, q3, iqr, whiskerLow, whiskerHigh, outliers, min: sorted[0], max: sorted[sorted.length - 1] };
}
