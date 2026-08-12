# All View (Phase 4)

## Scope

Frontend-only feature. **No backend changes** — every endpoint this page needs already exists:

- `GET /collections` — list collections (with `_count.bookmarks`, `sortBy`/`sortOrder`).
- `GET /collections/:id/bookmarks` — list bookmarks in one collection (with `sortBy`/`sortOrder`).

**Depends on**: Phase 3 (Bookmarks CRUD) — complete.

**Out of scope**: search on `/all`, uncategorized bookmarks, any backend endpoint addition.

---

## What We Are Building

The `/all` page replaces the placeholder `<div>All</div>` in `router.tsx` with a collapsible, grouped view of the user's collections and their nested bookmarks. Collections render as MUI `Accordion` items; expanding one lazily loads its bookmarks. Collections and bookmarks are fully editable inline (create / edit / delete via the existing dialogs), with sort controls. No search, and no uncategorized section.

---

## File Structure

```
frontend/src/
  pages/
    AllPage.tsx                        # new — the /all page
  components/
    all/
      CollectionAccordion.tsx          # new — one accordion item per collection, lazy-loads bookmarks
```

Reused (no changes except where noted):

- `components/bookmarks/BookmarkList.tsx` — vertical list of bookmark cards
- `components/bookmarks/BookmarkCard.tsx` — add optional `showCollectionChip?: boolean = true` prop (see below)
- `components/bookmarks/BookmarkDialog.tsx` — create/edit bookmark
- `components/bookmarks/DeleteBookmarkDialog.tsx` — delete confirmation
- `components/collections/CollectionDialog.tsx` — create/edit collection
- `components/collections/DeleteCollectionDialog.tsx` — delete confirmation
- `api/collections.ts` — `fetchCollections`, `createCollection`, `updateCollection`, `deleteCollection`
- `api/bookmarks.ts` — `fetchCollectionBookmarks`

---

## Data Flow (Lazy Loading)

1. **On mount**: `fetchCollections(token, { sortBy, sortOrder })` → render one `CollectionAccordion` per collection (collapsed).
2. **On first expand** of a collection: `fetchCollectionBookmarks(token, collection.id, { sortBy, sortOrder })` → show a skeleton loader → render `BookmarkList`.
3. **Cache**: once loaded, collapsing and re-expanding does **not** refetch.
4. **Refetch** when (and only when) the collection is already loaded:
   - the bookmark sort control changes, or
   - the parent signals a mutation via a `refreshKey` prop (see below).
5. **After any mutation** (bookmark create/edit/delete/move, collection create/edit/delete): the page refetches `fetchCollections` (to update `_count` and the list) and bumps `refreshKey` so every loaded accordion refetches its bookmarks.

### `refreshKey` coordination

`AllPage` owns a single `refreshKey: number` state, incremented after every successful mutation. It is passed to each `CollectionAccordion`, which refetches its bookmarks (if loaded) whenever `refreshKey` changes. This keeps counts and lists consistent after create/edit/delete without a full teardown.

---

## CollectionAccordion

`src/components/all/CollectionAccordion.tsx`

### Props

```typescript
interface CollectionAccordionProps {
  collection: Collection;                 // includes _count.bookmarks
  bookmarkSort: { sortBy: 'title' | 'createdAt' | 'updatedAt'; sortOrder: 'asc' | 'desc' };
  refreshKey: number;                     // parent-bumped after any mutation
  onEditCollection: () => void;
  onDeleteCollection: () => void;
  onEditBookmark: (bookmark: Bookmark) => void;
  onDeleteBookmark: (bookmark: Bookmark) => void;
  onBookmarkClick: (bookmark: Bookmark) => void;   // → navigate('/bookmarks/:id')
}
```

### Internal state

| State       | Type                    | Purpose                                   |
| ----------- | ----------------------- | ----------------------------------------- |
| `expanded`  | `boolean`               | Accordion open/closed                     |
| `bookmarks` | `Bookmark[] \| null`    | `null` = not yet loaded                   |
| `loading`   | `boolean`               | In-flight fetch (shows skeleton)          |

### Behavior

- **Header** (`AccordionSummary` with `expandIcon={<ExpandMoreIcon />}`): collection name (`Typography variant="subtitle1"`), bookmark count (`Typography variant="body2" color="text.secondary"`, `${_count.bookmarks ?? 0} bookmarks`), edit `IconButton` (`EditIcon`, `fontSize="small"`, `aria-label="Edit collection"`), delete `IconButton` (`DeleteIcon`, `color="error"`, `fontSize="small"`, `aria-label="Delete collection"`).
  - Edit/delete buttons call `e.stopPropagation()` **and** prevent the accordion toggle — clicking them must not expand/collapse the panel.
- **Toggle**: expanding when `bookmarks === null` triggers the lazy fetch; collapsing keeps state.
- **Details** (`AccordionDetails`):
  - `loading` → 3× MUI `Skeleton variant="rounded" height={72}` in a flex column `gap: 1.5` (match `BookmarkCard` shape).
  - loaded + non-empty → `BookmarkList` with `showCollectionChip={false}` (the chip is redundant inside a collection).
  - loaded + empty → centered `LinkOffIcon`/`BookmarkAddIcon` at 64px + "No bookmarks in this collection yet" + "Add bookmark" CTA (calls `onEditBookmark` in create mode via parent).
- **Refetch**: on `refreshKey` change or `bookmarkSort` change, refetch only if `bookmarks !== null` (i.e. already loaded).
- **Fetch errors**: surfaced via `useError().showError()` — the accordion stays open and keeps its previous `bookmarks` (or empty state).

### BookmarkCard change

Add optional `showCollectionChip?: boolean = true`. When `false`, skip rendering the `Chip` even if `bookmark.collection` is set. Default behavior is unchanged (existing callers unaffected).

---

## AllPage

`src/pages/AllPage.tsx`

### Layout

- Page width: `maxWidth: 560, mx: 'auto'` (matches `CollectionsPage`).
- Title: `Typography variant="h4" component="h1"` — "All" — with `mb: 3`.
- Controls row (below title):
  - `Button variant="contained"` with `AddIcon` — "New Collection" → `CollectionDialog` (create).
  - `Button variant="contained"` with `AddIcon` — "New Bookmark" → `BookmarkDialog` (create).
  - `FormControl size="small"` + `Select` — collections sort: Newest (`createdAt desc`, default) / Oldest (`createdAt asc`) / A–Z (`name asc`) / Z–A (`name desc`).
  - `FormControl size="small"` + `Select` — bookmarks sort: Newest (`createdAt desc`, default) / Oldest (`createdAt asc`) / A–Z (`title asc`) / Z–A (`title desc`).
- Body: vertical stack of `CollectionAccordion` items (`Box` flex column, `gap: 1.5`).

### States

- **Loading**: 3× `Skeleton variant="rounded"` matching accordion header height.
- **Empty**: no collections → centered `FolderOpenIcon fontSize={64} color="text.secondary"` + "No collections yet" + "Create your first collection" CTA.
- **Auth**: page wrapped in `<AuthGuard>` (already present in `router.tsx`).

### Dialogs & mutations

The page owns dialog state (separate boolean + selected-item variables, matching `CollectionsPage`):

| Action                    | Dialog                    | After success                                        |
| ------------------------- | ------------------------- | ---------------------------------------------------- |
| New/Edit collection       | `CollectionDialog`        | refetch collections                                  |
| Delete collection         | `DeleteCollectionDialog`  | refetch collections; bump `refreshKey`               |
| New/Edit bookmark         | `BookmarkDialog`          | refetch collections; bump `refreshKey`               |
| Delete bookmark           | `DeleteBookmarkDialog`    | refetch collections; bump `refreshKey`               |

Notes:

- Collection edit/delete are triggered from each `CollectionAccordion` header (passed as callbacks).
- Bookmark edit/delete are triggered from each `BookmarkCard` (passed through `CollectionAccordion`).
- Bookmark **create** is triggered from the page-level "New Bookmark" button — the dialog's collection `Autocomplete` assigns it. A bookmark created without a collection will **not** appear on `/all` (it lives on `/bookmarks`), consistent with dropping the uncategorized section.
- Bookmark **click** navigates to `/bookmarks/:id` via `useNavigate()`.
- Collection accordion headers do **not** navigate — expanding is the interaction. Collection detail remains reachable via the sidebar `/collections` link.

### Wiring

Replace the `/all` route element in `router.tsx`:

```tsx
{
  path: 'all',
  element: (
    <AuthGuard>
      <AllPage />
    </AuthGuard>
  ),
},
```

---

## UI Patterns to Follow

| Context             | Pattern                                                              |
| ------------------- | -------------------------------------------------------------------- |
| Page width          | `maxWidth: 560, mx: 'auto'` (follow `CollectionsPage`)                |
| Accordion           | MUI `Accordion` + `AccordionSummary` (`expandIcon`) + `AccordionDetails`; header actions use `stopPropagation` |
| Cards               | `Card variant="outlined"`, `--radius-md` via theme                    |
| Dialog              | Reused `CollectionDialog` / `BookmarkDialog` / delete dialogs with `--radius-lg` |
| Loading             | MUI `Skeleton` (rounded cards for lists, matching `BookmarkCard` shape) |
| Empty state         | Centered icon at 64px + title + description + CTA                     |
| Error surface       | `useError().showError()` — global `ErrorSnackbar`                     |
| Destructive actions | `IconButton` + `DeleteIcon` with `color="error"`                      |
| Code/URLs           | `var(--font-mono)` at body2 size (already in `BookmarkCard`)          |
| Auth                | Page wrapped in `AuthGuard` (already in `router.tsx`)                 |

---

## Tests (TDD — red-green-refactor, write before implementation)

**`CollectionAccordion.spec.tsx`:**

- Renders collection name and bookmark count in the header
- Does **not** fetch bookmarks on mount (lazy)
- Fetches bookmarks on first expand (`fetchCollectionBookmarks` called with the collection id + sort params)
- Shows skeleton loaders while fetching
- Renders `BookmarkList` (bookmark cards) after load
- Renders empty state when the collection has no bookmarks
- Collapsing and re-expanding does **not** refetch (cache)
- Refetches when `refreshKey` changes while loaded
- Refetches when `bookmarkSort` changes while loaded
- Does **not** refetch when `refreshKey`/`bookmarkSort` changes while **not** loaded
- Edit button calls `onEditCollection` and does **not** toggle expansion
- Delete button calls `onDeleteCollection` and does **not** toggle expansion
- Bookmark edit/delete/click callbacks are wired through to `BookmarkCard`
- Hides the collection chip inside the accordion (`showCollectionChip={false}`)

**`AllPage.spec.tsx`:**

- Fetches collections on mount
- Shows skeleton loaders while fetching collections
- Renders accordions after load
- Shows empty state when there are no collections
- Collections sort control changes order (passes `sortBy`/`sortOrder` to `fetchCollections`)
- Bookmarks sort control is passed down to accordions
- "New Collection" opens `CollectionDialog` in create mode
- "New Bookmark" opens `BookmarkDialog` in create mode
- Edit icon opens `CollectionDialog` in edit mode, pre-filled
- Delete icon opens `DeleteCollectionDialog`
- Refetches collections after collection create/edit/delete
- Bumps `refreshKey` after bookmark create/edit/delete
- Surfaces API errors via the global error context

**`BookmarkCard.spec.tsx`** (addition):

- Hides the collection chip when `showCollectionChip={false}` (even when `bookmark.collection` is set)
- Still renders the chip when `showCollectionChip` is omitted (default `true`)

---

## Success Criteria

1. `/all` renders every collection as a collapsible accordion item with its bookmark count.
2. Expanding a collection lazily loads its bookmarks with a skeleton loader and caches them across collapse/re-expand.
3. Collections sort by Newest/Oldest/A–Z/Z–A via `GET /collections`.
4. Bookmarks within a collection sort by Newest/Oldest/A–Z/Z–A via `GET /collections/:id/bookmarks`.
5. Collections can be created, edited, and deleted inline; the list and counts refresh afterward.
6. Bookmarks can be created, edited, and deleted inline; the affected collection(s) and counts refresh afterward.
7. Clicking a bookmark navigates to `/bookmarks/:id`.
8. Edit/delete actions inside an accordion header do not toggle the panel.
9. Empty states render for both "no collections at all" and "a collection with no bookmarks".
10. No uncategorized section and no search on `/all` (both intentionally out of scope).
11. `showCollectionChip={false}` removes the redundant chip inside a collection accordion without changing existing callers.
12. All frontend tests (component + page) pass.
13. `npm run build` + `npm run lint` pass in `/frontend`.
14. No hardcoded hex/oklch values — all styling uses themed palette or CSS custom properties.
15. No backend changes; all data remains scoped to the authenticated `ownerId` by the existing endpoints.

---

## Decisions

| Decision                  | Resolution                                                                 | Rationale                                                                                                  |
| ------------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Data source               | Lazy-load: `GET /collections` eager + `GET /collections/:id/bookmarks` on expand, cached | Fast initial load; reuses existing endpoint; natural fit for accordion; no backend change.                 |
| Uncategorized bookmarks   | Dropped from `/all`                                                        | `/all` is a collections-centric grouped view; uncategorized bookmarks remain reachable on `/bookmarks`.    |
| Layout                    | MUI `Accordion`, one item per collection (collapsible)                      | Collapsible grouped view matches the "everything in one place" intent; keeps many collections manageable.  |
| Interactivity             | Full inline CRUD via reused dialogs + sort controls                         | Reuses existing `CollectionDialog`/`BookmarkDialog`/delete dialogs; no search (search lives on `/bookmarks`). |
| Search                    | None on `/all`                                                             | Search stays on `/bookmarks`; `/all` is a browse/expand view.                                              |
| Collection header click   | Toggles expand (does not navigate)                                          | Accordion toggle is the interaction; collection detail remains via sidebar `/collections`.                 |
| Bookmark chip in accordion | Hidden via `showCollectionChip={false}`                                    | The chip is redundant inside its own collection group.                                                     |
| Backend changes           | None                                                                       | All required endpoints already exist and are already ownership-scoped.                                     |

---

## Post-Implementation

- Imprint the accordion pattern (MUI `Accordion` + lazy-load + `stopPropagation` header actions) into `context/ui-registry.md`.
- Update `context/progress-tracker.md` to mark Phase 4 complete.
