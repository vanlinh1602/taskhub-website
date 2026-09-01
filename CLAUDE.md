## Taskory Hub Website — Coding Rules

Before any code change, read these (Cursor attaches via `.mdc` frontmatter; Claude and Codex load via this file):

- `.cursor/rules/typescript.mdc` — TypeScript conventions and code quality
- `.cursor/rules/react.mdc` — React app architecture, Tailwind, React Query, Zustand
- `.cursor/rules/state-management.mdc` — feature hooks, React Query, and Zustand state boundaries
- `.cursor/rules/ui-design.mdc` — UI design, usability, accessibility, and shadcn/ui usage
- `.cursor/rules/design.mdc` — Calm Mint Workspace visual system (UI/CSS work)

`.cursor/rules/` is the single source of truth for coding rules in this repo.

## Quality Gates

Husky enforces gates on git operations — run the equivalents proactively before declaring done, so commits/pushes pass first try and you don't waste a round-trip on hook failures.

| Hook       | Hook runs                                                                                                       | Run proactively                                                |
| ---------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| pre-commit | `npm run lint:staged` — eslint `--fix` on staged `src/**/*.{ts,tsx}`, prettier on staged `*.{json,md,yml,yaml}` | `npm run lint` (catches lint errors anywhere, not just staged) |
| pre-push   | `npm run typecheck` (= `tsc -b`)                                                                                | `npm run typecheck`                                            |

Why proactive: `tsc -b` and `npm run build` do **not** catch prettier or import-sort errors — only eslint does. Skipping the lint step almost always means a pre-commit failure later.

Tests (`npm test` / `vitest run`) are not in the hooks but should still pass before declaring done on any change that touches behavior.
