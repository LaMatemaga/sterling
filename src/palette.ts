import type { CSSProperties } from "react";

export type SterlingMode = "light" | "dark" | "print";

export interface SterlingSurfacePalette {
  paper?: string;
  plot?: string;
  plotAlt?: string;
  text?: string;
  muted?: string;
  grid?: string;
  edge?: string;
  period?: string;
}

/**
 * Optional theme overrides for the Sterling grammar. Omitted values keep the
 * Sterling defaults. Values may be CSS variables, which lets a consuming site
 * provide its own light and dark definitions without changing the components.
 */
export interface SterlingPalette {
  surface?: SterlingSurfacePalette;
  categorical?: readonly string[];
  legend?: readonly string[];
  sequential?: readonly string[];
  divergent?: readonly string[];
  heat?: readonly string[];
  ramps?: readonly (readonly string[])[];
}

type SterlingCssVariables = CSSProperties & Record<`--sterling-${string}`, string>;

/** Identity helper that preserves literal color values in TypeScript. */
export function defineSterlingPalette<const T extends SterlingPalette>(palette: T): T {
  return palette;
}

/** Convert a palette override into the CSS variables consumed by every chart. */
export function sterlingPaletteStyle(palette?: SterlingPalette): SterlingCssVariables {
  const variables = {} as SterlingCssVariables;
  if (!palette) return variables;

  const surfaceTokens: Record<keyof SterlingSurfacePalette, string> = {
    paper: "paper",
    plot: "surface",
    plotAlt: "surface-2",
    text: "text",
    muted: "muted",
    grid: "grid",
    edge: "edge",
    period: "period",
  };

  for (const [key, value] of Object.entries(palette.surface ?? {})) {
    if (value) variables[`--sterling-${surfaceTokens[key as keyof SterlingSurfacePalette]}`] = value;
  }

  const assignSeries = (name: string, values?: readonly string[]) => {
    values?.forEach((value, index) => {
      if (value) variables[`--sterling-${name}-${index + 1}`] = value;
    });
  };

  assignSeries("cat", palette.categorical);
  assignSeries("legend", palette.legend);
  assignSeries("seq", palette.sequential);
  assignSeries("div", palette.divergent);
  assignSeries("heat", palette.heat);
  palette.ramps?.forEach((ramp, familyIndex) => {
    ramp.forEach((value, stopIndex) => {
      if (value) variables[`--sterling-ramp-${familyIndex + 1}-${stopIndex + 1}`] = value;
    });
  });

  return variables;
}

export const sterlingCategorical = {
  light: [
    "#9A79E7",
    "#25A08D",
    "#D45AC7",
    "#E4A43A",
    "#5A83D7",
    "#E87864",
    "#96AB51",
    "#536B78",
  ],
  dark: [
    "#B69AF2",
    "#5EC9AE",
    "#E88BDD",
    "#F2C46D",
    "#86A8E8",
    "#F29A88",
    "#B7C974",
    "#B7C8D1",
  ],
  print: [
    "#8E68D8",
    "#218C7C",
    "#C653BC",
    "#D39A32",
    "#4F73C6",
    "#DC6A55",
    "#879347",
    "#607986",
  ],
} as const satisfies Record<SterlingMode, readonly string[]>;

export const sterlingColorNames = [
  "Violet",
  "Teal",
  "Orchid",
  "Amber",
  "Blue",
  "Coral",
  "Moss",
  "Payne",
] as const;

/** CSS variables let one SVG respond to the site's light and dark themes. */
export const sterlingChartColors = sterlingColorNames.map(
  (_, index) => `var(--sterling-cat-${index + 1})`,
);

/** Hue-matched text colors keep inline legends readable in both themes. */
export const sterlingLegendColors = sterlingColorNames.map(
  (_, index) => `var(--sterling-legend-${index + 1})`,
);

export const sterlingDivergentColors = Array.from(
  { length: 11 },
  (_, index) => `var(--sterling-div-${index + 1})`,
);

/** A single-hue ramp for ordered magnitudes such as histogram frequency. */
export const sterlingSequentialColors = Array.from(
  { length: 10 },
  (_, index) => `var(--sterling-seq-${index + 1})`,
);

/** Multi-hue ordered ramp from the v1.5 topography field test. */
export const sterlingHeatColors = Array.from(
  { length: 11 },
  (_, index) => `var(--sterling-heat-${index + 1})`,
);

/** Stops available in every per-family sequential ramp (ramp stops 200-800). */
export const sterlingRampStops = 7;

/**
 * One sequential ramp per categorical family, mirroring `lm_ramps` in
 * `theme_lamatemaga.R`. `family` is the categorical index (0 = Violet, 1 = Teal,
 * ...) and `stop` runs 1..7 from faintest to strongest. The token order mirrors
 * per theme, so a higher stop always reads as the higher-contrast tone.
 *
 * The band runs 200-800, not the full 100-950. The 900-950 end is nearly flat in
 * luminance (Δ 0.014) so those tones stop reading as separate steps and turn
 * light mode heavy; the 100 end is a near-white tint that all but disappears
 * against the chart surface (contrast 1.11).
 */
export function sterlingRamp(family: number, stop: number): string {
  const familyIndex = ((family % sterlingColorNames.length) + sterlingColorNames.length) % sterlingColorNames.length;
  const clamped = Math.max(1, Math.min(sterlingRampStops, Math.round(stop)));
  return `var(--sterling-ramp-${familyIndex + 1}-${clamped})`;
}
