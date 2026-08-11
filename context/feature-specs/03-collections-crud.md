# Collections CRUD

## Prerequisite

Before any Collections CRUD work begins, complete the remaining Phase 1.4 step:

```sh
docker compose up -d postgres
cd backend && npx prisma migrate dev --name init
```

This creates the initial migration from the already-written `schema.prisma` and applies it. Verify with `npx prisma studio` that the `Collection` and `Bookmark` tables exist.

---

## Backend — Collections API (Phase 2.1)

### Module Structure

Create `backend/src/collections/`:

```
collections/
  collections.module.ts
  collections.controller.ts
  collections.service.ts
  dto/
    create-collection.dto.ts
    update-collection.dto.ts
    patch-collection.dto.ts
    query-collections.dto.ts
    collection.response.ts
```

### DTOs

**`CreateCollectionDto`** — validates the create payload:

```typescript
class CreateCollectionDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  name: string;
}
```

**`UpdateCollectionDto`** — validates the PUT (full replace) payload. Same shape as create — all fields required:

```typescript
class UpdateCollectionDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  name: string;
}
```

**`PatchCollectionDto`** — validates the PATCH (partial update) payload. All fields optional, but at least one must be present:

```typescript
class PatchCollectionDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  name?: string;
}
```

Note: `name` is the only mutable field on `Collection` (`id`, `ownerId`, `createdAt`, `updatedAt` are system-managed). PUT requires `name` (full replacement); PATCH allows omitting it.

**`QueryCollectionsDto`** — validates query parameters on `GET /collections`:

```typescript
class QueryCollectionsDto {
  @IsOptional()
  @IsString()
  name?: string;       // partial match filter (ILIKE / contains)

  @IsOptional()
  @IsIn(['name', 'createdAt', 'updatedAt'])
  sortBy?: string;      // default: 'createdAt'

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: string;   // default: 'desc'
}
```

Filtering rules:
- `name` — case-insensitive partial match (`contains` + `mode: 'insensitive'`). Matches anywhere in the collection name.
- `sortBy` — field to sort by. Defaults to `createdAt`.
- `sortOrder` — `asc` or `desc`. Defaults to `desc`.
- All filters are AND-ed together. All are optional — omitting them returns all collections.

**`CollectionResponse`** — returned by all collection endpoints. Shape:

```typescript
interface CollectionResponse {
  id: string;
  name: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  _count?: { bookmarks: number }; // included on list and detail
}
```

### Routes

All routes are protected with `@UseGuards(JwtAuthGuard)`. Every service method scopes queries to `ownerId` (extracted from `req.user.sub`).

| Method | Path                   | Behavior                                                                 |
| ------ | ---------------------- | ------------------------------------------------------------------------ |
| POST   | `/collections`         | Create a new collection. Body: `CreateCollectionDto`. Returns `CollectionResponse` (201). |
| GET    | `/collections`         | List collections belonging to `ownerId`. Query params: `name`, `sortBy`, `sortOrder` (all optional, validated via `QueryCollectionsDto`). Each item includes `_count.bookmarks`. Returns `CollectionResponse[]`. |
| GET    | `/collections/:id`     | View a single collection by id, scoped to `ownerId`. Includes `_count.bookmarks`. Returns `CollectionResponse`. 404 if not found or not owned. |
| PUT    | `/collections/:id`     | Full replace of a collection. Body: `UpdateCollectionDto` (name required). Returns updated `CollectionResponse`. 404 if not found or not owned. |
| PATCH  | `/collections/:id`     | Partial update of a collection. Body: `PatchCollectionDto` (name optional, at least one field). Returns updated `CollectionResponse`. 404 if not found or not owned. 400 if body is empty (`{}`). |
| DELETE | `/collections/:id`     | Delete a collection by id, scoped to `ownerId`. Returns 204. 404 if not found or not owned. |

### Service Logic — Collection Deletion

On delete, **nullable the `collectionId` on all associated bookmarks** before deleting the collection. This runs in a Prisma `$transaction`:

1. `prisma.bookmark.updateMany({ where: { collectionId, ownerId }, data: { collectionId: null } })`
2. `prisma.collection.delete({ where: { id, ownerId } })`

Bookmarks are preserved — they become uncategorized. This prevents accidental data loss when a user reorganizes collections.

### Wiring

`CollectionsModule` imports nothing beyond what's already global (`PrismaModule`, `ConfigModule`). Register it in `AppModule.imports`.

### Tests

Follow TDD — red-green-refactor. Write tests before implementation.

**`collections.service.spec.ts`** (unit tests, mock `PrismaService`):

- `create(ownerId, dto)` returns the created collection with `ownerId` from the caller
- `findAll(ownerId, query)` returns only collections matching that `ownerId`, applies `name` filter when provided (case-insensitive partial match), applies `sortBy`/`sortOrder` (defaults: `createdAt desc`), includes bookmark counts
- `findAll(ownerId, query)` with `name` filter returns only matching collections
- `findOne(id, ownerId)` returns the collection when it exists and belongs to `ownerId`
- `findOne(id, ownerId)` throws 404 when collection does not exist or belongs to another `ownerId`
- `update(id, ownerId, dto)` (PUT) fully replaces the collection name, returns updated collection — 404 if not found/not owned
- `patch(id, ownerId, dto)` (PATCH) partially updates only provided fields, returns updated collection — 404 if not found/not owned
- `delete(id, ownerId)` disassociates bookmarks then deletes the collection within a transaction
- `delete(id, ownerId)` throws 404 when collection does not exist or belongs to another `ownerId`

**`collections.controller.spec.ts`** (integration tests with supertest, mock `JwtAuthGuard`/`JwtStrategy`):

- `POST /collections` with valid name → 201, returns the collection
- `POST /collections` with empty/too-long name → 400 validation error
- `GET /collections` → 200, returns array of user's collections with bookmark counts, default sort `createdAt desc`
- `GET /collections?name=tech` → 200, returns only collections whose name contains "tech" (case-insensitive)
- `GET /collections?sortBy=name&sortOrder=asc` → 200, returns collections sorted by name ascending
- `GET /collections?sortBy=invalid` → 400 validation error
- `GET /collections/:id` → 200, returns the collection with bookmark count
- `GET /collections/:id` with non-existent id → 404
- `PUT /collections/:id` with valid name → 200, returns updated collection
- `PUT /collections/:id` with empty name → 400 validation error
- `PUT /collections/:id` with non-existent id → 404
- `PATCH /collections/:id` with `{ name: "new name" }` → 200, returns updated collection
- `PATCH /collections/:id` with empty body `{}` → 400 (no fields to update)
- `PATCH /collections/:id` with non-existent id → 404
- `DELETE /collections/:id` → 204
- `DELETE /collections/:id` with non-existent id → 404
- Every route returns 401 without a valid Bearer token
- A user cannot see/update/patch/delete another user's collection (cross-owner isolation)

---

## Frontend — Collections Page (Phase 2.2)

### File Structure

```
frontend/src/
  api/
    collections.ts          # fetchCollections, createCollection, deleteCollection
  pages/
    CollectionsPage.tsx      # main page component (replaces placeholder <div>)
    CollectionDetailPage.tsx # single collection detail view (optional: in-page or separate route)
  components/
    collections/
      CollectionList.tsx     # list of collection cards
      CollectionCard.tsx     # single collection card (name, bookmark count, delete action)
      CreateCollectionDialog.tsx  # dialog with name field + create button
```

### API Client (`src/api/collections.ts`)

Follow the `src/api/me.ts` pattern — access token via `useAuth0().getAccessTokenSilently()`, typed responses:

```typescript
export interface Collection {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  _count?: { bookmarks: number };
}

export interface CollectionQueryParams {
  name?: string;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export async function fetchCollections(accessToken: string, params?: CollectionQueryParams): Promise<Collection[]> { ... }
export async function fetchCollection(accessToken: string, id: string): Promise<Collection> { ... }
export async function createCollection(accessToken: string, name: string): Promise<Collection> { ... }
export async function updateCollection(accessToken: string, id: string, name: string): Promise<Collection> { ... }
export async function patchCollection(accessToken: string, id: string, data: { name?: string }): Promise<Collection> { ... }
export async function deleteCollection(accessToken: string, id: string): Promise<void> { ... }
```

### Collections Page (`/collections`)

Replaces the placeholder `<div>Collections</div>` in `router.tsx`.

**Layout:**
- Page title: `Typography variant="h4" component="h1"` — "Collections"
- Create button: MUI `Button variant="contained"` — "New Collection" — opens the create dialog
- Collection list: grid of `CollectionCard` components, or a vertical list of cards (`Card variant="outlined"`)
- Empty state: centered icon + "No collections yet" + "Create your first collection" CTA button

**Collection Card:**
- MUI `Card variant="outlined"` with `--radius-md` (8px via `theme.shape.borderRadius`)
- Card content: collection name (`Typography variant="h6"`), bookmark count (e.g., "3 bookmarks" in `text.secondary`)
- Edit action: MUI `IconButton` with `EditIcon` — opens the edit dialog (pre-filled with current name)
- Delete action: MUI `IconButton` with `DeleteIcon` (destructive color), positioned alongside edit in a card action area
- Click navigates to collection detail (inline or separate route — see decision below)

**Create/Edit Dialog (single reusable component):**
- MUI `Dialog` with `--radius-lg` (12px)
- Title: "New Collection" (create) or "Edit Collection" (edit)
- Content: MUI `TextField` for collection name, auto-focused, pre-filled with current name in edit mode, validates non-empty on blur
- Actions: "Cancel" (`Button` outlined) + "Create"/"Save" (`Button variant="contained"`, disabled when name is empty or unchanged from original, loading state during API call)
- Create: calls `POST /collections`; Edit: calls `PUT /collections/:id`
- On success: closes dialog, refreshes the collection list
- On error: surfaces via `useError().showError()`

**Search/Filter Bar (on Collections page):**
- MUI `TextField` with `SearchIcon` adornment, placeholder "Search collections…"
- Debounced (300ms) — fires `fetchCollections` with `name` query param on change
- MUI `Select` or toggle buttons for sort: "Newest" (createdAt desc, default), "Oldest" (createdAt asc), "A–Z" (name asc), "Z–A" (name desc)
- Filter and sort state live in the page component, passed to `fetchCollections` as `CollectionQueryParams`

**Delete:**
- No confirmation dialog in v1 — direct delete with optimistic removal from the list
- On error: restore item to list + show error via `useError().showError()`

### Collection Detail

A single collection's detail view showing:
- Collection name as page title
- Bookmark count
- List of bookmarks in this collection (fetch from backend — the backend already provides the relation; for Phase 2 this may be a stub since bookmarks aren't built yet)
- Back link to `/collections`

In Phase 2, bookmarks don't exist yet on the frontend, so the detail view shows collection metadata and a placeholder for the bookmark list. The bookmark list is populated in Phase 3.

### Wiring

- Replace the placeholder `<div>Collections</div>` in `router.tsx` with `<CollectionsPage />`
- If adding a detail sub-route: `collections/:id` → `<CollectionDetailPage />`

### UI Patterns to Follow

| Context | Pattern |
|---------|---------|
| Page width | `maxWidth: 560, mx: 'auto'` (centered, constrained — follow `ProfilePage`) |
| Cards | `Card variant="outlined"`, `--radius-md` via theme |
| Dialog | `Dialog` with `--radius-lg` (12px), auto-focused text field |
| Loading | MUI `Skeleton` cards (3-4 skeleton cards while loading) |
| Empty state | Centered icon + title + description + CTA button |
| Error surface | `useError().showError()` — use the global `ErrorSnackbar` |
| Destructive actions | `IconButton` + `DeleteIcon` with `color="error"` |
| Auth | Page wrapped in `AuthGuard` (already done in `router.tsx`) |

### Tests

Write before implementation (TDD):

**`CollectionCard.spec.tsx`:**
- Renders collection name and bookmark count
- Renders edit button that calls `onEdit` prop
- Renders delete button that calls `onDelete` prop
- Renders correctly with `_count` undefined (0 bookmarks)

**`CollectionDialog.spec.tsx`:**
- Renders in create mode: title "New Collection", empty field, primary button "Create"
- Renders in edit mode: title "Edit Collection", pre-filled field, primary button "Save"
- Primary button disabled when name is empty
- Primary button disabled when name unchanged from initial value (edit mode)
- Calls `onCreate(name)` / `onSave(name)` when submitted, clears/resets on success
- Shows loading state on primary button while submitting

**`CollectionsPage.spec.tsx`:**
- Shows skeleton loaders while fetching
- Shows collection cards after load
- Shows empty state when no collections
- Opens create dialog on "New Collection" click
- Opens edit dialog on edit icon click, pre-filled with collection name
- Refreshes list after successful create/update
- Removes collection from list after successful delete
- Search input filters collections (debounced API call with `name` param)
- Sort control changes order (passes `sortBy`/`sortOrder` to API)
- Surfaces API errors via global error context

---

## Success Criteria

1. `POST /collections` creates a collection scoped to the authenticated user's `ownerId`.
2. `GET /collections` returns only the current user's collections with bookmark counts, supports `name` filter (case-insensitive partial match) and `sortBy`/`sortOrder` query params.
3. `GET /collections/:id` returns a single collection — 404 for non-existent or other user's collection.
4. `PUT /collections/:id` fully replaces a collection's name — 404 for non-existent or other user's collection, 400 on invalid body.
5. `PATCH /collections/:id` partially updates a collection's name — 404 for non-existent or other user's collection, 400 on empty body.
6. `DELETE /collections/:id` disassociates bookmarks then deletes — 404 for non-existent or other user's collection.
7. All collection endpoints return 401 without a valid Bearer token.
8. `/collections` page shows the user's collections in a card list, with create, edit, and delete.
9. Search bar filters collections by name (debounced, case-insensitive partial match).
10. Sort control changes collection order (newest, oldest, A–Z, Z–A).
11. Empty state renders when the user has no collections.
12. Create/edit dialog validates name (non-empty, ≤100 chars) and shows loading state during API call.
13. All backend tests (unit + integration) and frontend tests (component + page) pass.
14. `npm run build` + `npm run lint` pass in both `/frontend` and `/backend`.
15. No hardcoded hex/oklch values — all styling uses themed palette or CSS custom properties.
16. No backend route returns data belonging to another user.

---

## Decisions

| Decision | Resolution | Rationale |
|----------|-----------|-----------|
| Cascade behavior on collection delete | Nullify `collectionId` on associated bookmarks (do not cascade-delete) | Prevents accidental data loss. Bookmarks become uncategorized. |
| Collection name uniqueness | Not enforced — duplicates allowed | User may want two collections with the same name for different purposes. |
| Collection detail route | Separate `/collections/:id` route with `CollectionDetailPage` | Full RESTful routing supports PUT/PATCH at the resource level. Detail page needed for Phase 3 bookmark nesting anyway. |
| Delete confirmation | No confirmation dialog in v1 | Direct delete with optimistic removal. Add confirmation in a UX polish pass if needed. |
| Inline edit vs dialog | Reusable `CollectionDialog` component (create + edit modes) | Same dialog serves both create and edit — pre-fills in edit mode, clears in create mode. Avoids inline editing UX complexity for v1. |
| Edit API method | Use `PUT` for the edit dialog (full replace) | Since `name` is the only field, PUT and PATCH are equivalent. Use PUT for edit UI; reserve PATCH for programmatic/future use. The backend still supports both. |
