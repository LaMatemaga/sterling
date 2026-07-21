import { chord as d3Chord, ribbon as d3Ribbon } from "d3-chord";
import type { Chord, ChordGroup, ChordSubgroup } from "d3-chord";
import { sankey as d3Sankey, sankeyLinkHorizontal } from "d3-sankey";
import { arc as d3Arc } from "d3-shape";
import { sterlingChartColors, sterlingHeatColors, sterlingSequentialColors } from "./palette";
import {
  AxisBottom,
  AxisLeft,
  Gridlines,
  TimeAxisBottom,
  bandCenters,
  divergentSignedColor,
  divergentSignedRamp,
  frame,
  linearScale,
  timeScale,
  tukeySummary,
} from "./plot";
import { sterlingVisualStyle } from "./visualStyle";

const chartText = "var(--sterling-text)";
const chartMuted = "var(--sterling-muted)";
const chartGrid = "var(--sterling-grid)";

export interface BarDatum {
  label: string;
  value: number;
  colorIndex?: number;
}

export function SterlingBarChart({
  data,
  ariaLabel,
  unit = "",
  xLabel,
}: {
  data: BarDatum[];
  ariaLabel: string;
  unit?: string;
  xLabel?: string;
}) {
  const rowHeight = 46;
  const top = 12;
  const barHeight = 28;
  const axisBottom = xLabel ? 50 : 34;
  const x0 = 150;
  const x1 = 684;
  const height = top + data.length * rowHeight + axisBottom;
  const baseline = top + data.length * rowHeight;
  const x = linearScale(data.map((datum) => datum.value), [x0, x1], { zero: true });

  return (
    <svg className="sterling-chart" viewBox={`0 0 720 ${height}`} role="img" aria-label={ariaLabel}>
      {x.ticks(6).map((value) => (
        <line key={value} x1={x(value)} x2={x(value)} y1={top} y2={baseline} stroke={chartGrid} strokeWidth={sterlingVisualStyle.stroke.grid} />
      ))}
      {data.map((datum, index) => {
        const y = top + index * rowHeight + (rowHeight - barHeight) / 2 - 6;
        const width = x(datum.value) - x0;
        return (
          <g key={datum.label}>
            <text x={x0 - 12} y={y + barHeight / 2 + 4} textAnchor="end" fill={chartText} fontSize="12" fontFamily="var(--font-mono)">
              {datum.label}
            </text>
            <rect
              x={x0}
              y={y}
              width={Math.max(width, 2)}
              height={barHeight}
              rx="3"
              fill={sterlingChartColors[datum.colorIndex ?? index % sterlingChartColors.length]}
            >
              <title>{`${datum.label}: ${datum.value}${unit}`}</title>
            </rect>
            <text x={x(datum.value) + 8} y={y + barHeight / 2 + 4} fill={chartMuted} fontSize="12" fontFamily="var(--font-mono)">
              {datum.value}{unit}
            </text>
          </g>
        );
      })}
      <AxisBottom scale={x} y={baseline} count={6} title={xLabel} format={(value) => `${value}${unit}`} />
    </svg>
  );
}

export interface ScatterDatum {
  x: number;
  y: number;
  group: string;
  label?: string;
}

function scatterMark(shape: number, x: number, y: number, color: string, key: string, title: string) {
  if (shape % 3 === 1) {
    return (
      <rect key={key} x={x - 4.5} y={y - 4.5} width="9" height="9" rx="1" fill={color}>
        <title>{title}</title>
      </rect>
    );
  }
  if (shape % 3 === 2) {
    return (
      <path key={key} d={`M ${x} ${y - 5.5} L ${x + 5.2} ${y + 4.5} L ${x - 5.2} ${y + 4.5} Z`} fill={color}>
        <title>{title}</title>
      </path>
    );
  }
  return (
    <circle key={key} cx={x} cy={y} r="4.8" fill={color}>
      <title>{title}</title>
    </circle>
  );
}

export function SterlingScatterPlot({
  data,
  ariaLabel,
  xLabel,
  yLabel,
  showLegend = false,
  zeroX = false,
  zeroY = false,
}: {
  data: ScatterDatum[];
  ariaLabel: string;
  xLabel: string;
  yLabel: string;
  showLegend?: boolean;
  zeroX?: boolean;
  zeroY?: boolean;
}) {
  const groups = [...new Set(data.map((datum) => datum.group))];
  const f = frame(720, 380);
  const x = linearScale(data.map((datum) => datum.x), [f.x0, f.x1], { zero: zeroX });
  const y = linearScale(data.map((datum) => datum.y), [f.y1, f.y0], { zero: zeroY });

  return (
    <svg className="sterling-chart" viewBox={`0 0 ${f.width} ${f.height}`} role="img" aria-label={ariaLabel}>
      <Gridlines scale={y} x0={f.x0} x1={f.x1} count={5} />
      {data.map((datum, index) => {
        const groupIndex = groups.indexOf(datum.group);
        return scatterMark(
          groupIndex,
          x(datum.x),
          y(datum.y),
          sterlingChartColors[groupIndex],
          `${datum.group}-${index}`,
          datum.label ?? `${datum.group}: ${datum.x}, ${datum.y}`,
        );
      })}
      <AxisLeft scale={y} x={f.x0} count={5} title={yLabel} />
      <AxisBottom scale={x} y={f.y1} count={6} title={xLabel} />
      {showLegend
        ? groups.map((group, index) => (
            <g key={group} transform={`translate(${f.x1 - 150 + (index % 2) * 92} ${f.y0 + 2 + Math.floor(index / 2) * 20})`}>
              {scatterMark(index, 0, 0, sterlingChartColors[index], `legend-${group}`, group)}
              <text x="11" y="4" fill={chartMuted} fontSize="10.5" fontFamily="var(--font-mono)">{group}</text>
            </g>
          ))
        : null}
    </svg>
  );
}

export interface LineSeries {
  label: string;
  values: number[];
}

export function SterlingLineChart({
  labels,
  series,
  ariaLabel,
  yLabel,
  xLabel,
  times,
  markers,
  showLegend = false,
}: {
  labels: string[];
  series: LineSeries[];
  ariaLabel: string;
  yLabel: string;
  xLabel?: string;
  /** Epoch-ms per point (parallel to labels); enables the adaptive time axis. */
  times?: number[];
  /** Draw a dot at every point. Off by default for dense time series. */
  markers?: boolean;
  showLegend?: boolean;
}) {
  const f = frame(720, 380);
  const values = series.flatMap((item) => item.values);
  const y = linearScale(values, [f.y1, f.y0], { zero: true });
  const isTime = Array.isArray(times) && times.length === labels.length && labels.length > 1;
  const time = isTime ? timeScale([times![0], times![times!.length - 1]], [f.x0, f.x1]) : null;
  const xAt = (index: number) =>
    time ? time(new Date(times![index])) : f.x0 + (index / Math.max(labels.length - 1, 1)) * (f.x1 - f.x0);
  const showMarkers = markers ?? labels.length <= 40;

  // Fallback categorical ticks (only when no time scale) with collision guard.
  const labelStep = Math.max(1, Math.ceil(labels.length / 8));
  const lastIndex = labels.length - 1;
  const showCatTick = (index: number) => {
    if (index === lastIndex) return true;
    if (index % labelStep !== 0) return false;
    return lastIndex - index >= labelStep * 0.55;
  };

  return (
    <svg className="sterling-chart" viewBox={`0 0 ${f.width} ${f.height}`} role="img" aria-label={ariaLabel}>
      <Gridlines scale={y} x0={f.x0} x1={f.x1} count={5} />
      {series.map((item, seriesIndex) => {
        const path = item.values.map((value, index) => `${index === 0 ? "M" : "L"} ${xAt(index)} ${y(value)}`).join(" ");
        return (
          <g key={item.label}>
            <path d={path} fill="none" stroke={sterlingChartColors[seriesIndex]} strokeWidth={sterlingVisualStyle.stroke.series} strokeLinecap="round" strokeLinejoin="round" />
            {showMarkers
              ? item.values.map((value, index) => (
                  <circle key={index} cx={xAt(index)} cy={y(value)} r="3.4" fill={sterlingChartColors[seriesIndex]}>
                    <title>{`${item.label}, ${labels[index]}: ${value}`}</title>
                  </circle>
                ))
              : null}
          </g>
        );
      })}
      <AxisLeft scale={y} x={f.x0} count={5} title={yLabel} />
      {time ? (
        <TimeAxisBottom scale={time} y={f.y1} title={xLabel} />
      ) : (
        <g>
          <line x1={f.x0} x2={f.x1} y1={f.y1} y2={f.y1} stroke="var(--sterling-edge)" />
          {labels.map((label, index) =>
            showCatTick(index) ? (
              <g key={`${label}-${index}`}>
                <line x1={xAt(index)} x2={xAt(index)} y1={f.y1} y2={f.y1 + 5} stroke="var(--sterling-edge)" />
                <text x={xAt(index)} y={f.y1 + 18} textAnchor="middle" fill={chartMuted} fontSize="11" fontFamily="var(--font-mono)">
                  {label}
                </text>
              </g>
            ) : null,
          )}
          {xLabel ? (
            <text x={(f.x0 + f.x1) / 2} y={f.y1 + 42} textAnchor="middle" fill={chartMuted} fontSize="12" fontFamily="var(--font-mono)">
              {xLabel}
            </text>
          ) : null}
        </g>
      )}
      {showLegend
        ? series.map((item, index) => (
            <g key={item.label} transform={`translate(${f.x0 + 28 + index * 176} ${f.y0 - 2})`}>
              <line x1="0" x2="22" stroke={sterlingChartColors[index]} strokeWidth={sterlingVisualStyle.stroke.series} />
              <text x="30" y="4" fill={chartMuted} fontSize="11" fontFamily="var(--font-mono)">{item.label}</text>
            </g>
          ))
        : null}
    </svg>
  );
}

export function SterlingHeatmap({
  values,
  rowLabels,
  columnLabels,
  ariaLabel,
  domain,
  legendTitle,
  showValues = false,
}: {
  values: number[][];
  rowLabels: string[];
  columnLabels: string[];
  ariaLabel: string;
  /** Symmetric color domain [-domain, +domain]; defaults to the data's max |value|. */
  domain?: number;
  legendTitle?: string;
  showValues?: boolean;
}) {
  const flat = values.flat();
  const maxAbs = domain ?? Math.max(1, Math.ceil(Math.max(...flat.map((value) => Math.abs(value))) * 10) / 10);
  // Landscape layout: wide, short cells so every row and the legend stay in view.
  const width = 720;
  const startX = 168;
  const startY = 46;
  const rightPad = 24;
  const gridWidth = width - startX - rightPad;
  const cellW = gridWidth / Math.max(columnLabels.length, 1);
  const cellH = Math.min(cellW * 0.5, 46);
  const gap = 3;
  const gridHeight = cellH * rowLabels.length;
  const height = startY + gridHeight + 60;
  const legendWidth = Math.min(gridWidth, 340);

  return (
    <svg className="sterling-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={ariaLabel}>
      {columnLabels.map((label, index) => (
        <text key={label} x={startX + index * cellW + cellW / 2} y={startY - 12} textAnchor="middle" fill={chartText} fontSize="11" fontFamily="var(--font-mono)">
          {label}
        </text>
      ))}
      {rowLabels.map((label, row) => (
        <g key={label}>
          <text x={startX - 12} y={startY + row * cellH + cellH / 2 + 4} textAnchor="end" fill={chartText} fontSize="11" fontFamily="var(--font-mono)">
            {label}
          </text>
          {columnLabels.map((column, columnIndex) => {
            const value = values[row]?.[columnIndex] ?? 0;
            return (
              <g key={column}>
                <rect
                  x={startX + columnIndex * cellW}
                  y={startY + row * cellH}
                  width={cellW - gap}
                  height={cellH - gap}
                  rx="3"
                  fill={divergentSignedColor(value, maxAbs)}
                >
                  <title>{`${label}, ${column}: ${value.toFixed(2)}`}</title>
                </rect>
                {showValues ? (
                  <text
                    x={startX + columnIndex * cellW + (cellW - gap) / 2}
                    y={startY + row * cellH + (cellH - gap) / 2 + 4}
                    textAnchor="middle"
                    fill={Math.abs(value) > maxAbs * 0.55 ? "var(--sterling-surface)" : chartText}
                    fontSize="10.5"
                    fontFamily="var(--font-mono)"
                  >
                    {value.toFixed(1)}
                  </text>
                ) : null}
              </g>
            );
          })}
        </g>
      ))}
      {/* Honest legend: teal (negative) -> violet (positive), real data range. */}
      {legendTitle ? (
        <text x={startX} y={height - 38} fill={chartMuted} fontSize="10.5" fontFamily="var(--font-mono)">{legendTitle}</text>
      ) : null}
      {divergentSignedRamp.map((color, index) => (
        <rect key={`${color}-${index}`} x={startX + (index * legendWidth) / divergentSignedRamp.length} y={height - 28} width={legendWidth / divergentSignedRamp.length + 0.5} height="13" fill={color} />
      ))}
      <text x={startX} y={height - 5} fill={chartMuted} fontSize="10" fontFamily="var(--font-mono)">{-maxAbs}</text>
      <text x={startX + legendWidth / 2} y={height - 5} textAnchor="middle" fill={chartMuted} fontSize="10" fontFamily="var(--font-mono)">0</text>
      <text x={startX + legendWidth} y={height - 5} textAnchor="end" fill={chartMuted} fontSize="10" fontFamily="var(--font-mono)">{`+${maxAbs}`}</text>
    </svg>
  );
}

export function SterlingSequentialSurface({
  values: suppliedValues,
  ariaLabel,
  lowLabel = "low / bajo",
  highLabel = "high / alto",
}: {
  values?: number[][];
  ariaLabel: string;
  lowLabel?: string;
  highLabel?: string;
}) {
  const defaultRows = 10;
  const defaultColumns = 18;
  const generatedValues = Array.from({ length: defaultRows }, (_, row) => Array.from({ length: defaultColumns }, (_, column) => {
    const x = column / (defaultColumns - 1);
    const y = row / (defaultRows - 1);
    const firstPeak = Math.exp(-(((x - 0.3) / 0.19) ** 2 + ((y - 0.34) / 0.25) ** 2));
    const secondPeak = 0.76 * Math.exp(-(((x - 0.72) / 0.23) ** 2 + ((y - 0.67) / 0.2) ** 2));
    const saddle = 0.22 * Math.sin(x * Math.PI * 2.4) * Math.cos(y * Math.PI * 1.7);
    return firstPeak + secondPeak + saddle;
  }));
  const values = suppliedValues?.length && suppliedValues.some((row) => row.length)
    ? suppliedValues
    : generatedValues;
  const rows = values.length;
  const columns = Math.max(1, ...values.map((row) => row.length));
  const flat = values.flat();
  const min = Math.min(...flat);
  const max = Math.max(...flat);
  const cellWidth = 558 / columns;
  const cellHeight = 240 / Math.max(rows, 1);
  return (
    <svg className="sterling-chart" viewBox="0 0 720 340" role="img" aria-label={ariaLabel}>
      <g transform="translate(82 34)">
        {values.flatMap((rowValues, row) => rowValues.map((value, column) => {
          const index = Math.max(0, Math.min(sterlingHeatColors.length - 1, Math.round(((value - min) / Math.max(max - min, 1)) * (sterlingHeatColors.length - 1))));
          return <rect key={`${row}-${column}`} x={column * cellWidth} y={row * cellHeight} width={cellWidth + 0.35} height={cellHeight + 0.35} fill={sterlingHeatColors[index]}>
            <title>{`x ${column + 1}, y ${row + 1}: ${value.toFixed(2)}`}</title>
          </rect>;
        }))}
      </g>
      <text x="82" y="302" fill={chartMuted} fontSize="10" fontFamily="var(--font-mono)">{lowLabel}</text>
      {sterlingHeatColors.map((color, index) => <rect key={color} x={152 + index * 34} y="289" width="34" height="15" fill={color} />)}
      <text x="540" y="302" fill={chartMuted} fontSize="10" fontFamily="var(--font-mono)">{highLabel}</text>
    </svg>
  );
}

export function SterlingCorrelogram({
  values,
  labels,
  ariaLabel,
}: {
  values: number[][];
  labels: string[];
  ariaLabel: string;
}) {
  const cell = 67;
  const startX = 112;
  const startY = 34;
  const size = labels.length * cell;

  return (
    <svg className="sterling-chart" viewBox={`0 0 ${startX + size + 54} ${startY + size + 72}`} role="img" aria-label={ariaLabel}>
      {labels.flatMap((rowLabel, row) => labels.map((columnLabel, column) => {
        const value = values[row]?.[column] ?? 0;
        const color = divergentSignedColor(value, 1);
        const centerX = startX + column * cell + cell / 2;
        const centerY = startY + row * cell + cell / 2;
        return (
          <g key={`${rowLabel}-${columnLabel}`}>
            <rect x={startX + column * cell} y={startY + row * cell} width={cell} height={cell} fill="none" stroke={chartGrid} />
            {row === column ? (
              <text x={centerX} y={centerY + 4} textAnchor="middle" fill={chartText} fontSize="10.5" fontFamily="var(--font-mono)">{rowLabel}</text>
            ) : row > column ? (
              <ellipse
                cx={centerX}
                cy={centerY}
                rx="25"
                ry={Math.max(2.5, 25 * (1 - Math.abs(value)))}
                transform={`rotate(${value >= 0 ? -45 : 45} ${centerX} ${centerY})`}
                fill={color}
                fillOpacity={sterlingVisualStyle.opacity.secondaryMark}
                stroke={color}
              >
                <title>{`${rowLabel}, ${columnLabel}: ${value.toFixed(2)}`}</title>
              </ellipse>
            ) : (
              <text x={centerX} y={centerY + 5} textAnchor="middle" fill={Math.abs(value) >= 0.3 ? color : chartMuted} fontSize="15" fontFamily="var(--font-mono)" fontWeight="700">
                {value.toFixed(2)}
              </text>
            )}
          </g>
        );
      }))}
      <text x={startX} y={startY + size + 41} fill={chartMuted} fontSize="10" fontFamily="var(--font-mono)">-1</text>
      {divergentSignedRamp.map((color, index) => (
        <rect key={`${color}-${index}`} x={startX + 28 + index * 27} y={startY + size + 27} width="27" height="16" fill={color} />
      ))}
      <text x={startX + 340} y={startY + size + 41} fill={chartMuted} fontSize="10" fontFamily="var(--font-mono)">+1</text>
    </svg>
  );
}

export function SterlingHistogram({
  values,
  bins = 16,
  ariaLabel,
  xLabel,
  yLabel,
}: {
  values: number[];
  bins?: number;
  ariaLabel: string;
  xLabel: string;
  yLabel?: string;
}) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const step = Math.max((max - min) / bins, Number.EPSILON);
  const counts = Array.from({ length: bins }, () => 0);
  values.forEach((value) => {
    counts[Math.min(bins - 1, Math.floor((value - min) / step))] += 1;
  });
  const top = Math.max(...counts, 1);
  const f = frame(720, 380);
  const x = linearScale([min, max], [f.x0, f.x1]);
  const y = linearScale([0, top], [f.y1, f.y0], { zero: true });
  const barWidth = (x(min + step) - x(min));

  return (
    <svg className="sterling-chart" viewBox={`0 0 ${f.width} ${f.height}`} role="img" aria-label={ariaLabel}>
      <Gridlines scale={y} x0={f.x0} x1={f.x1} count={5} />
      {counts.map((count, index) => {
        const lower = min + index * step;
        const upper = lower + step;
        return (
          <rect
            key={index}
            x={x(lower) + 1}
            y={y(count)}
            width={Math.max(barWidth - 2, 1)}
            height={f.y1 - y(count)}
            fill={sterlingChartColors[0]}
          >
            <title>{`${lower.toFixed(1)}-${upper.toFixed(1)}: ${count}`}</title>
          </rect>
        );
      })}
      <AxisLeft scale={y} x={f.x0} count={5} title={yLabel} format={(value) => `${Math.round(value)}`} />
      <AxisBottom scale={x} y={f.y1} count={7} title={xLabel} />
    </svg>
  );
}

export interface BoxPlotGroup {
  label: string;
  values: number[];
}

export function SterlingBoxPlot({ groups, ariaLabel, yLabel }: { groups: BoxPlotGroup[]; ariaLabel: string; yLabel: string }) {
  const all = groups.flatMap((group) => group.values);
  const top = 24;
  const rowH = 80;
  const axisBottom = 48;
  const height = top + groups.length * rowH + axisBottom;
  const baseline = top + groups.length * rowH + 6;
  const x0 = 168;
  const x1 = 690;
  const x = linearScale(all, [x0, x1]);
  const boxHalf = 24;

  return (
    <svg className="sterling-chart" viewBox={`0 0 720 ${height}`} role="img" aria-label={ariaLabel}>
      {x.ticks(6).map((value) => (
        <line key={value} x1={x(value)} x2={x(value)} y1={top} y2={baseline} stroke={chartGrid} strokeWidth={sterlingVisualStyle.stroke.grid} />
      ))}
      {groups.map((group, index) => {
        const summary = tukeySummary(group.values);
        const center = top + index * rowH + rowH / 2 - 4;
        const color = sterlingChartColors[index];
        return (
          <g key={group.label}>
            <text x={x0 - 12} y={center + 4} textAnchor="end" fill={chartText} fontSize="12" fontFamily="var(--font-mono)">{group.label}</text>
            {/* Whiskers to the 1.5*IQR fences */}
            <line x1={x(summary.whiskerLow)} x2={x(summary.q1)} y1={center} y2={center} stroke={color} strokeWidth={sterlingVisualStyle.stroke.mark} />
            <line x1={x(summary.q3)} x2={x(summary.whiskerHigh)} y1={center} y2={center} stroke={color} strokeWidth={sterlingVisualStyle.stroke.mark} />
            <line x1={x(summary.whiskerLow)} x2={x(summary.whiskerLow)} y1={center - 12} y2={center + 12} stroke={color} strokeWidth={sterlingVisualStyle.stroke.mark} />
            <line x1={x(summary.whiskerHigh)} x2={x(summary.whiskerHigh)} y1={center - 12} y2={center + 12} stroke={color} strokeWidth={sterlingVisualStyle.stroke.mark} />
            <rect x={x(summary.q1)} y={center - boxHalf} width={Math.max(x(summary.q3) - x(summary.q1), 2)} height={boxHalf * 2} rx="3" fill={color} fillOpacity={sterlingVisualStyle.opacity.interval} stroke={color} strokeWidth={sterlingVisualStyle.stroke.mark}>
              <title>{`${group.label}: n=${group.values.length}, median ${summary.median.toFixed(2)}, IQR ${summary.q1.toFixed(2)}-${summary.q3.toFixed(2)}`}</title>
            </rect>
            <line x1={x(summary.median)} x2={x(summary.median)} y1={center - boxHalf} y2={center + boxHalf} stroke={color} strokeWidth={sterlingVisualStyle.stroke.emphasis} />
            {/* Tukey outliers beyond the fences */}
            {summary.outliers.map((value, outlierIndex) => (
              <circle key={outlierIndex} cx={x(value)} cy={center} r="3.4" fill="none" stroke={color} strokeWidth={sterlingVisualStyle.stroke.detail}>
                <title>{`${group.label} outlier: ${value.toFixed(2)}`}</title>
              </circle>
            ))}
          </g>
        );
      })}
      <AxisBottom scale={x} y={baseline} count={6} title={yLabel} />
    </svg>
  );
}

export interface DumbbellDatum {
  label: string;
  left: number;
  right: number;
}

export function SterlingDumbbellChart({
  data,
  ariaLabel,
  leftLabel,
  rightLabel,
  xLabel,
}: {
  data: DumbbellDatum[];
  ariaLabel: string;
  leftLabel: string;
  rightLabel: string;
  xLabel?: string;
}) {
  const top = 56;
  const rowH = 66;
  const axisBottom = xLabel ? 50 : 34;
  const x0 = 150;
  const x1 = 660;
  const height = top + data.length * rowH + axisBottom;
  const baseline = top + data.length * rowH;
  const x = linearScale(data.flatMap((datum) => [datum.left, datum.right]), [x0, x1], { zero: true });
  return (
    <svg className="sterling-chart" viewBox={`0 0 720 ${height}`} role="img" aria-label={ariaLabel}>
      {x.ticks(6).map((value) => (
        <line key={value} x1={x(value)} x2={x(value)} y1={top - 20} y2={baseline} stroke={chartGrid} strokeWidth={sterlingVisualStyle.stroke.grid} />
      ))}
      {data.map((datum, index) => {
        const y = top + index * rowH + rowH / 2 - 4;
        return (
          <g key={datum.label}>
            <text x={x0 - 14} y={y + 4} textAnchor="end" fill={chartText} fontSize="12" fontFamily="var(--font-mono)">{datum.label}</text>
            <line x1={x(datum.left)} x2={x(datum.right)} y1={y} y2={y} stroke={chartGrid} strokeWidth={sterlingVisualStyle.stroke.series} strokeLinecap="round" />
            <circle cx={x(datum.left)} cy={y} r="8" fill={sterlingChartColors[0]}><title>{`${datum.label}, ${leftLabel}: ${datum.left.toFixed(2)}`}</title></circle>
            <circle cx={x(datum.right)} cy={y} r="8" fill={sterlingChartColors[3]}><title>{`${datum.label}, ${rightLabel}: ${datum.right.toFixed(2)}`}</title></circle>
          </g>
        );
      })}
      <AxisBottom scale={x} y={baseline} count={6} title={xLabel} />
    </svg>
  );
}

export function kernelDensity(values: number[], steps = 64, domain?: [number, number]) {
  const min = domain?.[0] ?? Math.min(...values);
  const max = domain?.[1] ?? Math.max(...values);
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const spread = Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / Math.max(values.length - 1, 1));
  const bandwidth = Math.max(1.06 * spread * values.length ** -0.2, (max - min) / 100, 0.001);
  return Array.from({ length: steps }, (_, index) => {
    const value = min + (index / (steps - 1)) * (max - min);
    const density = values.reduce((sum, observation) => {
      const z = (value - observation) / bandwidth;
      return sum + Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);
    }, 0) / (values.length * bandwidth);
    return { value, density };
  });
}

export function SterlingDensityChart({ values, ariaLabel, xLabel, yLabel }: { values: number[]; ariaLabel: string; xLabel: string; yLabel?: string }) {
  const density = kernelDensity(values);
  const maxDensity = Math.max(...density.map((point) => point.density), Number.EPSILON);
  const f = frame(720, 380);
  const x = linearScale([density[0].value, density[density.length - 1].value], [f.x0, f.x1], { padFraction: 0 });
  const y = linearScale([0, maxDensity], [f.y1, f.y0], { zero: true });
  const line = density.map((point, index) => `${index === 0 ? "M" : "L"} ${x(point.value)} ${y(point.density)}`).join(" ");
  const area = `${line} L ${x(density[density.length - 1].value)} ${f.y1} L ${x(density[0].value)} ${f.y1} Z`;
  return (
    <svg className="sterling-chart" viewBox={`0 0 ${f.width} ${f.height}`} role="img" aria-label={ariaLabel}>
      <Gridlines scale={y} x0={f.x0} x1={f.x1} count={5} />
      <path d={area} fill={sterlingSequentialColors[4]} fillOpacity={sterlingVisualStyle.opacity.area} />
      <path d={line} fill="none" stroke={sterlingSequentialColors[7]} strokeWidth={sterlingVisualStyle.stroke.series} strokeLinecap="round" strokeLinejoin="round" />
      <AxisLeft scale={y} x={f.x0} count={5} title={yLabel} />
      <AxisBottom scale={x} y={f.y1} count={7} title={xLabel} />
    </svg>
  );
}

export interface ViolinGroup {
  label: string;
  values: number[];
}

export function SterlingViolinPlot({ groups, ariaLabel, yLabel }: { groups: ViolinGroup[]; ariaLabel: string; yLabel: string }) {
  const all = groups.flatMap((group) => group.values);
  const observedMin = Math.min(...all);
  const observedMax = Math.max(...all);
  // Extend the estimation domain by ~3 kernel bandwidths past the data so each
  // silhouette tapers to zero instead of being sliced off at the extremes.
  const bandwidthOf = (values: number[]) => {
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    const spread = Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / Math.max(values.length - 1, 1));
    return Math.max(1.06 * spread * values.length ** -0.2, 1e-6);
  };
  const maxBandwidth = Math.max(...groups.map((group) => bandwidthOf(group.values)));
  const margin = Math.max((observedMax - observedMin) * 0.05, maxBandwidth * 3);
  const domain: [number, number] = [observedMin - margin, observedMax + margin];
  const f = frame(720, 390, { top: 26, right: 26, bottom: 44, left: 70 });
  const y = linearScale(domain, [f.y1, f.y0], { padFraction: 0 });
  const { centers } = bandCenters(groups.length, f.x0, f.x1);
  const halfWidth = Math.min(46, ((f.x1 - f.x0) / groups.length) * 0.42);
  return (
    <svg className="sterling-chart" viewBox={`0 0 ${f.width} ${f.height}`} role="img" aria-label={ariaLabel}>
      <Gridlines scale={y} x0={f.x0} x1={f.x1} count={5} />
      {groups.map((group, groupIndex) => {
        const estimate = kernelDensity(group.values, 96, domain);
        const peak = Math.max(...estimate.map((point) => point.density), Number.EPSILON);
        // Stop the outline once the tail is effectively zero-width, otherwise
        // the two sides converge into a long vertical needle.
        const cutoff = peak * 0.01;
        const firstIndex = estimate.findIndex((point) => point.density >= cutoff);
        const lastIndex = estimate.length - 1 - [...estimate].reverse().findIndex((point) => point.density >= cutoff);
        const density = estimate.slice(Math.max(0, firstIndex - 1), Math.min(estimate.length - 1, lastIndex + 1) + 1);
        const center = centers[groupIndex];
        const right = density.map((point) => `${center + (point.density / peak) * halfWidth} ${y(point.value)}`);
        const left = [...density].reverse().map((point) => `${center - (point.density / peak) * halfWidth} ${y(point.value)}`);
        const path = `M ${right.join(" L ")} L ${left.join(" L ")} Z`;
        // Same Tukey summary the box plot uses, drawn inside the silhouette.
        const summary = tukeySummary(group.values);
        const color = sterlingChartColors[groupIndex];
        return (
          <g key={group.label}>
            <path d={path} fill={color} fillOpacity={sterlingVisualStyle.opacity.area} stroke={color} strokeWidth={sterlingVisualStyle.stroke.series}>
              <title>{`${group.label}: n=${group.values.length}, median ${summary.median.toFixed(1)}, IQR ${summary.q1.toFixed(1)}-${summary.q3.toFixed(1)}`}</title>
            </path>
            {/* Whiskers to the 1.5*IQR fences */}
            <line x1={center} x2={center} y1={y(summary.whiskerLow)} y2={y(summary.whiskerHigh)} stroke={color} strokeWidth={sterlingVisualStyle.stroke.detail} />
            <line x1={center - 5} x2={center + 5} y1={y(summary.whiskerLow)} y2={y(summary.whiskerLow)} stroke={color} strokeWidth={sterlingVisualStyle.stroke.detail} />
            <line x1={center - 5} x2={center + 5} y1={y(summary.whiskerHigh)} y2={y(summary.whiskerHigh)} stroke={color} strokeWidth={sterlingVisualStyle.stroke.detail} />
            {/* The wide band is the interquartile range, not a generic outline. */}
            <line x1={center} x2={center} y1={y(summary.q3)} y2={y(summary.q1)} stroke={color} strokeWidth={sterlingVisualStyle.stroke.interval} strokeLinecap="round" />
            <circle cx={center} cy={y(summary.median)} r="4.5" fill="var(--sterling-surface)" stroke={color} strokeWidth={sterlingVisualStyle.stroke.emphasis} />
            {/* Tukey outliers beyond the fences */}
            {summary.outliers.map((value, outlierIndex) => (
              <circle key={outlierIndex} cx={center} cy={y(value)} r="3" fill="none" stroke={color} strokeWidth={sterlingVisualStyle.stroke.detail}>
                <title>{`${group.label} outlier: ${value.toFixed(1)}`}</title>
              </circle>
            ))}
            <text x={center} y={f.y1 + 18} textAnchor="middle" fill={chartMuted} fontSize="10.5" fontFamily="var(--font-mono)">{group.label}</text>
          </g>
        );
      })}
      <AxisLeft scale={y} x={f.x0} count={5} title={yLabel} />
      <line x1={f.x0} x2={f.x1} y1={f.y1} y2={f.y1} stroke="var(--sterling-edge)" />
    </svg>
  );
}

export interface DonutDatum {
  label: string;
  value: number;
}

export function SterlingDonutChart({ data, ariaLabel, centerLabel, centerValue }: { data: DonutDatum[]; ariaLabel: string; centerLabel: string; centerValue?: string }) {
  const total = data.reduce((sum, datum) => sum + datum.value, 0);
  const radius = 96;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  return (
    <svg className="sterling-chart" viewBox="0 0 720 350" role="img" aria-label={ariaLabel}>
      <g transform="translate(360 174) rotate(-90)">
        {data.map((datum, index) => {
          const length = (datum.value / total) * circumference;
          const currentOffset = offset;
          offset += length;
          return (
            <circle
              key={datum.label}
              cx="0"
              cy="0"
              r={radius}
              fill="none"
              stroke={sterlingChartColors[index]}
              strokeWidth={sterlingVisualStyle.stroke.ring}
              strokeDasharray={`${length} ${circumference - length}`}
              strokeDashoffset={-currentOffset}
            >
              <title>{`${datum.label}: ${datum.value} (${((datum.value / total) * 100).toFixed(1)}%)`}</title>
            </circle>
          );
        })}
      </g>
      <text x="360" y="171" textAnchor="middle" fill={chartText} fontSize="30" fontFamily="var(--font-display)" fontWeight="600">{centerValue ?? total.toLocaleString()}</text>
      <text x="360" y="195" textAnchor="middle" fill={chartMuted} fontSize="11" fontFamily="var(--font-mono)">{centerLabel}</text>
    </svg>
  );
}

export function SterlingLollipopChart({ data, ariaLabel, unit = "", xLabel }: { data: BarDatum[]; ariaLabel: string; unit?: string; xLabel?: string }) {
  const top = 30;
  const rowH = 56;
  const axisBottom = xLabel ? 50 : 34;
  const x0 = 200;
  const x1 = 660;
  const height = top + data.length * rowH + axisBottom;
  const baseline = top + data.length * rowH;
  const x = linearScale(data.map((datum) => datum.value), [x0, x1], { zero: true });
  return (
    <svg className="sterling-chart" viewBox={`0 0 720 ${height}`} role="img" aria-label={ariaLabel}>
      {x.ticks(6).map((value) => (
        <line key={value} x1={x(value)} x2={x(value)} y1={top} y2={baseline} stroke={chartGrid} strokeWidth={sterlingVisualStyle.stroke.grid} />
      ))}
      {data.map((datum, index) => {
        const y = top + index * rowH + rowH / 2 - 4;
        const color = sterlingChartColors[index];
        return (
          <g key={datum.label}>
            <text x={x0 - 14} y={y + 4} textAnchor="end" fill={chartText} fontSize="12" fontFamily="var(--font-mono)">{datum.label}</text>
            <line x1={x(0)} x2={x(datum.value)} y1={y} y2={y} stroke={color} strokeOpacity={sterlingVisualStyle.opacity.secondaryMark} strokeWidth={sterlingVisualStyle.stroke.series} />
            <circle cx={x(datum.value)} cy={y} r="8" fill={color}>
              <title>{`${datum.label}: ${datum.value}${unit}`}</title>
            </circle>
            <text x={x(datum.value) + 15} y={y + 4} fill={chartMuted} fontSize="11" fontFamily="var(--font-mono)">{datum.value}{unit}</text>
          </g>
        );
      })}
      <AxisBottom scale={x} y={baseline} count={6} title={xLabel} format={(value) => `${value}${unit}`} />
    </svg>
  );
}

function polarPoint(centerX: number, centerY: number, radius: number, angle: number) {
  const radians = ((angle - 90) * Math.PI) / 180;
  return { x: centerX + radius * Math.cos(radians), y: centerY + radius * Math.sin(radians) };
}

function pieArc(centerX: number, centerY: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarPoint(centerX, centerY, radius, endAngle);
  const end = polarPoint(centerX, centerY, radius, startAngle);
  return `M ${centerX} ${centerY} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${endAngle - startAngle > 180 ? 1 : 0} 0 ${end.x} ${end.y} Z`;
}

export function SterlingPieChart({ data, ariaLabel }: { data: DonutDatum[]; ariaLabel: string }) {
  const total = data.reduce((sum, datum) => sum + datum.value, 0);
  let angle = 0;
  return (
    <svg className="sterling-chart" viewBox="0 0 720 390" role="img" aria-label={ariaLabel}>
      {data.map((datum, index) => {
        const start = angle;
        const end = angle + (datum.value / total) * 360;
        angle = end;
        return (
          <path key={datum.label} d={pieArc(360, 194, 138, start, end)} fill={sterlingChartColors[index]} stroke="var(--sterling-surface)" strokeWidth={sterlingVisualStyle.stroke.mark}>
            <title>{`${datum.label}: ${datum.value.toLocaleString()} (${((datum.value / total) * 100).toFixed(1)}%)`}</title>
          </path>
        );
      })}
    </svg>
  );
}

export function SterlingChordChart({
  rowLabels,
  columnLabels,
  values,
  ariaLabel,
}: {
  rowLabels: string[];
  columnLabels: string[];
  values: number[][];
  ariaLabel: string;
}) {
  const labels = [...rowLabels, ...columnLabels];
  const matrix = Array.from({ length: labels.length }, () => Array(labels.length).fill(0));
  values.forEach((row, rowIndex) => row.forEach((value, columnIndex) => {
    matrix[rowIndex][rowLabels.length + columnIndex] = value;
    matrix[rowLabels.length + columnIndex][rowIndex] = value;
  }));
  const chords = d3Chord().padAngle(0.055).sortSubgroups((left, right) => right - left)(matrix);
  const arcPath = d3Arc<ChordGroup>()
    .innerRadius(126)
    .outerRadius(145)
    .cornerRadius(3)
    .startAngle((group) => group.startAngle)
    .endAngle((group) => group.endAngle);
  const ribbonPath = d3Ribbon<Chord, ChordSubgroup>().radius(122);
  return (
    <svg className="sterling-chart" viewBox="0 0 720 420" role="img" aria-label={ariaLabel}>
      <g transform="translate(360 204)">
        {chords.map((item, index) => (
          <path key={`${item.source.index}-${item.target.index}-${index}`} d={ribbonPath(item) ?? undefined} fill={sterlingChartColors[item.source.index]} fillOpacity={sterlingVisualStyle.opacity.relationship}>
            <title>{`${labels[item.source.index]} + ${labels[item.target.index]}: ${item.source.value}`}</title>
          </path>
        ))}
        {chords.groups.map((group) => (
          <path key={group.index} d={arcPath(group) ?? undefined} fill={sterlingChartColors[group.index]} stroke="var(--sterling-surface)" strokeWidth={sterlingVisualStyle.stroke.mark} />
        ))}
        {chords.groups.map((group) => {
          const angle = (group.startAngle + group.endAngle) / 2;
          const x = Math.sin(angle) * 170;
          const y = -Math.cos(angle) * 170;
          return <text key={`label-${group.index}`} x={x} y={y + 4} textAnchor={x < -8 ? "end" : x > 8 ? "start" : "middle"} fill={chartText} fontSize="10" fontFamily="var(--font-mono)">{labels[group.index]}</text>;
        })}
      </g>
    </svg>
  );
}

export interface SankeyLinkDatum {
  source: string;
  target: string;
  value: number;
}

export function SterlingSankeyChart({ links, ariaLabel }: { links: SankeyLinkDatum[]; ariaLabel: string }) {
  const sources = [...new Set(links.map((link) => link.source))];
  const targets = [...new Set(links.map((link) => link.target))];
  const labels = [...sources, ...targets];
  type NodeExtra = { name: string; colorIndex: number };
  type LinkExtra = { sourceName: string; targetName: string; colorIndex: number };
  const graph = d3Sankey<NodeExtra, LinkExtra>()
    .nodeWidth(14)
    .nodePadding(12)
    .extent([[112, 36], [608, 360]])({
      nodes: labels.map((name, index) => ({ name, colorIndex: index })),
      links: links.map((link) => ({
        source: labels.indexOf(link.source),
        target: labels.indexOf(link.target),
        value: link.value,
        sourceName: link.source,
        targetName: link.target,
        colorIndex: sources.indexOf(link.source),
      })),
    });
  const linkPath = sankeyLinkHorizontal<NodeExtra, LinkExtra>();
  return (
    <svg className="sterling-chart" viewBox="0 0 720 420" role="img" aria-label={ariaLabel}>
      {graph.links.map((link, index) => (
        <path
          key={`${link.sourceName}-${link.targetName}-${index}`}
          d={linkPath(link) ?? undefined}
          fill="none"
          stroke={sterlingChartColors[link.colorIndex]}
          strokeOpacity={sterlingVisualStyle.opacity.relationship}
          strokeWidth={Math.max(sterlingVisualStyle.stroke.flowMinimum, link.width ?? sterlingVisualStyle.stroke.flowMinimum)}
        >
          <title>{`${link.sourceName} → ${link.targetName}: ${link.value}`}</title>
        </path>
      ))}
      {graph.nodes.map((node) => {
        const x0 = node.x0 ?? 0;
        const x1 = node.x1 ?? x0;
        const y0 = node.y0 ?? 0;
        const y1 = node.y1 ?? y0;
        const sourceSide = (node.depth ?? 0) === 0;
        return (
          <g key={node.name}>
            <rect x={x0} y={y0} width={Math.max(1, x1 - x0)} height={Math.max(1, y1 - y0)} rx="2" fill={sterlingChartColors[node.colorIndex]} />
            <text x={sourceSide ? x0 - 10 : x1 + 10} y={(y0 + y1) / 2 + 4} textAnchor={sourceSide ? "end" : "start"} fill={chartText} fontSize="11" fontFamily="var(--font-mono)">{node.name}</text>
          </g>
        );
      })}
    </svg>
  );
}
