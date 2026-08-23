# Taskory Hub Website

Taskory Hub web application with Firebase authentication, React Query, i18n, theming, toast notifications, and an authenticated API client.

## Setup

1. Configure the `VITE_FIREBASE_*` variables in the applicable `.env` file with the Taskory Hub Firebase web configuration.
2. Set `VITE_BACKEND_URL` when the API is not running at `http://localhost:3000`.
3. Run `npm install` and `npm run dev`.

## Routes

- `/login` — Google authentication through Firebase.
- `/` — protected Taskory Hub dashboard.
- Any unknown route — not-found page.

## Validation

```bash
npm run lint
npm run typecheck
npm run build
```
