import { defineSterlingPalette, type SterlingPalette, type SterlingSurfacePalette } from "./palette";

export type TailwindStep = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950;
export type TailwindScale = Partial<Record<TailwindStep, string>>;

export interface TailwindSterlingPaletteOptions {
  /** Eight or fewer Tailwind color scales. Their 500 stops become categories. */
  categorical: readonly TailwindScale[];
  /** Use your own surfaces so text and grid contrast remain intentional. */
  surface: SterlingSurfacePalette;
  divergent?: TailwindScale;
  heat?: TailwindScale;
}

const orderedStops: TailwindStep[] = [100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const rampStops: TailwindStep[] = [200, 300, 400, 500, 600, 700, 800];

function at(scale: TailwindScale, stop: TailwindStep, fallback: string) {
  return scale[stop] ?? fallback;
}

/**
 * Convert Tailwind-like 100–950 scales into Sterling's palette contract
 * without making Tailwind a runtime dependency.
 */
export function createTailwindSterlingPalette({
  categorical,
  surface,
  divergent,
  heat,
}: TailwindSterlingPaletteOptions): SterlingPalette {
  const first = categorical[0] ?? {};
  const categoricalValues = categorical.map((scale) => at(scale, 500, "currentColor"));

  return defineSterlingPalette({
    surface,
    categorical: categoricalValues,
    legend: categorical.map((scale) => at(scale, 700, at(scale, 500, "currentColor"))),
    sequential: orderedStops.map((stop) => at(first, stop, at(first, 500, "currentColor"))),
    divergent: orderedStops.map((stop) => at(divergent ?? first, stop, at(first, 500, "currentColor"))),
    heat: orderedStops.concat(950).map((stop) => at(heat ?? first, stop, at(first, 500, "currentColor"))).slice(0, 11),
    ramps: categorical.map((scale) => rampStops.map((stop) => at(scale, stop, at(scale, 500, "currentColor")))),
  });
}
