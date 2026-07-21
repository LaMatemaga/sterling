import type { ReactElement } from "react";
import { geoAlbersUsa, geoPath } from "d3-geo";
import { hierarchy, treemap, treemapSquarify } from "d3-hierarchy";
import { feature } from "topojson-client";
import { sterlingChartColors, sterlingDivergentColors, sterlingRamp, sterlingRampStops, sterlingSequentialColors } from "./palette";
import { kernelDensity } from "./charts";
import { AxisBottom, AxisLeft, Gridlines, bandCenters, divergentSignedColor, frame, linearScale } from "./plot";
import { sterlingVisualStyle } from "./visualStyle";

const muted = "var(--sterling-muted)";
const grid = "var(--sterling-grid)";
const surface = "var(--sterling-surface)";
const text = "var(--sterling-text)";

export function SterlingVerticalBarChart({ data, ariaLabel, yLabel, xLabel }: { data: Array<[string, number]>; ariaLabel: string; yLabel?: string; xLabel?: string }) {
  const f = frame(720, 380, { top: 26, right: 26, bottom: 56, left: 70 });
  const y = linearScale([0, Math.max(...data.map(([, value]) => value), 1)], [f.y1, f.y0], { zero: true });
  const { centers, step } = bandCenters(data.length, f.x0, f.x1);
  const width = Math.min(70, step * 0.62);
  return (
    <svg className="sterling-chart" viewBox={`0 0 ${f.width} ${f.height}`} role="img" aria-label={ariaLabel}>
      <Gridlines scale={y} x0={f.x0} x1={f.x1} count={5} />
      {data.map(([label, value], index) => {
        const cx = centers[index];
        return <g key={label}>
          <rect x={cx - width / 2} y={y(value)} width={width} height={f.y1 - y(value)} rx="6" fill={sterlingChartColors[index]}><title>{`${label}: ${value.toFixed(1)}`}</title></rect>
          <text x={cx} y={y(value) - 8} textAnchor="middle" fill={muted} fontSize="11" fontFamily="var(--font-mono)">{value.toFixed(1)}</text>
          <text x={cx} y={f.y1 + 18} textAnchor="middle" fill={text} fontSize="12" fontFamily="var(--font-mono)">{label}</text>
        </g>;
      })}
      <AxisLeft scale={y} x={f.x0} count={5} title={yLabel} />
      <line x1={f.x0} x2={f.x1} y1={f.y1} y2={f.y1} stroke="var(--sterling-edge)" />
      {xLabel ? <text x={(f.x0 + f.x1) / 2} y={f.y1 + 42} textAnchor="middle" fill={muted} fontSize="12" fontFamily="var(--font-mono)">{xLabel}</text> : null}
    </svg>
  );
}

export function SterlingCandlestickChart({ rows, ariaLabel, yLabel, xLabel }: { rows: Array<[string, number, number, number, number]>; ariaLabel: string; yLabel?: string; xLabel?: string }) {
  const values = rows.flatMap(([, open, high, low, close]) => [open, high, low, close]);
  const f = frame(720, 380, { top: 26, right: 26, bottom: 56, left: 70 });
  const y = linearScale(values, [f.y1, f.y0], { padFraction: 0.06 });
  const { centers, step } = bandCenters(rows.length, f.x0, f.x1);
  const bodyWidth = Math.min(15, step * 0.62);
  // Brand orientation: violet = up (positive), teal = down (negative).
  const rising = sterlingDivergentColors[2];
  const falling = sterlingDivergentColors[8];
  const labelStep = Math.max(1, Math.ceil(rows.length / 8));
  const lastIndex = rows.length - 1;
  const showDate = (index: number) => index === lastIndex || (index % labelStep === 0 && lastIndex - index >= labelStep * 0.55);
  return <svg className="sterling-chart" viewBox={`0 0 ${f.width} ${f.height}`} role="img" aria-label={ariaLabel}>
    <Gridlines scale={y} x0={f.x0} x1={f.x1} count={5} />
    {rows.map(([date, open, high, low, close], index) => {
      const x = centers[index];
      const up = close >= open;
      const color = up ? rising : falling;
      const top = y(Math.max(open, close));
      const bottom = y(Math.min(open, close));
      return <g key={date}>
        <title>{`${date}: open ${open}, high ${high}, low ${low}, close ${close}`}</title>
        <line x1={x} x2={x} y1={y(high)} y2={y(low)} stroke={color} strokeWidth={sterlingVisualStyle.stroke.candle} />
        <rect x={x - bodyWidth / 2} y={top} width={bodyWidth} height={Math.max(2, bottom - top)} rx="1.5" fill={up ? color : surface} stroke={color} strokeWidth={sterlingVisualStyle.stroke.candle} />
        {showDate(index) ? <text x={x} y={f.y1 + 18} textAnchor="middle" fill={muted} fontSize="10" fontFamily="var(--font-mono)">{date}</text> : null}
      </g>;
    })}
    <AxisLeft scale={y} x={f.x0} count={5} title={yLabel} format={(value) => value.toFixed(0)} />
    <line x1={f.x0} x2={f.x1} y1={f.y1} y2={f.y1} stroke="var(--sterling-edge)" />
    {xLabel ? <text x={(f.x0 + f.x1) / 2} y={f.y1 + 42} textAnchor="middle" fill={muted} fontSize="12" fontFamily="var(--font-mono)">{xLabel}</text> : null}
  </svg>;
}

function polar(cx: number, cy: number, radius: number, index: number, count: number) {
  const angle = -Math.PI / 2 + index * Math.PI * 2 / count;
  return [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius] as const;
}

export function SterlingRadarChart({ labels, series, domain, ariaLabel, unit = "" }: { labels: string[]; series: Array<[string, ...number[]]>; domain: number[]; ariaLabel: string; unit?: string }) {
  const cx = 360, cy = 196, radius = 130;
  const scale = (value: number) => ((value - domain[0]) / Math.max(domain[1] - domain[0], 1)) * radius;
  const levels = [0.2, 0.4, 0.6, 0.8, 1];
  // Radial tick values so the rings can actually be read.
  const ringValue = (level: number) => domain[0] + level * (domain[1] - domain[0]);
  const format = (value: number) => `${Number.isInteger(value) ? value : value.toFixed(1)}${unit}`;
  return <svg className="sterling-chart" viewBox="0 0 720 390" role="img" aria-label={ariaLabel}>
    {levels.map((level) => <polygon key={level} points={labels.map((_, index) => polar(cx, cy, radius * level, index, labels.length).join(",")).join(" ")} fill="none" stroke={grid} />)}
    {labels.map((label, index) => {
      const [x, y] = polar(cx, cy, radius, index, labels.length);
      const [lx, ly] = polar(cx, cy, radius + 24, index, labels.length);
      return <g key={label}><line x1={cx} y1={cy} x2={x} y2={y} stroke={grid} /><text x={lx} y={ly + 4} textAnchor="middle" fill={muted} fontSize="10" fontFamily="var(--font-mono)">{label}</text></g>;
    })}
    {series.map(([name, ...values], index) => {
      const color = sterlingSequentialColors[Math.min(9, index + 2)];
      const latest = index === series.length - 1;
      return <polygon key={name} points={values.map((value, axis) => polar(cx, cy, scale(value), axis, labels.length).join(",")).join(" ")} fill={latest ? color : "none"} fillOpacity={sterlingVisualStyle.opacity.surface} stroke={color} strokeWidth={sterlingVisualStyle.stroke.detail} strokeOpacity={latest ? 1 : sterlingVisualStyle.opacity.guide}><title>{`${name}: ${values.join(", ")}`}</title></polygon>;
    })}
    {/* Radial value axis: labelled rings along the vertical spoke. The halo
        keeps them readable where series polygons cross underneath. */}
    {[0, ...levels].map((level) => (
      <text
        key={`r-${level}`}
        x={cx + 6}
        y={cy - radius * level + 3}
        fill={muted}
        fontSize="9"
        fontFamily="var(--font-mono)"
        stroke={surface}
        strokeWidth={sterlingVisualStyle.stroke.halo}
        paintOrder="stroke"
      >
        {format(ringValue(level))}
      </text>
    ))}
  </svg>;
}

export function SterlingRidgelineChart({ groups, ariaLabel, xLabel, unit = "" }: { groups: Array<{ label: string; values: number[] }>; ariaLabel: string; xLabel?: string; unit?: string }) {
  const all = groups.flatMap((group) => group.values);
  const observedMin = Math.min(...all);
  const observedMax = Math.max(...all);
  // Estimate density past the data so ridges taper instead of clipping.
  const margin = (observedMax - observedMin) * 0.08;
  const domain: [number, number] = [observedMin - margin, observedMax + margin];
  const x0 = 118, x1 = 664;
  const baseline = 338;
  const rowStep = (baseline - 60) / Math.max(groups.length, 1);
  const amplitude = rowStep * 1.9; // overlap so ridges interleave
  const x = linearScale(domain, [x0, x1], { padFraction: 0 });
  const peak = Math.max(
    ...groups.map((group) => Math.max(...kernelDensity(group.values, 96, domain).map((point) => point.density))),
    Number.EPSILON,
  );
  return <svg className="sterling-chart" viewBox="0 0 720 390" role="img" aria-label={ariaLabel}>
    {x.ticks(6).map((value) => <line key={value} x1={x(value)} x2={x(value)} y1={26} y2={baseline} stroke={grid} strokeWidth={sterlingVisualStyle.stroke.grid} />)}
    {groups.map((source, index) => {
      // Draw top-to-bottom so nearer (lower) ridges occlude the ones behind them.
      const base = 60 + index * rowStep;
      const density = kernelDensity(source.values, 96, domain);
      const points = density.map((point) => `${x(point.value)} ${base - (point.density / peak) * amplitude}`);
      const color = sterlingChartColors[index % sterlingChartColors.length];
      return <g key={source.label}>
        <text x={x0 - 12} y={base + 3} textAnchor="end" fill={text} fontSize="10" fontFamily="var(--font-mono)">{source.label}</text>
        <path d={`M ${x(domain[0])} ${base} L ${points.join(" L ")} L ${x(domain[1])} ${base} Z`} fill={color} fillOpacity={sterlingVisualStyle.opacity.ridge} stroke={color} strokeWidth={sterlingVisualStyle.stroke.series} strokeLinejoin="round" />
      </g>;
    })}
    <AxisBottom scale={x} y={baseline} count={6} title={xLabel} format={(value) => `${value}${unit}`} />
  </svg>;
}

export function SterlingDensity2DChart({ points, regionLabels, ariaLabel, xLabel, yLabel }: { points: Array<[number, number, number]>; regionLabels: string[]; ariaLabel: string; xLabel?: string; yLabel?: string }) {
  const f = frame(720, 380, { top: 26, right: 26, bottom: 56, left: 74 });
  const x = linearScale(points.map((point) => point[0]), [f.x0, f.x1]);
  const y = linearScale(points.map((point) => point[1]), [f.y1, f.y0]);
  const pxX = Math.abs(x(1000) - x(0)) / 1000;
  const pxY = Math.abs(y(1) - y(0));
  const specs = [[4570,71.26,559,.74,.36],[4012,69.71,605,1.02,.46],[4611,71.77,283,1.04,-.03],[4703,71.23,664,1.35,-.29]];
  return <svg className="sterling-chart" viewBox={`0 0 ${f.width} ${f.height}`} role="img" aria-label={ariaLabel}>
    <Gridlines scale={y} x0={f.x0} x1={f.x1} count={5} />
    {specs.flatMap(([meanX, meanY, sdX, sdY, correlation], index) => [1, .68, .38].map((level) => <ellipse key={`${index}-${level}`} cx={x(meanX)} cy={y(meanY)} rx={sdX * pxX * 1.7 * level} ry={sdY * pxY * 1.7 * level} transform={`rotate(${-correlation * 35} ${x(meanX)} ${y(meanY)})`} fill={sterlingChartColors[index]} fillOpacity={sterlingVisualStyle.opacity.contour} stroke={sterlingChartColors[index]} strokeWidth={sterlingVisualStyle.stroke.detail} />))}
    {points.map(([income, life, group], index) => <circle key={index} cx={x(income)} cy={y(life)} r="4" fill={sterlingChartColors[group]} fillOpacity={sterlingVisualStyle.opacity.secondaryMark}><title>{`${regionLabels[group]}: ${income}, ${life}`}</title></circle>)}
    <AxisLeft scale={y} x={f.x0} count={5} title={yLabel} />
    <AxisBottom scale={x} y={f.y1} count={6} title={xLabel} format={(value) => `${(value / 1000).toFixed(1)}k`} />
  </svg>;
}

export function SterlingTreemapChart({ rows, ariaLabel }: { rows: Array<[string, string, string, number]>; ariaLabel: string }) {
  const continents = [...new Set(rows.map(([continent]) => continent))];
  type TreeDatum = { name: string; continent?: string; value?: number; children?: TreeDatum[] };
  // Continent -> country directly. The sub-region level was invisible and made
  // the gaps between neighbouring tiles uneven (padding stacked per nesting).
  const rootData: TreeDatum = {
    name: "world",
    children: continents.map((continent) => ({
      name: continent,
      continent,
      children: rows
        .filter(([name]) => name === continent)
        .map(([, , country, value]) => ({ name: country, continent, value })),
    })),
  };
  // Rank within each continent drives the sequential stop, so the ramp reads as
  // an ordered scale instead of collapsing: population is power-law shaped, and
  // a proportional mapping puts most countries on the same one or two tones.
  const rankByCountry = new Map<string, { rank: number; total: number }>();
  continents.forEach((continent) => {
    const list = rows.filter(([name]) => name === continent).sort((left, right) => right[3] - left[3]);
    list.forEach(([, , country], index) => rankByCountry.set(country, { rank: index, total: list.length }));
  });
  // The ramp band is already trimmed to legible stops, so rank spans it fully.
  const stopFor = (country: string) => {
    const entry = rankByCountry.get(country);
    if (!entry || entry.total < 2) return sterlingRampStops;
    return Math.round(sterlingRampStops - (entry.rank * (sterlingRampStops - 1)) / (entry.total - 1));
  };
  const treeRoot = hierarchy(rootData)
    .sum((datum) => datum.value ?? 0)
    .sort((left, right) => (right.value ?? 0) - (left.value ?? 0));
  const root = treemap<TreeDatum>()
    .tile(treemapSquarify)
    .size([680, 330])
    // One nesting level means one uniform gap between tiles; the slightly wider
    // outer inset is what separates continents.
    .paddingInner(3)
    .paddingOuter(4)
    .paddingTop((node) => (node.depth === 1 ? 21 : 0))
    .round(true)(treeRoot);
  return (
    <svg className="sterling-chart" viewBox="0 0 720 370" role="img" aria-label={ariaLabel}>
      <g transform="translate(20 20)">
        {root.descendants().filter((node) => node.depth === 1).map((node) => {
          const color = sterlingChartColors[continents.indexOf(node.data.name)];
          return <g key={`group-${node.data.name}`}>
            <rect x={node.x0} y={node.y0} width={node.x1 - node.x0} height={node.y1 - node.y0} rx="3" fill="none" stroke={color} strokeWidth={sterlingVisualStyle.stroke.detail} />
            <text x={node.x0 + 6} y={node.y0 + 13} fill={color} fontSize="9" fontFamily="var(--font-mono)" fontWeight="700">{node.data.name}</text>
          </g>;
        })}
        {root.leaves().map((leaf) => {
          const continent = leaf.data.continent ?? "";
          const width = leaf.x1 - leaf.x0;
          const height = leaf.y1 - leaf.y0;
          const fontSize = width > 120 ? 10 : 8;
          const stop = stopFor(leaf.data.name);
          const fits = width > leaf.data.name.length * fontSize * 0.62 + 10 && height > fontSize * 2.4;
          return <g key={leaf.data.name}>
            <rect x={leaf.x0} y={leaf.y0} width={width} height={height} rx="2" fill={sterlingRamp(continents.indexOf(continent), stop)}>
              <title>{`${leaf.data.name}: ${(leaf.value ?? 0).toLocaleString()}`}</title>
            </rect>
            {/* Strong stops carry surface-colored type; faint ones need ink. A
                halo was tried here and reads as a heavy outline at this size. */}
            {fits ? <text x={leaf.x0 + 6} y={leaf.y0 + fontSize + 5} fill={stop > sterlingRampStops / 2 ? surface : text} fontSize={fontSize} fontFamily="var(--font-mono)">{leaf.data.name}</text> : null}
          </g>;
        })}
      </g>
    </svg>
  );
}

export function SterlingNetworkChart({ nodes, edges, ariaLabel }: { nodes: Array<[string,number,number,number,number]>; edges: Array<[number,number]>; ariaLabel: string }) {
  return <svg className="sterling-chart" viewBox="0 0 560 300" role="img" aria-label={ariaLabel}>
    {edges.map(([source,target], index) => <line key={index} x1={nodes[source][1]+42} y1={nodes[source][2]} x2={nodes[target][1]+42} y2={nodes[target][2]} stroke={grid} strokeWidth={sterlingVisualStyle.stroke.detail} />)}
    {nodes.map(([name,x,y,degree,community]) => { const radius=5+(degree-10)*.45; return <g key={name}><circle cx={x+42} cy={y} r={radius} fill={sterlingChartColors[community]} stroke={surface} strokeWidth={sterlingVisualStyle.stroke.mark}><title>{`${name}: ${degree}`}</title></circle>{degree>=19||name==="Y Holtz"?<text x={x+42} y={y-radius-7} textAnchor="middle" fill={muted} fontSize="7.5" fontFamily="var(--font-mono)">{name}</text>:null}</g>; })}
  </svg>;
}

export function SterlingDendrogramChart({ labels, merge, height, order, groups, ariaLabel, yLabel, cutLabel }: { labels:string[]; merge:Array<[number,number]>; height:number[]; order:number[]; groups:number[][]; ariaLabel:string; yLabel?:string; cutLabel?:string }) {
  const leafY=270, maximum=Math.max(...height), axisX=78, step=(666-axisX-24)/(order.length-1);
  const leafX=new Map(order.map((leaf,position)=>[leaf,axisX+12+position*step]));
  const groupByLeaf=new Map<number,number>(); groups.forEach((members,group)=>members.forEach(leaf=>groupByLeaf.set(leaf,group)));
  // Shared linear scale so the merge heights read as real distances.
  const dist=linearScale([0,maximum],[leafY,leafY-206],{zero:true});
  type Node={x:number;y:number;members:number[];group:number|null}; const clusters:Node[]=[];
  const child=(reference:number):Node=>reference<0?{x:leafX.get(-reference)??axisX,y:leafY,members:[-reference],group:groupByLeaf.get(-reference)??null}:clusters[reference-1];
  const branches=merge.map(([leftRef,rightRef],index)=>{const left=child(leftRef),right=child(rightRef),nodeY=dist(height[index]),members=[...left.members,...right.members],memberships=[...new Set(members.map(leaf=>groupByLeaf.get(leaf)))],group=memberships.length===1?(memberships[0]??null):null;clusters.push({x:(left.x+right.x)/2,y:nodeY,members,group});return {left,right,y:nodeY,group};});
  const cut=0.388,cutY=dist(cut);
  return <svg className="sterling-chart" viewBox="0 0 720 390" role="img" aria-label={ariaLabel}>
    <AxisLeft scale={dist} x={axisX} gridX1={666} count={5} title={yLabel}/>
    <line x1={axisX} x2="666" y1={cutY} y2={cutY} stroke={muted} strokeDasharray="5 5"/>
    {cutLabel?<text x="666" y={cutY-6} textAnchor="end" fill={muted} fontSize="9" fontFamily="var(--font-mono)">{`${cutLabel} ${cut}`}</text>:null}
    {groups.map((members,index)=>{const positions=members.map(leaf=>leafX.get(leaf)??0);const x0=Math.min(...positions)-9,x1=Math.max(...positions)+9;return <rect key={index} x={x0} y={cutY} width={x1-x0} height={leafY-cutY+50} rx="6" fill={sterlingChartColors[index]} fillOpacity={sterlingVisualStyle.opacity.ghost} stroke={sterlingChartColors[index]} strokeWidth={sterlingVisualStyle.stroke.detail}/>;})}
    {branches.map(({left,right,y,group},index)=><g key={index}><path d={`M ${left.x} ${left.y} V ${y}`} stroke={left.group===null?muted:sterlingChartColors[left.group]} fill="none" strokeWidth={sterlingVisualStyle.stroke.detail}/><path d={`M ${right.x} ${right.y} V ${y}`} stroke={right.group===null?muted:sterlingChartColors[right.group]} fill="none" strokeWidth={sterlingVisualStyle.stroke.detail}/><path d={`M ${left.x} ${y} H ${right.x}`} stroke={group===null?muted:sterlingChartColors[group]} fill="none" strokeWidth={sterlingVisualStyle.stroke.detail}/></g>)}
    {order.map(leaf=>{const x=leafX.get(leaf)??0,group=groupByLeaf.get(leaf)??0;return <g key={leaf}><circle cx={x} cy={leafY} r="3.5" fill={sterlingChartColors[group]}/><text x={x+3} y={leafY+12} transform={`rotate(50 ${x+3} ${leafY+12})`} fill={muted} fontSize="7.5" fontFamily="var(--font-mono)">{labels[leaf-1]}</text></g>;})}
  </svg>;
}

export function SterlingVolcanoChart({ hex, labels, ariaLabel, xLabel, yLabel }: { hex: string; labels: Array<[string,number,number]>; ariaLabel: string; xLabel?: string; yLabel?: string }) {
  const genes = Array.from({ length: hex.length / 4 }, (_, index) => { const offset=index*4; return [(parseInt(hex.slice(offset,offset+2),16)/255)*12-6,(parseInt(hex.slice(offset+2,offset+4),16)/255)*5] as const; });
  const f = frame(720, 380, { top: 26, right: 26, bottom: 56, left: 70 });
  const x = linearScale([-6, 6], [f.x0, f.x1], { padFraction: 0 });
  const y = linearScale([0, 5], [f.y1, f.y0], { zero: true });
  return <svg className="sterling-chart" viewBox={`0 0 ${f.width} ${f.height}`} role="img" aria-label={ariaLabel}>
    <Gridlines scale={y} x0={f.x0} x1={f.x1} count={5}/>
    <line x1={x(0)} x2={x(0)} y1={f.y0} y2={f.y1} stroke={grid} strokeWidth={sterlingVisualStyle.stroke.grid}/>{[-1,1].map(v=><line key={v} x1={x(v)} x2={x(v)} y1={f.y0} y2={f.y1} stroke={sterlingChartColors[7]} strokeDasharray="5 5" strokeOpacity={sterlingVisualStyle.opacity.guide} strokeWidth={sterlingVisualStyle.stroke.grid}/>)}<line x1={f.x0} x2={f.x1} y1={y(1.3)} y2={y(1.3)} stroke={sterlingChartColors[7]} strokeDasharray="5 5" strokeOpacity={sterlingVisualStyle.opacity.guide} strokeWidth={sterlingVisualStyle.stroke.grid}/>
    {genes.map(([effect,evidence],index)=>{const significant=Math.abs(effect)>=1&&evidence>=1.3; const color=significant?(effect<0?sterlingChartColors[2]:sterlingChartColors[1]):sterlingChartColors[7]; return <circle key={index} cx={x(effect)} cy={y(evidence)} r={significant?2.5:1.6} fill={color} fillOpacity={significant ? sterlingVisualStyle.opacity.signal : sterlingVisualStyle.opacity.mutedMark}/>;})}
    {labels.map(([gene,effect,evidence])=><g key={gene}><circle cx={x(effect)} cy={y(evidence)} r="4" fill={effect<0?sterlingChartColors[2]:sterlingChartColors[1]} stroke={surface}/><text x={x(effect)} y={y(evidence)-8} textAnchor="middle" fill={text} fontSize="8" fontFamily="var(--font-mono)">{gene}</text></g>)}
    <AxisLeft scale={y} x={f.x0} count={5} title={yLabel}/>
    <AxisBottom scale={x} y={f.y1} count={7} title={xLabel}/>
  </svg>;
}

export function SterlingManhattanChart({ hex, labels, chromosomeCenters, ariaLabel, xLabel, yLabel }: { hex:string; labels:Array<[string,number,number,number]>; chromosomeCenters:number[]; ariaLabel:string; xLabel?:string; yLabel?:string }) {
  const points=Array.from({length:hex.length/8},(_,index)=>{const offset=index*8;return [parseInt(hex.slice(offset,offset+4),16)/65535,(parseInt(hex.slice(offset+4,offset+6),16)/255)*9,parseInt(hex.slice(offset+6,offset+8),16)] as const;});
  const f = frame(720, 380, { top: 26, right: 26, bottom: 56, left: 70 });
  const x=(v:number)=>f.x0+v*(f.x1-f.x0);
  const y = linearScale([0, 9], [f.y1, f.y0], { zero: true });
  const threshold=-Math.log10(5e-8);
  return <svg className="sterling-chart" viewBox={`0 0 ${f.width} ${f.height}`} role="img" aria-label={ariaLabel}>
    <Gridlines scale={y} x0={f.x0} x1={f.x1} count={5}/>
    <line x1={f.x0} x2={f.x1} y1={y(threshold)} y2={y(threshold)} stroke={sterlingChartColors[5]} strokeDasharray="5 5"/>
    {points.map(([position,evidence,chromosome],index)=><circle key={index} cx={x(position)} cy={y(evidence)} r={evidence>=threshold?3:1.5} fill={sterlingChartColors[chromosome%2===0?4:0]} fillOpacity={evidence>=threshold?1:sterlingVisualStyle.opacity.secondaryMark}/>)}
    {labels.slice(0,1).map(([name,chromosome,position,evidence])=><g key={name}><circle cx={x(position)} cy={y(evidence)} r="4" fill={sterlingChartColors[chromosome%2===0?4:0]} stroke={surface}/><text x={x(position)+8} y={y(evidence)-8} fill={text} fontSize="8" fontFamily="var(--font-mono)">{`chr${chromosome} · ${name}`}</text></g>)}
    <AxisLeft scale={y} x={f.x0} count={5} title={yLabel}/>
    <line x1={f.x0} x2={f.x1} y1={f.y1} y2={f.y1} stroke="var(--sterling-edge)"/>
    {chromosomeCenters.map((position,index)=><text key={index} x={x(position)} y={f.y1 + 16} textAnchor="middle" fill={muted} fontSize="8" fontFamily="var(--font-mono)">{index+1}</text>)}
    {xLabel ? <text x={(f.x0 + f.x1) / 2} y={f.y1 + 42} textAnchor="middle" fill={muted} fontSize="12" fontFamily="var(--font-mono)">{xLabel}</text> : null}
  </svg>;
}

function correlation(left:number[],right:number[]) { const lm=left.reduce((a,b)=>a+b,0)/left.length,rm=right.reduce((a,b)=>a+b,0)/right.length;let n=0,ls=0,rs=0;left.forEach((value,index)=>{const l=value-lm,r=right[index]-rm;n+=l*r;ls+=l*l;rs+=r*r;});return n/Math.sqrt(ls*rs); }

type ClusterNode = { members: number[]; left: ClusterNode | null; right: ClusterNode | null; height: number; group: number | null };

/** Average-linkage hierarchical clustering on correlation distance (1 - r). */
function clusterVectors(vectors: number[][], memberships: number[]): ClusterNode {
  const distances = vectors.map((left, li) => vectors.map((right, ri) => (li === ri ? 0 : 1 - correlation(left, right))));
  let clusters: ClusterNode[] = vectors.map((_, i) => ({ members: [i], left: null, right: null, height: 0, group: memberships[i] }));
  const meanMembership = (c: ClusterNode) => c.members.reduce((s, m) => s + memberships[m], 0) / c.members.length;
  while (clusters.length > 1) {
    let bestLeft = 0, bestRight = 1, bestDistance = Number.POSITIVE_INFINITY;
    for (let i = 0; i < clusters.length; i += 1) {
      for (let j = i + 1; j < clusters.length; j += 1) {
        const L = clusters[i], R = clusters[j];
        const d = L.members.reduce((sum, lm) => sum + R.members.reduce((inner, rm) => inner + distances[lm][rm], 0), 0) / (L.members.length * R.members.length);
        if (d < bestDistance) { bestDistance = d; bestLeft = i; bestRight = j; }
      }
    }
    let L = clusters[bestLeft], R = clusters[bestRight];
    if (meanMembership(L) > meanMembership(R)) { [L, R] = [R, L]; }
    const members = [...L.members, ...R.members];
    const groupSet = [...new Set(members.map((m) => memberships[m]))];
    const merged: ClusterNode = { members, left: L, right: R, height: bestDistance, group: groupSet.length === 1 ? groupSet[0] : null };
    clusters = clusters.filter((_, index) => index !== bestLeft && index !== bestRight);
    clusters.push(merged);
  }
  return clusters[0];
}

function leafOrder(node: ClusterNode): number[] {
  return node.left ? [...leafOrder(node.left), ...leafOrder(node.right as ClusterNode)] : node.members;
}

/**
 * Clustered correlation heatmap of NCI60 expression profiles. Rows and columns
 * are reordered by hierarchical clustering so shared signatures surface as
 * diagonal blocks; dendrograms, type annotations, and region frames match the
 * canonical v1.5 figure. Violet = positive correlation, teal = negative.
 */
export function SterlingExpressionChart({ hex, groups, types, ariaLabel }: { hex:string; groups:number[]; types:string[]; ariaLabel:string }) {
  const columns = groups.length;
  const raw = Array.from({ length: hex.length / 2 }, (_, index) => (parseInt(hex.slice(index * 2, index * 2 + 2), 16) / 255) * 5 - 2.5);
  const genes = raw.length / columns;
  const matrix = Array.from({ length: genes }, (_, row) => raw.slice(row * columns, (row + 1) * columns));
  const columnVectors = Array.from({ length: columns }, (_, column) => matrix.map((row) => row[column]));
  const tree = clusterVectors(columnVectors, groups);
  const order = leafOrder(tree);

  const cell = 9.25;
  const startX = 132;
  const startY = 86;
  const matrixSize = columns * cell;
  const columnCenter = (visible: number) => startX + visible * cell + cell / 2;
  const rowCenter = (visible: number) => startY + visible * cell + cell / 2;
  const branchColor = (node: ClusterNode) => (node.group === null ? muted : sterlingChartColors[node.group]);
  const maxHeight = Math.max(tree.height, 0.0001);

  // Reorder lookups
  const visibleIndex = new Map(order.map((original, visible) => [original, visible]));

  const cells = order.flatMap((row, visibleRow) =>
    order.map((column, visibleColumn) => {
      const value = correlation(columnVectors[row], columnVectors[column]);
      return <rect key={`${visibleRow}-${visibleColumn}`} x={startX + visibleColumn * cell} y={startY + visibleRow * cell} width={cell + 0.1} height={cell + 0.1} fill={divergentSignedColor(value, 1)}>
        <title>{`${types[groups[row]]} × ${types[groups[column]]}: r ${value.toFixed(2)}`}</title>
      </rect>;
    }),
  );

  const topAnnotations = order.map((column, visible) => <rect key={`ta-${visible}`} x={startX + visible * cell} y="78" width={cell + 0.1} height="5" fill={sterlingChartColors[groups[column]]} />);
  const leftAnnotations = order.map((row, visible) => <rect key={`la-${visible}`} x="124" y={startY + visible * cell} width="5" height={cell + 0.1} fill={sterlingChartColors[groups[row]]} />);

  // Region frames around diagonal runs of one type
  const runs: Array<{ group: number; start: number; length: number }> = [];
  order.forEach((column, index) => {
    const group = groups[column];
    const previous = runs[runs.length - 1];
    if (previous && previous.group === group) previous.length += 1;
    else runs.push({ group, start: index, length: 1 });
  });
  const regionFrames = runs.map(({ group, start, length }, index) => (
    <rect key={`rf-${index}`} x={startX + start * cell + 0.7} y={startY + start * cell + 0.7} width={length * cell - 1.4} height={length * cell - 1.4} fill="none" stroke={sterlingChartColors[group]} strokeWidth={sterlingVisualStyle.stroke.series} />
  ));

  // Dendrograms
  const topMarks: ReactElement[] = [];
  let topKey = 0;
  const renderTop = (node: ClusterNode): { x: number; y: number } => {
    if (!node.left) return { x: columnCenter(visibleIndex.get(node.members[0]) as number), y: 75 };
    const l = renderTop(node.left);
    const r = renderTop(node.right as ClusterNode);
    const y = 75 - (node.height / maxHeight) * 55;
    const x = (l.x + r.x) / 2;
    topMarks.push(<path key={`tm-${topKey++}`} d={`M${l.x} ${l.y} V${y}`} fill="none" stroke={branchColor(node.left)} strokeWidth={sterlingVisualStyle.stroke.grid} />);
    topMarks.push(<path key={`tm-${topKey++}`} d={`M${r.x} ${r.y} V${y}`} fill="none" stroke={branchColor(node.right as ClusterNode)} strokeWidth={sterlingVisualStyle.stroke.grid} />);
    topMarks.push(<path key={`tm-${topKey++}`} d={`M${l.x} ${y} H${r.x}`} fill="none" stroke={branchColor(node)} strokeWidth={sterlingVisualStyle.stroke.grid} />);
    return { x, y };
  };
  renderTop(tree);

  const leftMarks: ReactElement[] = [];
  let leftKey = 0;
  const renderLeft = (node: ClusterNode): { x: number; y: number } => {
    if (!node.left) return { x: 121, y: rowCenter(visibleIndex.get(node.members[0]) as number) };
    const l = renderLeft(node.left);
    const r = renderLeft(node.right as ClusterNode);
    const x = 121 - (node.height / maxHeight) * 78;
    const y = (l.y + r.y) / 2;
    leftMarks.push(<path key={`lm-${leftKey++}`} d={`M${l.x} ${l.y} H${x}`} fill="none" stroke={branchColor(node.left)} strokeWidth={sterlingVisualStyle.stroke.grid} />);
    leftMarks.push(<path key={`lm-${leftKey++}`} d={`M${r.x} ${r.y} H${x}`} fill="none" stroke={branchColor(node.right as ClusterNode)} strokeWidth={sterlingVisualStyle.stroke.grid} />);
    leftMarks.push(<path key={`lm-${leftKey++}`} d={`M${x} ${l.y} V${r.y}`} fill="none" stroke={branchColor(node)} strokeWidth={sterlingVisualStyle.stroke.grid} />);
    return { x, y };
  };
  renderLeft(tree);

  const rowLabels = order.map((row, visible) => (
    <text key={`rl-${visible}`} x={startX + matrixSize + 7} y={startY + visible * cell + 6.3} fill={muted} fontSize="6" fontFamily="var(--font-mono)">{`${types[groups[row]]} ${row % 4 + 1}`}</text>
  ));

  const legendStops = Array.from({ length: 21 }, (_, index) => {
    const value = -1 + (index / 20) * 2;
    return <rect key={`ls-${index}`} x={132 + index * 5} y="394" width="5.2" height="8" fill={divergentSignedColor(value, 1)} />;
  });

  // The cancer-type key already lives in the figure subtitle, so the chart only
  // carries the correlation color scale.
  return <svg className="sterling-chart" viewBox="0 0 600 416" role="img" aria-label={ariaLabel}>
    {topMarks}
    {leftMarks}
    {topAnnotations}
    {leftAnnotations}
    {cells}
    {regionFrames}
    {rowLabels}
    {legendStops}
    <text x="126" y="401" textAnchor="end" fill={muted} fontSize="6.4" fontFamily="var(--font-mono)">-1</text>
    <text x="242" y="401" fill={muted} fontSize="6.4" fontFamily="var(--font-mono)">+1 r</text>
  </svg>;
}

export function SterlingGeoMapChart({ atlas, rows, ariaLabel }: { atlas:unknown; rows:Array<{state:string;id:number;engineers:number}>; ariaLabel:string }) {
  const topology=atlas as {objects:{states:never}};
  const collection=feature(atlas as never,topology.objects.states) as unknown as GeoJSON.FeatureCollection;
  const projection=geoAlbersUsa().fitSize([620,286],collection);
  const path=geoPath(projection); const valueById=new Map(rows.map(row=>[row.id,row])); const maximum=Math.max(...rows.map(row=>row.engineers));
  return <svg className="sterling-chart" viewBox="0 0 720 390" role="img" aria-label={ariaLabel}>
    <g transform="translate(50 18)">{collection.features.map((state,index)=>{const id=Number(state.id),row=valueById.get(id),value=row?.engineers??0,colorIndex=Math.min(9,Math.max(0,Math.round(value/maximum*9)));return <path key={id||index} d={path(state)??undefined} fill={sterlingSequentialColors[colorIndex]} stroke={surface} strokeWidth={sterlingVisualStyle.stroke.grid}><title>{`${row?.state??`State ${id}`}: ${(value*100).toFixed(2)}%`}</title></path>;})}</g>
    <text x="132" y="342" textAnchor="end" fill={muted} fontSize="9" fontFamily="var(--font-mono)">0%</text>{sterlingSequentialColors.map((color,index)=><rect key={color} x={142+index*40} y="330" width="40" height="14" fill={color}/>)}<text x="552" y="342" fill={muted} fontSize="9" fontFamily="var(--font-mono)">{(maximum*100).toFixed(2)}%</text>
    <text x="360" y="370" textAnchor="middle" fill={muted} fontSize="10" fontFamily="var(--font-mono)">engineers as share of population / proporción de ingenieros</text>
  </svg>;
}
