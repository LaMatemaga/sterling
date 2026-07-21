<p align="center">
  <img src="./assets/sterling-banner.png" alt="Sterling — a palette and components for data stories" width="100%" />
</p>

<p align="center">
  <a href="https://github.com/LaMatemaga/sterling/stargazers">
    <img src="https://img.shields.io/github/stars/LaMatemaga/sterling?style=for-the-badge&label=STAR%20STERLING&labelColor=120D1F&color=9A79E7" alt="Star Sterling on GitHub" />
  </a>
  <a href="./CONTRIBUTING.md">
    <img src="https://img.shields.io/badge/CONTRIBUTE-TO%20THE%20CONSTELLATION-25A08D?style=for-the-badge&labelColor=120D1F" alt="Contribute to Sterling" />
  </a>
  <a href="#work-in-progress">
    <img src="https://img.shields.io/badge/ROADMAP-OPEN%20FUTURE-B69AF2?style=for-the-badge&labelColor=120D1F" alt="Explore the Sterling roadmap" />
  </a>
</p>

# Sterling ✦

**A palette and plug-and-play React/MDX figure system for editorial data stories.**

An open-source editorial system by [La Matemaga](https://www.lamatemaga.com/sterling).

Sterling is for people who publish charts inside Markdown and do not want every post to reinvent its visual language. A single figure shell keeps hierarchy, a QED-like title mark, captions, source treatment, exports, colour grammar, and accessible chart labels consistent across an entire blog or documentation site. Chart primitives draw the data; the shell keeps the editorial contract.

The name is associated with *little star* and with the standard of precious metals: a useful metaphor for visualizations that aspire to clarity, consistency, and care.

> **Status:** pre-release extraction. The package source is ready to become independent; it has not been published to npm yet.

## What is included

- A reusable `SterlingFigure` wrapper for React and MDX.
- D3/SVG chart primitives: bars, scatterplots, lines, histograms, boxplots, violins, heatmaps, correlation matrices, lollipops, pie/donut, chord, Sankey, candlestick, radar, ridgeline, treemap, network, dendrogram, volcano, Manhattan, expression, geographic map, and more.
- A colour system with categorical, sequential, diverging, heat, and per-category sequential ramps.
- A `createTailwindSterlingPalette` helper for Tailwind-style `100`–`950` colour scales. Tailwind itself stays optional.
- MDX registration, localized English/Spanish interface copy, title/caption conventions, and inline legends.
- Image copy, PNG export, Web Share support where available, and CSV export of the **processed rows behind a figure**.

Sterling intentionally does **not** include La Matemaga’s original datasets, site pages, images, or visual examples. It is the reusable library layer only.

> **Using an AI coding agent?** Start with [`AGENTS.md`](./AGENTS.md). It gives agents an editorial/data contract, the questions to ask before generating a figure, configuration rules, and a reproducible export workflow for slide-deck assets.

## Read the story, explore the system

- [**Sterling: a palette for data with a voice of its own**](https://www.lamatemaga.com/en/blog/sterling-una-paleta-para-datos-con-voz-propia) is the construction chronicle: why the system exists, how its editorial and statistical decisions were made, and what it means to publish data stories that are shareable, traceable, and worth revisiting.
- [**The live visualization catalog**](https://www.lamatemaga.com/en/sterling#catalog) lets you explore Sterling’s current chart species in context. It is the visual reference for the system; this README remains the source for installation and implementation details.

## Installation

### When published

```bash
npm install @lamatemaga/sterling
```

### From this checkout, before publishing

```bash
npm install ../sterling
```

Sterling requires React and React DOM 18.2 or later (React 18 and 19 are supported). D3 modules, `html-to-image`, `lucide-react`, and `topojson-client` are normal package dependencies and install with Sterling. The local package's `prepare` script builds `dist` during installation; Next.js, MDX, and Tailwind are optional integrations.

Import the base styles once in your app entry point:

```tsx
import "@lamatemaga/sterling/styles.css";
```

The package root is an explicit React client boundary: use it for figures,
MDX registration, and browser actions. Static SVG primitives, palette helpers,
CSV helpers, and types are also available from the server-safe subpath:

```tsx
import { defineSterlingPalette, SterlingScatterPlot } from "@lamatemaga/sterling/server";
```

## Quick start

```tsx
import {
  SterlingBarChart,
  SterlingFigure,
  sterlingCredit,
  type SterlingDataExport,
} from "@lamatemaga/sterling";

const rows = [
  { treatment: "A", mean: 14.5 },
  { treatment: "B", mean: 15.3 },
  { treatment: "C", mean: 2.1 },
];

export function TreatmentMeans() {
  return (
    <SterlingFigure
      labelPrimary="Bars"
      labelSecondary="Categorical"
      title="Treatment means at a glance"
      subtitle="Means calculated from the complete processed dataset."
      source="Your published source"
      size="wide"
      signature={sterlingCredit({ author: "Your name" })}
      dataExport={{ rows, fileName: "treatment-means" } satisfies SterlingDataExport}
    >
      <SterlingBarChart
        data={rows.map(({ treatment, mean }) => ({ label: treatment, value: mean }))}
        ariaLabel="Mean value by treatment"
      />
    </SterlingFigure>
  );
}
```

`size` is optional and defaults to `medium`. Use `compact`, `medium`, `wide`, or `full`. Every figure also accepts `palette`, `editorial`, `signature`, `sourceLabel`, `titleMarkHref`, `className`, and `style`; omitted fields keep Sterling’s defaults.

## Use with MDX

Register the components once. Dataset-backed wrapper components stay in your own project, which lets your data and source citations live wherever your publishing workflow needs them.

```tsx
import { createSterlingMdxComponents, sterlingCredit } from "@lamatemaga/sterling";
import { IrisScatterFigure } from "./IrisScatterFigure";

export const mdxComponents = createSterlingMdxComponents({
  locale: "en",
  figureDefaults: {
    editorial: { titleMark: "." },
    signature: sterlingCredit({ author: "Ada Lovelace" }),
  },
  additionalComponents: { IrisScatterFigure },
});
```

Then use it in an `.mdx` file:

```mdx
<IrisScatterFigure />
```

## Editorial configuration

Sterling’s defaults are intentionally portable:

- The title gets a non-linking `.` by default; it can be removed or linked.
- The default caption credit is a link to [Sterling](https://www.lamatemaga.com/sterling): `Made with Sterling ✦`.
- Set the credit to your own author with `sterlingCredit({ author: "Your name" })`, which becomes `Made by Your name with Sterling ✦`.
- Consumers may remove or replace the credit entirely. The link is a useful attribution default, not a lock-in.

```tsx
<SterlingFigure
  // Everything below is optional.
  editorial={{
    titleMark: "∎",
    titleMarkHref: "/",
    titleMarkLabel: "Back to home",
    sourceLabel: "Data source",
  }}
  signature={false}
  {...figureProps}
/>
```

To preserve the original La Matemaga treatment, set your own `signature` and `editorial` in the consuming site; the library contains no site-specific branding.

## Themes, typography, and palette

Sterling starts in light mode. Add `data-sterling-theme="dark"` or `.sterling-theme-dark` on an ancestor for its dark surface. The package uses local CSS variables, so it does not change your site’s global theme.

```tsx
<main data-sterling-theme="dark">
  <TreatmentMeans />
</main>
```

The base stylesheet stays neutral and inherits your publication's type system.
For Sterling's complete editorial treatment, import the optional stylesheet after
the base one. It bundles Fraunces SemiBold and JetBrains Mono under their OFL
licenses; see [`assets/fonts/NOTICE.md`](./assets/fonts/NOTICE.md).

```tsx
import "@lamatemaga/sterling/styles.css";
import "@lamatemaga/sterling/editorial.css";
```

Or load your own display, sans, and mono fonts, then map them:

```css
:root {
  --sterling-font-display: "Fraunces", Georgia, serif;
  --sterling-font-sans: "Inter", system-ui, sans-serif;
  --sterling-font-mono: "JetBrains Mono", ui-monospace, monospace;
}
```

### Palette contract

Pass `palette` to a figure to override only the parts you need. `defineSterlingPalette` preserves literal values and provides TypeScript autocomplete.

### Colour-vision accessibility

Sterling includes colour-vision-tested categorical subsets; it is deliberately not presented as a universally safe eight-colour palette. The full default palette passes simulations for **protanomaly, deuteranomaly, tritanomaly, and achromatomaly**. For simulated full dichromacy, use the validated reduced subsets: six colours for protanopia, and seven colours for deuteranopia or tritanopia. Achromatopsia is the most restrictive case and requires a validated four-colour subset.

These limits are part of the reading contract, not an afterthought. When categories carry meaning, pair colour with a clear inline legend, labels, shape, position, or another redundant cue. If your audience includes people with a specific colour-vision deficiency, select and test the appropriate subset rather than assuming that any arbitrary selection of Sterling colours will remain distinguishable.

```tsx
import { defineSterlingPalette } from "@lamatemaga/sterling";

const studioPalette = defineSterlingPalette({
  surface: { paper: "#fffdf8", plot: "#fff", text: "#18211e", grid: "#dae2dc" },
  categorical: ["#7c3aed", "#0f766e", "#db2777", "#d97706"],
  legend: ["#5b21b6", "#115e59", "#9d174d", "#92400e"],
});

<SterlingFigure palette={studioPalette} {...figureProps} />
```

### Tailwind scales (100–950)

Use Tailwind’s colour objects without adding Tailwind as a Sterling runtime dependency. Categorical `500` values become marks, `700` values become inline-legend text, `100`–`950` become sequential/diverging/heat stops, and `200`–`800` become per-category ramps.

```tsx
import { amber, blue, fuchsia, lime, rose, slate, teal, violet } from "tailwindcss/colors";
import { createTailwindSterlingPalette } from "@lamatemaga/sterling";

const tailwindPalette = createTailwindSterlingPalette({
  categorical: [violet, teal, fuchsia, amber, blue, rose, lime, slate],
  divergent: teal,
  heat: amber,
  surface: {
    paper: slate[50], plot: "#ffffff", plotAlt: slate[100], text: slate[950],
    muted: slate[600], grid: slate[200], edge: slate[300], period: violet[600],
  },
});
```

The helper is deliberately a starting point: choose a divergent scale for values around a meaningful midpoint, a sequential scale for ordered magnitude, and a categorical palette only for distinct groups. For an otherwise neutral visualization with one highlighted region, pass a neutral surface/series palette and a deliberate `color` on the selected mark or wrapper component.

## Data, exports, and accessibility

Provide `dataExport={{ rows }}` with the **exact processed data** rendered by the figure. Sterling turns those rows into a UTF-8 CSV from its action menu; it does not pretend to redistribute an original source dataset. This makes the summarized table inspectable without asking readers to reverse-engineer pixels.

Every primitive requires an `ariaLabel`. Keep source text in the figure caption, use legends in the subtitle for categorical colour/shape encodings, and retain meaningful field names in `dataExport` whenever possible.

The top-right controls intentionally remain compact:

- **Copy image** is always visible.
- **Export or share** opens PNG download, processed CSV download, and native system sharing on compatible devices.

## Updating Sterling

When installed from npm:

```bash
npm update @lamatemaga/sterling
```

For intentional major-version updates:

```bash
npm install @lamatemaga/sterling@latest
```

When installed from a local checkout, pull the desired commit in the Sterling folder, run `npm install` there, and reinstall the local path in the consuming app. `prepare` rebuilds the package automatically:

```bash
git pull
npm install
cd ../your-site
npm install ../sterling
```

Read the release notes before upgrading a major version. Keep the stylesheet import in place; a package update does not add it automatically.

## Development

```bash
npm install
npm run typecheck
npm run build
npm run test:consumer
npm pack --dry-run
```

The public client entry point is `src/index.ts`; `src/server.ts` exposes the
server-safe static API. Do not import internal source files from applications.
Keep all chart geometry inside primitives, and keep editorial decisions in
`SterlingFigure` or your own wrapper. A change to shared tokens should make all
affected chart types more consistent, not merely improve one example.

## Work in progress

Sterling is designed to grow in the open. Contributions are welcome, especially when they preserve the package’s editorial grammar and data integrity.

- Additional chart primitives and small-multiple/composition layouts.
- A first-class scale selector: categorical, sequential, diverging, and neutral-with-highlight modes.
- A neutral-scale/highlight API for calling out an interval, region, or observation without turning the entire chart categorical.
- More accessible descriptions, keyboard affordances, and export test coverage.
- A visual regression suite for light, dark, and print surfaces, beginning with five high-risk specimens (violin, correlogram, heatmap, scatterplot, and exported figure) across the three modes.
- Framework adapters and downloadable palette artifacts for R, Python, Julia, and other visualization ecosystems. These are explicitly **future work**, not part of this initial package.

Use the [feature request form](https://github.com/LaMatemaga/sterling/issues/new?template=feature-request.yml) to propose a component or capability. Bring the reading task, a public or synthetic data shape, accessibility considerations, and success criteria; a sketch or reference is welcome. For a pull request, keep the data transformation explicit, add a focused fixture, maintain the shared opacity/outline tokens, and document any new public prop. See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full guide.

## Community and security

- Read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening a pull request.
- Use the [feature request form](https://github.com/LaMatemaga/sterling/issues/new?template=feature-request.yml) for a component or capability, or the [bug report form](https://github.com/LaMatemaga/sterling/issues/new?template=bug-report.yml) for reproducible behavior that differs from the documented contract.
- Contributions follow the [Code of Conduct](./CODE_OF_CONDUCT.md).
- Report vulnerabilities through [private vulnerability reporting](https://github.com/LaMatemaga/sterling/security/advisories/new), not in a public issue. See [SECURITY.md](./SECURITY.md).

## License

Sterling is licensed under the [MIT License](./LICENSE).
Release history follows [Semantic Versioning](https://semver.org/) in the
[changelog](./CHANGELOG.md).

## Credits

Sterling was conceived, art-directed, and reviewed by **La Matemaga**. Product, brand, and data-visualization decisions remained under that direction throughout implementation.

- **OpenAI Codex:** GPT-5.6 Sol High was the principal implementation collaborator through the core-system build; GPT-5.6 Terra High carried final fidelity corrections, open-source extraction, package hardening, and release verification. Both worked under La Matemaga's product, art direction, and review.
- **Anthropic Claude:** Opus 4.8 for a data-visualization correctness pass—auditing the component set against the v1.5 reference, using R/ggplot2 as the verification oracle, building the shared D3 axis foundation, and porting the clustered expression matrix from the original implementation. It was used after Fable blocked work involving bioinformatics charts. Directed and reviewed by La Matemaga.
- **R:** transformed source datasets into JSON and served as the verification oracle. Canonical ggplot2 renders were compared with the React implementation to validate distributions, outliers, palette ramps, and scales.
- **Skills/methods:** `design-taste-frontend` (editorial anti-slop interface discipline) and `visualize` (data visualization exploration).
- **Product demo video:** a Full HD 16:9 Sterling demo was produced in Cursor with Remotion. It uses live Sterling figures and source data—not mock charts—to move from the article and embedded legends through MDX installation, responsive figure sizing, exports and sharing, theme comparison, and the portfolio visualization catalog. Its production used `appshot-videos` for the Remotion/Appshot workflow, `frontend-design` for typography and visual QA, and `hallmark` for editorial-composition review and anti-slop cleanup. The main implementation/design agent was GPT-5.6 Terra; no model-specific subagents were run.

The original site and live system are documented at [lamatemaga.com/sterling](https://www.lamatemaga.com/sterling).

### How Codex was used

Codex was used as an implementation collaborator under La Matemaga's product, art-direction, and data-visualization review—not as a substitute for those decisions.

**GPT-5.6 Sol High — core system build.** Sol was the principal Codex implementation collaborator for the work that turned the v1.5 field tests into a working editorial system. Under La Matemaga’s direction, it helped establish reusable visual tokens and figure contracts; build the shared React/MDX figure shell; and integrate the palette, chart primitives, localized interface copy, inline legends, source and caption treatment, responsive editorial widths, and export interactions. It also supported the live Sterling article, portfolio feature, and visualization catalog that made the system inspectable in context. The important architectural result was that a correction to hierarchy, captioning, palette, or interaction could propagate across every installed figure rather than being redone chart by chart.

**GPT-5.6 Terra High — fidelity, extraction, and release hardening.** Terra handled the exacting last mile: preserving the site’s editorial typography and light/dark behavior; unifying opacity and outline decisions while retaining semantic exceptions such as the violin’s interquartile interval; refining portable component APIs and their documentation; and separating Sterling from the La Matemaga website into an installable package. It defined the public client/server entry points, stylesheet and font boundary, configurable palette and attribution helpers, Tailwind-scale helper, consumer smoke test, package build, and publishable tarball verification. This was not cosmetic cleanup: it made the system safer to adopt in another Markdown/React site without inheriting the originating website’s code or branding.

All generated work was directed and reviewed by La Matemaga. R/ggplot2 checks, comparison against the v1.5 reference, and visual review of the live site were used to validate the resulting implementation.
