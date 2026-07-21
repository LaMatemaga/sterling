/**
 * Shared optical weights for Sterling primitives. Values are intentionally
 * modest: data marks lead, while axes and construction lines recede.
 */
export const sterlingVisualStyle = {
  stroke: {
    grid: 1,
    detail: 1.5,
    candle: 1.75,
    mark: 2,
    series: 2.25,
    emphasis: 2.5,
    interval: 7,
    halo: 3,
    ring: 44,
    flowMinimum: 1,
  },
  opacity: {
    ghost: 0.04,
    contour: 0.08,
    surface: 0.1,
    area: 0.24,
    ridge: 0.34,
    interval: 0.28,
    relationship: 0.42,
    secondaryMark: 0.66,
    guide: 0.7,
    signal: 0.84,
    mutedMark: 0.34,
  },
} as const;
