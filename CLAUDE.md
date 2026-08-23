## Banana Bud Website — Coding Rules

Before any code change, read these (all are `alwaysApply: true` for Cursor):

- `.cursor/rules/typescript.mdc` — TypeScript conventions and code quality
- `.cursor/rules/react.mdc` — React app architecture, antd/Tailwind, React Query, Zustand

`.cursor/rules/` is the single source of truth for coding rules in this repo. Cursor auto-attaches them via `.mdc` frontmatter; Claude and Codex load them via this file.

## Quality Gates

Husky enforces gates on git operations — run the equivalents proactively before declaring done, so commits/pushes pass first try and you don't waste a round-trip on hook failures.

| Hook       | Hook runs                                                                                                       | Run proactively                                                |
| ---------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| pre-commit | `npm run lint:staged` — eslint `--fix` on staged `src/**/*.{ts,tsx}`, prettier on staged `*.{json,md,yml,yaml}` | `npm run lint` (catches lint errors anywhere, not just staged) |
| pre-push   | `npm run typecheck` (= `tsc -b`)                                                                                | `npm run typecheck`                                            |

Why proactive: `tsc -b` and `npm run build` do **not** catch prettier or import-sort errors — only eslint does. Skipping the lint step almost always means a pre-commit failure later.

Tests (`npm test` / `vitest run`) are not in the hooks but should still pass before declaring done on any change that touches behavior.
