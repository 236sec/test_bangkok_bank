# UI Registry

Track every UI component built in the project. Update after each feature that adds or modifies a component.

## Purpose

This file keeps the component inventory visible — what exists, where it lives, and what patterns it uses. Before building a new component, check this registry to avoid duplication. After building one, add it here.

| Component | Path | Purpose | Patterns Used |
| --------- | ---- | ------- | ------------- |
| App (layout shell) | `src/App.tsx` | Authenticated shell: persistent left sidebar with LogoutButton pinned to bottom + scrollable main content area rendering child routes via `<Outlet />`. | MUI `Box` with flex column sidebar, `borderColor: 'divider'` (token), LogoutButton at bottom via `mt: 'auto'`, tokens via themed palette only |
| Auth0Provider | `src/auth/Auth0Provider.tsx` | Wraps app in `@auth0/auth0-react` `Auth0Provider` (PKCE, refresh tokens, localstorage cache); `onRedirectCallback` navigates to `appState.returnTo || '/profile'`; `redirect_uri` set to `${window.location.origin}/callback`. | MUI-free; React Router `useNavigate`; env via `../env` |
| AuthGuard | `src/auth/AuthGuard.tsx` | Route guard: shows `CircularProgress` while loading, calls `loginWithRedirect()` when unauthenticated, renders children when authenticated. Redirect failures surface via global `useError().showError()`. | MUI `CircularProgress` centered in `Box`; `useAuth0`; `useError` |
| useAccessToken | `src/auth/useAccessToken.ts` | Hook wrapping `useAuth0().getAccessTokenSilently()` with global error handling. Returns a stable `getToken()` callback. On failure, surfaces "Your session has expired" via `ErrorSnackbar` and re-throws. | `useAuth0`; `useError`; `useCallback` |
| LogoutButton | `src/auth/LogoutButton.tsx` | Calls `logout({ logoutParams: { returnTo: window.location.origin } })`; disabled while loading. | MUI `Button` outlined/primary |
| ProfilePage | `src/pages/ProfilePage.tsx` | Displays user identity from `GET /me` (currently `{ sub }`): avatar with initial, sub value, and full sub in mono. Wrapped in `AuthGuard`. | MUI `Card` (outlined), `Avatar` (primary bg), `Typography`; `fetchMe()` API client; mono font token `var(--font-mono)`; `useAccessToken()` for Bearer token |
| ErrorProvider | `src/error/ErrorContext.tsx` | Global error context: `error` state + `showError(message)` + `clearError()` via React context. | Pure context/provider — no visual components |
| ErrorSnackbar | `src/error/ErrorSnackbar.tsx` | Renders MUI `Snackbar` + `Alert severity="error" variant="filled"` when `useError().error` is set; auto-hides after 8s. | MUI `Snackbar` + `Alert`; `useError` hook; renders `null` when no error |
| Collections API | `src/api/collections.ts` | API client for collections: fetchCollections (with query params), fetchCollection, create/update/patch/deleteCollection — all Bearer token auth. | Plain `fetch`, `env.VITE_API_URL`, `Authorization: Bearer` pattern (same as `me.ts`) |
| CollectionCard | `src/components/collections/CollectionCard.tsx` | Card showing collection name, bookmark count, edit/delete actions. Click navigates to detail. | MUI `Card variant="outlined"`, `CardActionArea`, `IconButton` with `EditIcon`/`DeleteIcon color="error"`, `stopPropagation` on actions |
| CollectionDialog | `src/components/collections/CollectionDialog.tsx` | Reusable dialog for create AND edit modes. Auto-focused text field, validation on blur, loading state. | MUI `Dialog` with `--radius-lg` (12px), `TextField autoFocus`, `Button variant="contained"` primary, `TransitionProps.onEntered` for state reset (avoid setState-in-effect) |
| DeleteCollectionDialog | `src/components/collections/DeleteCollectionDialog.tsx` | Confirmation dialog before deleting a collection. Shows collection name in warning. | MUI `Dialog` with `--radius-lg`, `DialogContentText`, `Button color="error"` for destructive action, `TransitionProps.onEntered` for state reset |
| CollectionList | `src/components/collections/CollectionList.tsx` | Simple vertical list wrapper rendering `CollectionCard` for each collection. | MUI `Box` flex column with `gap: 1.5` |
| CollectionsPage | `src/pages/CollectionsPage.tsx` | Full collections list page: search (300ms debounce), sort (Newest/Oldest/A–Z/Z–A), skeleton loaders, empty state with FolderOpenIcon, create/edit/delete dialogs. Wrapped in `AuthGuard`. | MUI `maxWidth: 560, mx: 'auto'`, `Typography h4`, `Skeleton variant="rounded"`, `Select` for sort, `FolderOpenIcon` 64px empty state, `SearchIcon` input adornment, `AddIcon` button |
| CollectionDetailPage | `src/pages/CollectionDetailPage.tsx` | Single collection detail at `/collections/:id`: name, bookmark count, created/updated timestamps, back link. Skeleton loader. Wrapped in `AuthGuard`. | MUI `maxWidth: 560, mx: 'auto'`, `Typography h4`, `Card variant="outlined"`, `Button component={Link}` back navigation, `Skeleton variant="text"` loader |
| CollectionAccordion | `src/components/all/CollectionAccordion.tsx` | One collapsible `Accordion` per collection on `/all`: header shows name + bookmark count + edit/delete (non-toggling), lazy-loads bookmarks on first expand, caches across collapse/re-expand, refetches on `refreshKey`/`bookmarkSort` change while loaded. | MUI `Accordion`/`AccordionSummary`/`AccordionDetails`, `stopPropagation` header actions, `BookmarkList showCollectionChip={false}`, `Skeleton` rounded, empty state with `BookmarkAddIcon`, `useAccessToken` + `useError` |
| AllPage | `src/pages/AllPage.tsx` | `/all` page: collections as accordions with nested bookmarks, collection + bookmark sort selects, New Collection / New Bookmark buttons, all four dialogs, `refreshKey` coordination after every mutation. | `maxWidth: 560, mx: 'auto'`, `Typography h4`, two `FormControl`/`Select` sorts, `FolderOpenIcon` empty state, `CollectionAccordion` list, dialog state via separate booleans |

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

---

### CollectionsPage (list + search + dialogs)

File: `frontend/src/pages/CollectionsPage.tsx`
Last updated: 2026-08-10

| Property | Pattern |
|----------|---------|
| Page width | `maxWidth: 560, mx: 'auto'` (centered, constrained) |
| Page title | `Typography variant="h4" component="h1"` with `mb: 3` |
| Search input | MUI `TextField size="small"` with `SearchIcon` `InputAdornment`, `placeholder="Search collections…"` |
| Sort control | MUI `FormControl size="small"` + `Select` + `InputLabel` with 4 options (Newest/Oldest/A–Z/Z–A) |
| Create button | MUI `Button variant="contained"` with `AddIcon startIcon` |
| Loading state | 3× MUI `Skeleton variant="rounded" height={72}` in flex column with `gap: 1.5` |
| Empty state | Centered `FolderOpenIcon fontSize={64} color="text.secondary"` + "No collections yet" title + "Create your first collection" CTA |
| Card list | `CollectionList` vertical flex column with `gap: 1.5` |
| Card click | `useNavigate()` → `/collections/:id` |
| Search debounce | 300ms via `useRef<setTimeout>` + cleanup |
| API errors | Surfaced via `useError().showError()` |
| Auth | Page wrapped in `<AuthGuard>` |

**Pattern notes:**
This is the canonical list-page pattern. Every list page (BookmarksPage, AllPage) should follow the same structure: search bar + sort + create button on top, skeleton loaders while fetching, empty state when no data, card-based list with edit/delete actions, and dialogs for create/edit/delete. Use 300ms debounce for search. Centered 560px layout matches ProfilePage. Follow the `useAccessToken()` → API client → setState pattern. Dialog state management uses separate boolean/collection state variables (not a single "active" state). Use `TransitionProps.onEntered` for dialog form reset instead of `useEffect` with setState (React 19 compiler compatibility).

### CollectionCard

File: `frontend/src/components/collections/CollectionCard.tsx`
Last updated: 2026-08-10

| Property | Pattern |
|----------|---------|
| Container | MUI `Card variant="outlined"` with `CardActionArea` for click |
| Layout | `CardContent` with `display: 'flex', alignItems: 'center', justifyContent: 'space-between'` |
| Name | `Typography variant="h6"` |
| Bookmark count | `Typography variant="body2" color="text.secondary"` — `${count} bookmark(s)` |
| Edit action | MUI `IconButton size="small"` + `EditIcon fontSize="small"`, `aria-label="Edit collection"` |
| Delete action | MUI `IconButton size="small"` + `DeleteIcon fontSize="small"` `color="error"`, `aria-label="Delete collection"` |
| Action click | `e.stopPropagation()` to prevent card click |
| Missing count | `_count?.bookmarks ?? 0` — displays "0 bookmarks" gracefully |

**Pattern notes:**
`CardActionArea` makes the entire card clickable. Edit/delete buttons use `stopPropagation` so they don't trigger the card navigation. Icons are `fontSize="small"` (20px) for inline use. Destructive actions use `color="error"` (maps to `var(--destructive)`). Always handle `_count` being undefined.

### CollectionDialog (create/edit modal)

File: `frontend/src/components/collections/CollectionDialog.tsx`
Last updated: 2026-08-10

| Property | Pattern |
|----------|---------|
| Container | MUI `Dialog maxWidth="xs" fullWidth` with `slotProps.paper.sx={{ borderRadius: 'var(--radius-lg)' }}` |
| Title | Create: "New Collection", Edit: "Edit Collection" |
| Field | MUI `TextField autoFocus fullWidth label="Collection name"` |
| Actions | "Cancel" (`Button`) + "Create"/"Save" (`Button variant="contained"`) |
| Primary disabled | Name empty OR (edit mode) name unchanged from initial value OR submitting |
| Submit on Enter | `htmlInput.onKeyDown` handler for Enter key |
| Loading state | Primary button disabled while submitting; Cancel also disabled |
| State reset | `TransitionProps.onEntered` callback resets name + isSubmitting |
| Close guard | `onClose` disabled (undefined) while submitting |
| Error handling | Throws are caught, isSubmitting reset — parent surfaces via `useError().showError()` |
| Type-safe props | Discriminated union: `CreateModeProps` (onCreate) vs `EditModeProps` (onSave + collection) |

**Pattern notes:**
This is the canonical modal pattern for the app. Every create/edit dialog should follow this structure: discriminated union for mode-specific props, `TransitionProps.onEntered` for state reset (NOT useEffect setState — React 19 compiler lint), primary button disabled logic, Enter key submit, close prevention while submitting. `--radius-lg` (12px) is the canonical dialog border radius.

### DeleteCollectionDialog (confirmation modal)

File: `frontend/src/components/collections/DeleteCollectionDialog.tsx`
Last updated: 2026-08-10

| Property | Pattern |
|----------|---------|
| Container | MUI `Dialog maxWidth="xs" fullWidth` with `--radius-lg` |
| Title | "Delete collection?" |
| Content | `DialogContentText` with collection name interpolated in warning message |
| Actions | "Cancel" (`Button`) + "Delete" (`Button variant="contained" color="error"`) |
| Loading state | Both buttons disabled while deleting |
| Close guard | `onClose` disabled while deleting |
| State reset | `TransitionProps.onEntered` resets isDeleting |

**Pattern notes:**
This is the canonical delete confirmation pattern. Every delete dialog should: show the item name in the warning message, use `color="error"` for the destructive button, disable close while the delete is in progress, and reset state on dialog enter. The parent should handle optimistic removal + restore on error via `useError().showError()`.

### CollectionDetailPage (detail view)

File: `frontend/src/pages/CollectionDetailPage.tsx`
Last updated: 2026-08-10

| Property | Pattern |
|----------|---------|
| Page width | `maxWidth: 560, mx: 'auto'` (matches ProfilePage) |
| Back link | MUI `Button component={Link} to="/collections" startIcon={<ArrowBackIcon />}` with `mb: 2` |
| Title | `Typography variant="h4" component="h1"` with `mb: 3` |
| Detail card | MUI `Card variant="outlined"` with `CardContent` flex column `gap: 1.5` |
| Bookmark count | `Typography variant="body1" color="text.secondary"` — `${count} bookmark(s)` |
| Timestamps | "Created" / "Last updated" labels in `variant="body2" color="text.secondary"` + values in `variant="body1"` |
| Loading state | `Skeleton variant="text"` inside a `Card variant="outlined"` — 4 lines matching content shape |
| Token | `useAccessToken()` → `fetchCollection()` |
| Error | `useError().showError()` on fetch failure |
| Auth | Page wrapped in `<AuthGuard>` |

**Pattern notes:**
This is the canonical detail-page pattern (alongside ProfilePage). Every detail page should use the centered 560px layout, back-link button with `ArrowBackIcon`, `Card variant="outlined"` for detail content, skeleton card while loading, and `useError().showError()` for fetch failures.

---

### Bookmarks API (Phase 3.2)

File: `frontend/src/api/bookmarks.ts`
Last updated: 2026-08-11

| Property | Pattern |
|----------|---------|
| Auth | `Authorization: Bearer ${accessToken}` header (first arg), same as collections API |
| Query params | `new URL()` + `searchParams.set()` for title, url, sortBy, sortOrder |
| Error messaging | `/${endpoint}/${id} returned ${status}` pattern |
| Return types | `Promise<Bookmark[]>` / `Promise<Bookmark>` / `Promise<void>` (204 delete) |
| Functions | fetchBookmarks, fetchBookmark, createBookmark, updateBookmark, patchBookmark, deleteBookmark, fetchCollectionBookmarks |

---

### BookmarkCard (Phase 3.2)

File: `frontend/src/components/bookmarks/BookmarkCard.tsx`
Last updated: 2026-08-13

| Property | Pattern |
|----------|---------|
| Container | MUI `Card variant="outlined"` with `CardActionArea` for click |
| Layout | `CardContent` with `display: 'flex', alignItems: 'center', justifyContent: 'space-between'` |
| Favicon | `<img>` 24×24px `borderRadius: 'var(--radius-xs)'` when favicon URL exists |
| Favicon fallback | `LanguageIcon fontSize={24} color="text.secondary"` when favicon is null |
| Title | `Typography variant="subtitle1"` with ellipsis overflow `whiteSpace: 'nowrap'` |
| URL | `Typography variant="body2" color="text.secondary" fontFamily: 'var(--font-mono)'` truncated to 50 chars |
| Collection chip | `Chip size="small"` shown only when `collection` is set AND `showCollectionChip` (default `true`) |
| Edit action | `IconButton size="small"` + `EditIcon fontSize="small"` `aria-label="Edit bookmark"` |
| Delete action | `IconButton size="small"` + `DeleteIcon fontSize="small" color="error"` `aria-label="Delete bookmark"` |
| Action click | `e.stopPropagation()` to prevent card click |

---

### BookmarkDialog (Phase 3.2)

File: `frontend/src/components/bookmarks/BookmarkDialog.tsx`
Last updated: 2026-08-11

| Property | Pattern |
|----------|---------|
| Container | MUI `Dialog maxWidth="sm" fullWidth` with `slotProps.paper.sx={{ borderRadius: 'var(--radius-lg)' }}` |
| Title | Create: "New Bookmark", Edit: "Edit Bookmark" |
| Fields | URL (`TextField autoFocus`), Title, Notes (multiline maxRows=3), Collection (`Autocomplete` single-select) |
| Validation | URL: valid URL check on blur, Title: max 200 chars, Notes: max 500 chars |
| Collection loader | Fetches via `fetchCollections()` on open, shows "None" option |
| Primary disabled | URL empty or invalid (create), URL/title empty or unchanged (edit), submitting |
| State reset | `TransitionProps.onEntered` resets all fields + errors + isSubmitting |
| Type-safe props | Discriminated union: `CreateModeProps` (onCreate) vs `EditModeProps` (onSave + bookmark) |

---

### DeleteBookmarkDialog (Phase 3.2)

File: `frontend/src/components/bookmarks/DeleteBookmarkDialog.tsx`
Last updated: 2026-08-11

| Property | Pattern |
|----------|---------|
| Container | MUI `Dialog maxWidth="xs" fullWidth` with `--radius-lg` |
| Title | "Delete bookmark?" |
| Content | `DialogContentText` with bookmark title interpolated in warning |
| Actions | "Cancel" (`Button`) + "Delete" (`Button variant="contained" color="error"`) |
| Loading state | Both buttons disabled while deleting |
| Close guard | `onClose` disabled while deleting |
| State reset | `TransitionProps.onEntered` resets isDeleting |

---

### BookmarkList (Phase 3.2)

File: `frontend/src/components/bookmarks/BookmarkList.tsx`
Last updated: 2026-08-13

| Property | Pattern |
|----------|---------|
| Container | MUI `Box` flex column with `gap: 1.5` |
| Items | Maps `bookmarks` array to `BookmarkCard` with edit/delete/click callbacks; forwards `showCollectionChip` (default `true`) |

---

### BookmarksPage (Phase 3.2)

File: `frontend/src/pages/BookmarksPage.tsx`
Last updated: 2026-08-11

| Property | Pattern |
|----------|---------|
| Page width | `maxWidth: 560, mx: 'auto'` (matches CollectionsPage) |
| Page title | `Typography variant="h4" component="h1"` with `mb: 3` |
| Search inputs | Two `TextField size="small"` — "Search by title…" and "Search by URL…" — each with `SearchIcon` adornment |
| Sort control | `FormControl size="small"` + `Select` with 4 options (Newest/Oldest/A–Z/Z–A) |
| Create button | `Button variant="contained"` with `AddIcon startIcon` — "New Bookmark" |
| Loading state | 3× `Skeleton variant="rounded" height={72}` in flex column with `gap: 1.5` |
| Empty state | `BookmarkAddIcon fontSize={64} color="text.secondary"` + "No bookmarks yet" + "Save your first link" CTA |
| No results state | `SearchOffIcon fontSize={64}` + "No bookmarks found" message |
| Search debounce | 300ms per-field via `useRef<setTimeout>` + cleanup |
| Delete | Optimistic: filters from state array, reloads on error |
| Auth | Page wrapped in `<AuthGuard>` |

---

### BookmarkDetailPage (Phase 3.2)

File: `frontend/src/pages/BookmarkDetailPage.tsx`
Last updated: 2026-08-11

| Property | Pattern |
|----------|---------|
| Page width | `maxWidth: 560, mx: 'auto'` (matches ProfilePage/CollectionDetailPage) |
| Back link | `Button component={Link} to="/bookmarks" startIcon={<ArrowBackIcon />}` with `mb: 2` |
| Detail card | `Card variant="outlined"` with `CardContent` flex column `gap: 1.5` |
| Favicon | `<img>` 32×32px `--radius-xs` or `LanguageIcon fontSize={32}` fallback |
| URL link | `Typography variant="body2" component="a"` mono font, `target="_blank"`, `OpenInNewIcon` |
| Notes | Conditional: only renders when `bookmark.notes` is non-null |
| Collection chip | `Chip component={Link} to={/collections/:id}` clickable, only when assigned |
| Edit/Delete buttons | `Button variant="outlined"` (Edit) / `color="error"` (Delete) below card |
| 404 state | "Bookmark not found" with explanation |
| Loading state | `Skeleton variant="text"` inside `Card variant="outlined"` — 5 lines |
| Auth | Page wrapped in `<AuthGuard>` |
---

### CollectionAccordion (Phase 4)

File: `frontend/src/components/all/CollectionAccordion.tsx`
Last updated: 2026-08-13

| Property | Pattern |
|----------|---------|
| Container | MUI `Accordion` (controlled `expanded` + `onChange`) |
| Header | `AccordionSummary expandIcon={<ExpandMoreIcon />}` with name (`variant="subtitle1"`), count (`variant="body2" color="text.secondary"`, `${_count?.bookmarks ?? 0} bookmarks`), edit/delete `IconButton size="small"` |
| Header actions | `e.stopPropagation()` in the `IconButton` onClick — clicking them must NOT toggle the panel |
| Edit icon | `IconButton size="small"` + `EditIcon fontSize="small"`, `aria-label="Edit collection"` |
| Delete icon | `IconButton size="small"` + `DeleteIcon fontSize="small" color="error"`, `aria-label="Delete collection"` |
| Lazy load | `bookmarks` starts `null`; first expand triggers `fetchCollectionBookmarks(token, collection.id, bookmarkSort)` |
| Cache | `hasLoadedRef` — collapsing and re-expanding does NOT refetch |
| Refetch | Only when already loaded AND `refreshKey` or `bookmarkSort` changed (value-compared via refs, not object identity) |
| Loading | 3× `Skeleton variant="rounded" height={72}` in flex column `gap: 1.5` (`--radius-md`) |
| Empty | Centered `BookmarkAddIcon` at 64px + "No bookmarks in this collection yet" + "Add bookmark" CTA |
| List | `BookmarkList showCollectionChip={false}` — chip is redundant inside its own group |
| Error surface | `useError().showError()` — accordion stays open and keeps previous bookmarks/empty state |

**Pattern notes:**
MUI `Accordion` + `stopPropagation` header actions is the canonical collapsible-group pattern. Lazy-load nested data on first expand and cache it; refetch nested data only while it is already loaded, driven by a parent-bumped `refreshKey` and sort params. Compare sort/refresh changes by value (string key + number in refs), never by object identity. The parent owns `refreshKey` and bumps it after every mutation.

---

### AllPage (Phase 4)

File: `frontend/src/pages/AllPage.tsx`
Last updated: 2026-08-13

| Property | Pattern |
|----------|---------|
| Page width | `maxWidth: 560, mx: 'auto'` (matches CollectionsPage) |
| Page title | `Typography variant="h4" component="h1"` "All" with `mb: 3` |
| Controls row | Two `Button variant="contained"` with `AddIcon` ("New Collection", "New Bookmark") + two `FormControl size="small"` `Select` sorts ("Collections sort", "Bookmarks sort", each Newest/Oldest/A–Z/Z–A) |
| Body | Vertical stack of `CollectionAccordion` (`Box` flex column `gap: 1.5`) |
| Loading | 3× `Skeleton variant="rounded" height={72}` in flex column `gap: 1.5` |
| Empty | Centered `FolderOpenIcon fontSize={64}` + "No collections yet" + "Create your first collection" CTA |
| Sort | Two separate `SortOption` states + `sortOptionToParams` helpers (`createdAt`/`name` for collections, `createdAt`/`title` for bookmarks) |
| Refresh coordination | Single `refreshKey: number` state, `bumpRefreshKey()` after every successful mutation (create/edit/delete, collections + bookmarks); passed to each accordion |
| Bookmark click | `useNavigate()` → `/bookmarks/:id` |
| Dialogs | Reused `CollectionDialog` / `BookmarkDialog` / delete dialogs with separate boolean + selected-item state, matching `CollectionsPage` |
| Error surface | `useError().showError()` on fetch/mutation failures |
| Auth | Wrapped in `<AuthGuard>` in `router.tsx` |

**Pattern notes:**
This is the grouped/list-page pattern that composes `CollectionAccordion`. After any mutation the page refetches `fetchCollections` (to update `_count` and the list) AND bumps `refreshKey` so every already-loaded accordion refetches its bookmarks — without a full teardown. Bookmark create/edit/delete dialogs are owned here and wired through the accordion via callbacks. No search and no uncategorized section on `/all` (both out of scope).
