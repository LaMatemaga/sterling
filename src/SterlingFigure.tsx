import { isValidElement, type CSSProperties, type ReactNode } from "react";
import { SterlingInlineLegend, type SterlingLegendItem } from "./SterlingLegend";
import { SterlingFigureActions } from "./SterlingFigureActions";
import { inferSterlingDataExport, type SterlingDataExport } from "./dataExport";
import { sterlingCredit, type SterlingEditorial } from "./editorial";
import { sterlingPaletteStyle, type SterlingPalette } from "./palette";
import type { SterlingLocale } from "./types";

export type SterlingFigureSize = "compact" | "medium" | "wide" | "full";

export interface SterlingFigureProps {
  locale?: SterlingLocale;
  labelPrimary: string;
  labelSecondary: string;
  title: string;
  subtitle: ReactNode;
  legend?: SterlingLegendItem[];
  source: ReactNode;
  children: ReactNode;
  size?: SterlingFigureSize;
  className?: string;
  style?: CSSProperties;
  /** Keep Sterling by default, or replace any subset with CSS colors/variables. */
  palette?: SterlingPalette;
  /** Overrides the localized default without changing the figure structure. */
  signature?: ReactNode | false;
  sourceLabel?: ReactNode;
  /** Optional destination for the QED-like period after the title. */
  titleMarkHref?: string;
  /** Portable house-style overrides. Individual legacy props take precedence. */
  editorial?: SterlingEditorial;
  /** Processed rows used by this figure. They can be downloaded as a CSV. */
  dataExport?: SterlingDataExport;
}

export function SterlingFigure({
  locale = "en",
  labelPrimary,
  labelSecondary,
  title,
  subtitle,
  legend,
  source,
  children,
  size = "medium",
  className,
  style,
  palette,
  signature,
  sourceLabel,
  titleMarkHref,
  editorial,
  dataExport,
}: SterlingFigureProps) {
  const defaults: SterlingEditorial = { titleMark: ".", signature: sterlingCredit({}, locale) };
  const titleMark = editorial?.titleMark === undefined ? defaults.titleMark : editorial.titleMark;
  const resolvedTitleMarkHref = titleMarkHref ?? editorial?.titleMarkHref;
  const resolvedSourceLabel = sourceLabel ?? editorial?.sourceLabel ?? (locale === "es" ? "Fuente" : "Source");
  const resolvedSignature = signature ?? editorial?.signature ?? defaults.signature;
  const inferredDataExport = isValidElement(children)
    ? inferSterlingDataExport(children.props as Record<string, unknown>)
    : undefined;

  return (
    <figure
      className={["sterling-figure", className].filter(Boolean).join(" ")}
      data-size={size}
      style={{ ...sterlingPaletteStyle(palette), ...style }}
    >
      <div className="sterling-figure__inner">
        <header className="sterling-figure__header">
          <div className="sterling-figure__topline">
            <div className="sterling-figure__labels" aria-label={`${labelPrimary}, ${labelSecondary}`}>
              <span>{labelPrimary}</span>
              <span>{labelSecondary}</span>
            </div>
            <SterlingFigureActions locale={locale} title={title} dataExport={dataExport ?? inferredDataExport} />
          </div>
          <h3 className="sterling-figure__title">
            {title}
            {titleMark === false ? null : resolvedTitleMarkHref ? (
              <a
                className="sterling-figure__period"
                href={resolvedTitleMarkHref}
                aria-label={editorial?.titleMarkLabel ?? (locale === "es" ? "Ir al inicio" : "Go home")}
              >
                {titleMark}
              </a>
            ) : (
              <span className="sterling-figure__period" aria-hidden="true">{titleMark}</span>
            )}
          </h3>
          <p className="sterling-figure__subtitle">
            {subtitle}
            {legend?.length ? <SterlingInlineLegend items={legend} locale={locale} /> : null}
          </p>
        </header>

        <div className="sterling-figure__chart">{children}</div>

        <figcaption className="sterling-figure__caption">
          <span>
            <span className="sterling-figure__caption-label">{resolvedSourceLabel}:</span> {source}
          </span>
          {resolvedSignature === false ? null : <span className="sterling-figure__signature">{resolvedSignature}</span>}
        </figcaption>
      </div>
    </figure>
  );
}
