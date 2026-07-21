# Contributing to Sterling

Sterling is a shared visual language for data stories. Contributions are welcome when they make the package more useful without weakening its editorial clarity, data integrity, or accessibility.

## Request a component or feature

Use the [feature request form](https://github.com/LaMatemaga/sterling/issues/new?template=feature-request.yml) for a new chart primitive, figure behavior, export, palette option, or documentation improvement. You do not need to propose an implementation. The most useful requests explain the problem that a reader or author is trying to solve.

Please include:

1. **Reading task:** the question, comparison, distribution, relationship, or workflow the addition should make easier.
2. **Proposed scope:** whether this is a new visualization, an improvement to an existing primitive, a figure-shell feature, an export, or a palette/configuration option.
3. **Data contract:** a small public or synthetic example, the expected row/object shape, and any transformation needed before the component receives it. Never attach private data.
4. **Editorial and accessibility considerations:** labels, source treatment, the role of colour, alternative cues, and the light/dark/print behavior that matters.
5. **Success criteria:** what someone should be able to read, publish, export, or verify once the feature exists.

A sketch, reference image, reproducible dataset, or link to a public source is especially helpful. The [live visualization catalog](https://www.lamatemaga.com/en/sterling#catalog) is the best place to check whether a similar primitive already exists.

## Development

```bash
npm install
npm run typecheck
npm run build
npm run test:consumer
npm pack --dry-run
```

Please work from the public client API in `src/index.ts` and the static,
server-safe API in `src/server.ts`. Do not add La Matemaga site data, private
assets, or site-specific components to this package.

## Pull requests

For a new primitive or public option:

1. Keep transformations explicit and preserve the processed data used for CSV export.
2. Supply an accessible `ariaLabel` and document the data contract.
3. Reuse Sterling's palette, opacity, line-width, and figure-shell tokens instead of adding one-off visual rules.
4. Do not rely on colour as the sole categorical cue; use labels, shape, position, or another redundant encoding when appropriate.
5. Update the README when installation, configuration, or public behavior changes.

Be kind, specific, and curious in issues and reviews. The goal is a system that makes careful visual storytelling easier for everyone.
