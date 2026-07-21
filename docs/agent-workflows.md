# Agent workflows for Sterling

This guide is for coding agents and teams using them to install, configure, or extend Sterling. It is intentionally procedural: use it as a checklist, not as permission to invent editorial or data decisions.

For a compact working consumer, see the [deployed smoke test](https://lamatemaga.github.io/sterling-install-smoke/) and its [source](https://github.com/LaMatemaga/sterling-install-smoke). It imports the published package rather than Sterling’s originating website.

## 1. Implement a figure in an existing site

### Gather the contract

Ask for the reading task, processed data location, source, intended locale, and final medium before choosing a chart. Then ask whether categories need a categorical palette and redundant encoding, or whether the data calls for a sequential, diverging, or neutral-with-highlight treatment.

Ask for title and subtitle copy when the author has it. If not, propose copy as a draft and label it as such. A title is a claim; write it without a terminal period because Sterling adds its QED-like mark. A subtitle explains the calculation, scope, or legend. Do not turn either into decorative filler. Treat `labelPrimary` and `labelSecondary` as concise editorial tags: chart type first, encoding or reading role second—not hashtags.

### Install and register

```bash
npm install @lamatemaga/sterling
```

```tsx
// app/layout.tsx or equivalent
import "@lamatemaga/sterling/styles.css";
```

For MDX, build the registry once in the consuming site. Project-specific wrappers own their data imports and source citations; Sterling remains portable.

```tsx
import {
  createSterlingMdxComponents,
  sterlingCredit,
} from "@lamatemaga/sterling";
import { QuarterlyRetentionFigure } from "./QuarterlyRetentionFigure";

export const mdxComponents = createSterlingMdxComponents({
  locale: "en",
  figureDefaults: {
    editorial: { titleMark: "." },
    signature: sterlingCredit({ author: "Your publication" }),
  },
  additionalComponents: { QuarterlyRetentionFigure },
});
```

### Build the wrapper

Keep the raw-to-processed transformation explicit and pass the result to both the chart and `dataExport`. If field names in a chart prop are abbreviated or nested, provide `dataExport` explicitly rather than relying on inference.

```tsx
import {
  SterlingFigure,
  SterlingScatterPlot,
  type SterlingDataExport,
} from "@lamatemaga/sterling";
import rows from "../data/quarterly-retention.json";

const exportRows: SterlingDataExport = {
  fileName: "quarterly-retention",
  rows,
};

export function QuarterlyRetentionFigure() {
  return (
    <SterlingFigure
      locale="en"
      labelPrimary="Scatterplot"
      labelSecondary="Categorical"
      title="Retention rises with the second purchase"
      subtitle="Each point is one processed cohort."
      legend={[
        { label: "new customers", colorIndex: 0, shape: "circle" },
        { label: "returning customers", colorIndex: 1, shape: "square" },
      ]}
      source="Internal cohort model, 2026 Q2"
      size="wide"
      dataExport={exportRows}
    >
      <SterlingScatterPlot
        data={rows}
        ariaLabel="Retention by purchase count"
        xLabel="Purchase count"
        yLabel="Retention rate"
        showLegend={false}
      />
    </SterlingFigure>
  );
}
```

The legend belongs in the subtitle whenever it carries categorical meaning. Keep `showLegend={false}` when `SterlingFigure` is rendering that inline legend.

## 2. Change editorial configuration, palette, or typography

Ask whether the change is global for a publication or local to one figure. Prefer global defaults for a house style; use local overrides only for a deliberate exception.

```tsx
import { defineSterlingPalette, sterlingCredit } from "@lamatemaga/sterling";

const publicationPalette = defineSterlingPalette({
  surface: {
    paper: "#fffdf8",
    plot: "#ffffff",
    text: "#18211e",
    grid: "#dae2dc",
  },
  categorical: ["#7457d6", "#168c7d", "#ba4b9b", "#cf8d18"],
});

const publicationEditorial = {
  titleMark: ".",
  titleMarkHref: "/",
  titleMarkLabel: "Back to home",
  signature: sterlingCredit({ author: "Example Studio" }),
};
```

```css
/* Load your fonts separately, then map the three Sterling roles. */
:root {
  --sterling-font-display: "Your display face", Georgia, serif;
  --sterling-font-sans: "Your sans face", system-ui, sans-serif;
  --sterling-font-mono: "Your code face", ui-monospace, monospace;
}
```

Pass `palette={publicationPalette}` and `editorial={publicationEditorial}` to a figure, or set them under `figureDefaults` in `createSterlingMdxComponents`. Use `createTailwindSterlingPalette` when a project already has Tailwind `100`–`950` scales. Do not replace a sequential or diverging scale with categorical colours merely for visual variety.

## 3. Deterministically export a slide-deck asset

The in-figure download action is ideal for an author sharing a one-off image. For build artifacts, use a deterministic host-app workflow instead.

### Make inputs stable

- Commit a fixture with the exact processed rows, source text, and chart props.
- Build a route such as `/render/quarterly-retention` that renders only the intended figure.
- Give the figure a stable selector, fixed `size`, fixed palette/editorial values, and no time-, random-, locale-, or viewport-dependent data.
- Load the exact intended fonts. Pin the host app's Node, Playwright, and browser versions.

### Capture with Playwright

Install Playwright in the **consuming application** as a development dependency, then use a script like this:

```ts
// scripts/render-quarterly-retention.mts
import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1440, height: 1100 },
  deviceScaleFactor: 2,
  colorScheme: "light",
});

await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "light" });
await page.goto("http://127.0.0.1:3000/render/quarterly-retention", {
  waitUntil: "networkidle",
});

const figure = page.locator(".deck-figure-quarterly-retention");
await figure.screenshot({ path: "public/slides/quarterly-retention@2x.png" });
await browser.close();
```

The render route should use the same explicit `dataExport.rows` as the web figure. Store a small manifest next to the image:

```json
{
  "asset": "quarterly-retention@2x.png",
  "fixture": "src/data/quarterly-retention.json",
  "source": "Internal cohort model, 2026 Q2",
  "sterling": "0.1.0",
  "viewport": "1440x1100 @2x light",
  "command": "tsx scripts/render-quarterly-retention.mts"
}
```

This produces an auditable input-to-image chain. It is deterministic inside the pinned runtime; exact pixels across operating systems still require the same browser and font binaries.

## 4. Decide when to ask again

Ask the user again before changing the analytical claim, removing a source or credit, sampling a full dataset, replacing a required redundant cue, changing an established publication-wide palette, or publishing/exporting assets outside the repository. Those are product and editorial decisions, not implementation defaults.
