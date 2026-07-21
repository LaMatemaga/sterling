# Sterling instructions for coding agents

Sterling is a React/MDX figure system for editorial data stories. A chart primitive draws data; `SterlingFigure` owns the editorial contract: hierarchy, labels, title, subtitle, inline legend, source, signature, actions, and responsive size.

Read [`README.md`](./README.md) for installation and API examples, then read [`docs/agent-workflows.md`](./docs/agent-workflows.md) before implementing a figure or an asset-export workflow.

## Ask before generating

Do not invent an analytical claim, source, category meaning, or brand choice. Before creating a new figure, ask the user for the following information when it is not already present in the task or data:

1. **Reading task:** What should the reader understand, compare, or decide?
2. **Data and provenance:** Where are the processed rows, what transformations are allowed, and what source belongs in the caption?
3. **Encoding:** Which field maps to position, category, colour, shape, or size? Is colour categorical, sequential, diverging, or neutral-with-highlight?
4. **Editorial copy:** What are the primary/secondary labels, title, subtitle, locale, and author/signature? Keep the subtitle factual; use it for an inline legend when categories are encoded.
5. **Presentation:** Which size (`compact`, `medium`, `wide`, or `full`), theme, palette, fonts, and final medium are required (web, article, social, slides, or print)?
6. **Accessibility and export:** Which redundant cues are needed, and should the processed table be downloadable as CSV?

If a question is non-blocking, state the default you will use: English, `medium`, Sterling palette, non-linking `.` title mark, localized source label, and `Made with Sterling ✦` credit. Never silently substitute an original dataset with a sample.

## Implementation rules

- Import `@lamatemaga/sterling/styles.css` once in the consuming application. Use the package root for interactive figures; use `@lamatemaga/sterling/server` only when a server-safe import is required.
- Put every visualization inside `SterlingFigure`. Supply `labelPrimary`, `labelSecondary`, `title`, `subtitle`, `source`, a meaningful `ariaLabel` on the primitive, and a responsive `size` when `medium` is not the right reading rhythm. The two labels are the figure's tags: use the first for chart type and the second for encoding or reading role (for example, `Scatterplot` / `Categorical`), never decorative hashtags.
- Keep categorical legends in the subtitle through `legend`; do not add a detached legend unless the user explicitly requests one. Do not use colour as the only categorical cue when shape, text, direct labeling, or position can reinforce it.
- Pass explicit `dataExport={{ rows, fileName }}` whenever field names or transformations need editorial care. It must describe the processed rows that produced the chart, never claim to be the untouched source file.
- Preserve the default title mark unless the user requests otherwise. Write the title without a terminal period because Sterling supplies the QED-like mark; it is non-linking by default. Configure `editorial.titleMarkHref` and `titleMarkLabel` only when it is intentionally a navigation affordance.
- Use `defineSterlingPalette` or `createTailwindSterlingPalette` for palette changes. Use CSS variables for typography. Do not hard-code one-off colours, opacity values, line widths, or fonts inside a chart primitive.
- Use `sterlingCredit({ author })` for a portable attribution. `signature={false}` is allowed only when the user explicitly asks to remove the credit.
- Keep project data, site-specific components, and private assets in the consuming project. Do not add them to Sterling itself.

## Deterministic asset workflow

For a one-off browser download, use the figure actions. For an image that will be reused in a slide deck, report, or build pipeline, create a reproducible render rather than depending on an interactive download:

1. Commit a fixture containing the exact processed rows and chart props.
2. Create a dedicated render route or component with a stable selector such as `className="deck-figure-q2"`. Fix `size`, locale, palette, editorial configuration, source, signature, and chart dimensions.
3. Load the intended fonts and use a fixed browser viewport, device scale factor, color scheme, and reduced-motion setting.
4. Capture only that selector with a version-pinned Playwright/Chromium script. Save the PNG under a predictable path and keep the fixture and render script beside it.
5. Record the source, transformation version, generation command, viewport, and package version in the slide-deck asset manifest. Regenerate the asset whenever any of those inputs changes.

The guide includes a host-app Playwright example. Do not claim byte-for-byte cross-platform equality: browser and font versions must be pinned for that level of reproducibility.

## Before opening a pull request

Run `npm run typecheck`, `npm run build`, `npm run test:consumer`, and `npm pack --dry-run`. For a new public feature, document its data contract, accessibility behavior, export behavior, and the shared visual tokens it uses.
