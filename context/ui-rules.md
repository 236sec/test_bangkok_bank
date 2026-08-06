# UI Rules

## Component Library

MUI >= v9 (`@mui/material`) on top of the Vite + React SPA. The theme is centralized in `/frontend/src/theme/` and overrides MUI defaults to reference the CSS variable tokens defined in `ui-tokens.md`. Do not import raw MUI default colors — always pull from the themed palette. Icons come from `@mui/icons-material`.

## Layout Patterns

- **Shell**: Persistent left sidebar (collections / nav links) + scrollable main content area. The sidebar is always visible on desktop; v1 is desktop-focused.
- **Sidebar Navigation**: Nav items for `/collections`, `/bookmarks`, `/all`. Active state styled via the primary accent. The sidebar belongs to the authenticated shell — unauthenticated users never see it.
- **Top Bar**: Page title + breadcrumbs where relevant, separated from content by a subtle bottom border. No global search bar in v1.
- **Cards**: Collection cards and bookmark items use the `--card` background, `--radius-md` (8px), subtle `--border` border, and generous padding. Content-first — chrome stays quiet so the link text reads clearly.
- **Modals**: Create/edit dialogs use MUI `Dialog` with `--radius-lg` (12px), a backdrop overlay, and clear primary/secondary actions.
- **Data Tables / Lists**: Bookmark lists are dense vertical lists (not heavy tables) — favicon + title + collection chip + actions. Monospace (`--font-mono`) is used for URL display so links scan easily.
- **Charts**: Not applicable in v1.

## Icons

`@mui/icons-material` — Material icons. Sizes: `fontSize="small"` (20px) for inline and nav, `medium` (24px) for buttons and headers. All icons inherit `currentColor` so they follow the surrounding text token. No third-party icon set.

## Responsive Behavior

v1 is desktop-focused. Below the `md` breakpoint the sidebar collapses to a MUI `Drawer` toggled by an app bar menu icon. No further mobile-specific layouts are in scope.

## Component Patterns

- **Forms**: Validation on blur, submit button shows a loading state while the API call is in flight, inline error messages for field errors.
- **Empty States**: Centered illustration/icon (MUI icon), a short title, a one-line description, and a primary CTA button (e.g. "Create your first collection").
- **Loading States**: MUI `Skeleton` loaders matching the card/list shapes — never spinners for content areas.
- **Error States**: MUI `Snackbar`/toast for transient errors (API failures), inline messages for form field errors.
- **Auth Guard**: Any page component that requires a user is wrapped so it redirects to the Auth0 login flow when unauthenticated; there is no "public" page beyond the login surface.