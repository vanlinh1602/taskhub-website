# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Authenticated Taskory Hub workspace managers and administrators who configure a workspace's operational integrations.

## Product Purpose

Taskory Hub centralizes workspace operations around tasks, stories, deadlines, Discord coordination, and shared Google Drive resources. Success means a workspace can be understood and configured quickly, with clear feedback when a setting is missing or unavailable.

## Positioning

The product connects operational task and story workflows to the Discord roles, channels, and shared Drive folders the team already uses, so workspace configuration stays close to the team's working tools.

## Operating Context

Users work inside an authenticated multi-workspace web app. The workspace settings route is used when connecting a Discord guild and Google Drive resources to the Taskory Hub workflow or when maintaining those connections over time.

## Capabilities and Constraints

- The `/workspace-settings` route reads and updates workspace timezone and currency, Discord roles and channels, and Google Drive folder IDs.
- Discord roles and channels are selected from options supplied by the backend; workspace names are synced from Discord and are read-only.
- Existing API contracts, validation, i18n, light/dark themes, responsive navigation, and shadcn/ui primitives remain in scope.
- Vietnamese is the fallback language and both English and Vietnamese locale files must stay aligned.

## Brand Commitments

- The product name is Taskory Hub.
- The existing Taskory Hub logo asset remains in use.
- The existing interface uses a calm, friendly workspace visual language with mint/teal, lavender, sky, and soft neutral tokens.

## Evidence on Hand

- Product logo: `public/assets/brand/taskory-hub-logo.png`.
- Existing visual tokens: `src/index.css`.
- Current route implementation: `src/pages/WorkspaceSettings/index.tsx`.
- Workspace settings API and types: `src/features/workspace-settings/`.
- English and Vietnamese copy: `src/locales/en/workspace-settings.json` and `src/locales/vi/workspace-settings.json`.

## Product Principles

- Make workspace state legible before asking users to edit it.
- Keep integrations close to the operational workflow they support.
- Preserve familiar controls and provide a clear recovery path for every unavailable state.
- Prefer progressive disclosure over a dense wall of configuration.

## Accessibility & Inclusion

The settings surface must remain keyboard operable, responsive from mobile through desktop, readable in light and dark themes, and must not use color as the only status signal.
