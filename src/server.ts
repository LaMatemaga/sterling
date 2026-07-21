/**
 * Server-safe Sterling exports.
 *
 * Use this entry in React Server Components when you only need palette helpers,
 * data utilities, static SVG primitives, or types. Interactive figure chrome
 * (copy, export, and share) intentionally lives in the package root, which is
 * a React client boundary.
 */
export * from "./SterlingLegend";
export * from "./charts";
export * from "./canonicalCharts";
export * from "./palette";
export * from "./plot";
export * from "./types";
export * from "./dataExport";
export * from "./editorial";
export * from "./tailwind";
export * from "./visualStyle";
