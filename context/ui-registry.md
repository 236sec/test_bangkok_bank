# UI Registry

Track every UI component built in the project. Update after each feature that adds or modifies a component.

## Purpose

This file keeps the component inventory visible — what exists, where it lives, and what patterns it uses. Before building a new component, check this registry to avoid duplication. After building one, add it here.

| Component | Path | Purpose | Patterns Used |
| --------- | ---- | ------- | ------------- |
| App (layout shell) | `src/App.tsx` | Authenticated shell: persistent left sidebar with LogoutButton pinned to bottom + scrollable main content area rendering child routes via `<Outlet />`. | MUI `Box` with flex column sidebar, `borderColor: 'divider'` (token), LogoutButton at bottom via `mt: 'auto'`, tokens via themed palette only |
| Auth0Provider | `src/auth/Auth0Provider.tsx` | Wraps app in `@auth0/auth0-react` `Auth0Provider` (PKCE, refresh tokens, localstorage cache); `onRedirectCallback` navigates to `appState.returnTo || '/profile'`; `redirect_uri` set to `${window.location.origin}/callback`. | MUI-free; React Router `useNavigate`; env via `../env` |
| AuthGuard | `src/auth/AuthGuard.tsx` | Route guard: shows `CircularProgress` while loading, calls `loginWithRedirect()` when unauthenticated, renders children when authenticated. Redirect failures surface via global `useError().showError()`. | MUI `CircularProgress` centered in `Box`; `useAuth0`; `useError` |
| LogoutButton | `src/auth/LogoutButton.tsx` | Calls `logout({ logoutParams: { returnTo: window.location.origin } })`; disabled while loading. | MUI `Button` outlined/primary |
| ProfilePage | `src/pages/ProfilePage.tsx` | Displays user identity from `GET /me` (currently `{ sub }`): avatar with initial, sub value, and full sub in mono. Wrapped in `AuthGuard`. | MUI `Card` (outlined), `Avatar` (primary bg), `Typography`; `fetchMe()` API client; mono font token `var(--font-mono)`; `useAuth0().getAccessTokenSilently()` for Bearer token |
| ErrorProvider | `src/error/ErrorContext.tsx` | Global error context: `error` state + `showError(message)` + `clearError()` via React context. | Pure context/provider — no visual components |
| ErrorSnackbar | `src/error/ErrorSnackbar.tsx` | Renders MUI `Snackbar` + `Alert severity="error" variant="filled"` when `useError().error` is set; auto-hides after 8s. | MUI `Snackbar` + `Alert`; `useError` hook; renders `null` when no error |

## Pattern Library

### Baseline — Established 2026-08-06

These patterns are extracted from the project scaffold and must be matched by every future component.

#### Color references

| Role | How to reference |
|------|-----------------|
| Primary accent | `color: 'var(--primary)'` in sx, or `theme.palette.primary.main` |
| Text — primary | `theme.palette.text.primary` or `sx={{ color: 'text.primary' }}` |
| Text — secondary | `theme.palette.text.secondary` or `sx={{ color: 'text.secondary' }}` |
| Background — page | `theme.palette.background.default` or `var(--background)` |
| Background — card | `theme.palette.background.paper` or `var(--card)` |
| Border / divider | `theme.palette.divider` or `sx={{ borderColor: 'divider' }}` |
| Destructive | `theme.palette.error.main` or `var(--destructive)` |

**Rule**: Never hardcode hex or oklch values. Always go through the MUI theme palette or CSS custom properties.

#### Border radius

| Context | Value |
|--------|-------|
| Default (shape) | `theme.shape.borderRadius` → 8px (`--radius-md`) |
| Smaller elements | Use `--radius-sm` (6px) or `--radius-xs` (4px) via sx |
| Dialogs/modals | Use `--radius-lg` (12px) |

**Rule**: Start from `theme.shape.borderRadius` (8px). Only deviate when a smaller or larger radius is semantically appropriate.

#### Typography

| Role | Font | Weight |
|------|------|--------|
| All UI text | Inter (`var(--font-sans)`) | Inherited from theme |
| Code/URLs | JetBrains Mono (`var(--font-mono)`) | 400–500 |

**Rule**: `fontFamily` comes from the theme — never hardcode a font stack. Use `fontSize="small"` (20px) for inline/nav icons, `medium` (24px) for button/header icons.

#### Spacing

| Context | Pattern |
|--------|---------|
| Sidebar width | 240px (`width: 240`) |
| Sidebar padding | `p: 2` (16px, MUI spacing unit 2) |
| Main content padding | `p: 3` (24px, MUI spacing unit 3) |
| Sidebar border | `borderRight: 1, borderColor: 'divider'` |

**Rule**: Use MUI spacing units (8px base) via the `sx` prop. Never hardcode pixel padding values when a spacing unit works.

#### Icons

| Context | Size |
|--------|------|
| Inline / nav | `fontSize="small"` (20px) |
| Buttons / headers | `fontSize="medium"` (24px) |

**Rule**: All icons from `@mui/icons-material`. Inherit `currentColor` — never set a fixed color on an icon.

#### Layout shell

| Property | Pattern |
|----------|---------|
| Root wrapper | `display: 'flex', minHeight: '100vh'` |
| Sidebar | `<Box component="nav">`, border on right edge |
| Main content | `<Box component="main">` with `<Outlet />` for route content |

**Rule**: Pages render inside `<Outlet />`. The sidebar and main layout are owned by `App.tsx` — do not recreate them in page components.

### AuthGuard (loading + gate)

File: `frontend/src/auth/AuthGuard.tsx`
Last updated: 2026-08-10

| Property | Pattern |
|----------|---------|
| Loading container | `display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh'` |
| Loading indicator | MUI `CircularProgress` (default color = primary) |
| Unauthenticated state | Calls `loginWithRedirect()` then returns `null`; failures surface via `useError().showError()` |
| Authenticated state | Renders `children` unchanged |
| Error handling | Uses global `useError` hook — redirect failures appear in `ErrorSnackbar` |

**Pattern notes:**
This is the single loading/guard pattern for the app. Every protected page uses `AuthGuard` as a wrapper — no page should reimplement its own gate logic. The centered 50vh spinner is the canonical loading state for auth. Redirect failures are surfaced through the global error system, not `console.error`.

### LogoutButton

File: `frontend/src/auth/LogoutButton.tsx`
Last updated: 2026-08-06

| Property | Pattern |
|----------|---------|
| Variant | `outlined` |
| Color | `primary` |
| Disabled state | When `isLoading` |
| Label | "Log out" |

**Pattern notes:**
Secondary/exit actions use `outlined` + `primary`. No custom sizing — uses MUI's default `medium` size. Placed at the bottom of the sidebar via `mt: 'auto'` in a flex column container. Login is handled automatically by `AuthGuard` — no separate login button exists.

### ProfilePage (user detail card)

File: `frontend/src/pages/ProfilePage.tsx`
Last updated: 2026-08-10

| Property | Pattern |
|----------|---------|
| Page width | `maxWidth: 560, mx: 'auto'` (centered, constrained) |
| Page title | `Typography variant="h4" component="h1"` with `mb: 3` |
| Detail card | MUI `Card variant="outlined"` |
| Card padding | `CardContent` with `display: 'flex', flexDirection: 'column', gap: 2` |
| Avatar size | 64×64px (`width: 64, height: 64`) |
| Avatar bg | `bgcolor: 'primary.main'`, text `color: 'primary.contrastText'` |
| Identity display | `sub` claim from `/me` response |
| Data source | `fetchMe(accessToken)` from `src/api/me.ts` — calls `GET /me` with Bearer token |
| Code/technical text | `fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'text.secondary'` |
| Card internal gap | `gap: 2` (16px via MUI spacing) between avatar row and sub section |

**Pattern notes:**
The centered 560px card layout is the canonical detail-page pattern. Every detail page (bookmark detail, collection detail) should use the same `maxWidth: 560, mx: 'auto'` wrapper and `Card variant="outlined"` container. Avatar with fallback initial is the user-avatar pattern. `var(--font-mono)` at 0.75rem is used for machine-readable text. User data comes from the backend `/me` endpoint, not from Auth0 ID token claims.

### ErrorSnackbar (global error display)

File: `frontend/src/error/ErrorSnackbar.tsx`
Last updated: 2026-08-06

| Property | Pattern |
|----------|---------|
| Container | MUI `Snackbar` with `anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}` |
| Auto-hide | `autoHideDuration={8000}` (8 seconds) |
| Dismiss | Click close button OR auto-hide timeout → calls `clearError()` |
| Alert variant | MUI `Alert severity="error" variant="filled"` with `width: '100%'` |
| Empty state | Renders `null` when error is `null` |

**Pattern notes:**
This is the single global error surface for the app. Any component can call `showError(message)` from `useError()` to surface transient errors (API failures, token expiry, network issues). Do not create ad-hoc error toasts or dialogs elsewhere — route through this component. The filled error Alert at bottom-center is the canonical error display pattern.

---

### App (layout shell)

File: `frontend/src/App.tsx`
Last updated: 2026-08-10

| Property | Value |
|----------|-------|
| Layout | Flex row, full viewport height |
| Sidebar width | 240px |
| Sidebar padding | 16px (spacing unit 2) |
| Sidebar border | 1px `divider` on right edge |
| Sidebar internal layout | `display: 'flex', flexDirection: 'column'` |
| LogoutButton position | Bottom of sidebar via `mt: 'auto'` |
| Main padding | 24px (spacing unit 3) |
| Background | Inherited from theme (`--background`) |

**Pattern notes:**
Sidebar uses flex column layout so the `LogoutButton` stays pinned to the bottom while future nav items fill the top. The flex layout and border pattern should be preserved when adding nav items.