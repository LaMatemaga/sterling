# Contributing to Sterling

Sterling is a shared visual language for data stories. Contributions are welcome when they make the package more useful without weakening its editorial clarity, data integrity, or accessibility.

## Before opening an issue

Describe the reading task, the proposed chart or feature, the expected data shape, and the accessibility implications. A small sketch, a reproducible dataset, or a link to a public source is especially helpful.

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
