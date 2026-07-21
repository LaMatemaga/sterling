import type { ElementType } from "react";
import { SterlingFigure, type SterlingFigureProps } from "./SterlingFigure";
import { SterlingInlineLegend } from "./SterlingLegend";
import {
  SterlingBarChart,
  SterlingBoxPlot,
  SterlingChordChart,
  SterlingCorrelogram,
  SterlingDensityChart,
  SterlingDonutChart,
  SterlingDumbbellChart,
  SterlingHeatmap,
  SterlingHistogram,
  SterlingLineChart,
  SterlingLollipopChart,
  SterlingPieChart,
  SterlingSankeyChart,
  SterlingScatterPlot,
  SterlingSequentialSurface,
  SterlingViolinPlot,
} from "./charts";
import {
  SterlingCandlestickChart,
  SterlingDensity2DChart,
  SterlingDendrogramChart,
  SterlingExpressionChart,
  SterlingGeoMapChart,
  SterlingManhattanChart,
  SterlingNetworkChart,
  SterlingRadarChart,
  SterlingRidgelineChart,
  SterlingTreemapChart,
  SterlingVerticalBarChart,
  SterlingVolcanoChart,
} from "./canonicalCharts";
import type { SterlingLocale } from "./types";

type FigureDefaults = Partial<
  Pick<SterlingFigureProps, "palette" | "signature" | "sourceLabel" | "titleMarkHref" | "editorial">
>;

export interface CreateSterlingMdxComponentsOptions {
  locale?: SterlingLocale;
  figureDefaults?: FigureDefaults;
  /** Register project-specific figures without modifying Sterling itself. */
  additionalComponents?: Record<string, ElementType>;
}

/**
 * Build a portable MDX component registry. A consuming site supplies locale,
 * optional figure defaults, and its own dataset-backed figure components once.
 */
export function createSterlingMdxComponents({
  locale = "en",
  figureDefaults,
  additionalComponents,
}: CreateSterlingMdxComponentsOptions = {}) {
  return {
    SterlingFigure: (props: Omit<SterlingFigureProps, "locale">) => (
      <SterlingFigure {...figureDefaults} {...props} locale={locale} />
    ),
    SterlingInlineLegend,
    SterlingBarChart,
    SterlingVerticalBarChart,
    SterlingCandlestickChart,
    SterlingScatterPlot,
    SterlingLineChart,
    SterlingHeatmap,
    SterlingHistogram,
    SterlingBoxPlot,
    SterlingChordChart,
    SterlingDumbbellChart,
    SterlingDensityChart,
    SterlingDensity2DChart,
    SterlingDendrogramChart,
    SterlingViolinPlot,
    SterlingDonutChart,
    SterlingLollipopChart,
    SterlingPieChart,
    SterlingSankeyChart,
    SterlingRadarChart,
    SterlingRidgelineChart,
    SterlingTreemapChart,
    SterlingNetworkChart,
    SterlingVolcanoChart,
    SterlingManhattanChart,
    SterlingExpressionChart,
    SterlingGeoMapChart,
    SterlingSequentialSurface,
    SterlingCorrelogram,
    ...additionalComponents,
  };
}
