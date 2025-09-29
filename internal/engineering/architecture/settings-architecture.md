## Settings System Architecture

### Overview

The settings system powers “Report Card Elements” editable by admins under `app/(main)/settings/page.tsx`. It centralizes predefined content used throughout report cards and previews, including:

- Key Concepts
- Games & Activities
- Product Recommendations
- Training Skills
- Homework
- Custom Categories (user-defined groups of items)

The admin UI allows adding, editing, deleting, and reordering items and categories, with immediate persistence to MongoDB.

### Data Model

- Collection: `settings`
- Single document keyed by `type: "training_options"`
- Schema defined in `models/Setting.ts` (Mongoose), but API currently uses the Mongo driver directly.

Top-level fields (arrays of items):
- `keyConcepts`, `gamesAndActivities`, `trainingSkills`, `homework`: items with `{ _id, legacyId?, title, description(HTML), url? }`
- `productRecommendations`: items with `{ _id, legacyId?, title, description?, url? }`
- `customCategories`: array of categories `{ _id, legacyId?, name, order, items: ICustomCategoryItem[] }`
  - `order` controls display sequence across the app
  - Items mirror the standard item shape

Additional future-oriented fields exist in the model (`sessionOfferings`, `packageDefinitions`) but are not yet wired into the admin UI or API for `training_options`.

### API Endpoints

1) GET/PUT `app/api/settings/route.ts`
- GET: Fetches the `training_options` doc and normalizes IDs for the frontend by adding a stable string `id` to each item and custom category (preferring ObjectId hex; falls back to `legacyId` or existing `id`). Caching is disabled.
- PUT: Upserts the `training_options` document, replacing relevant arrays based on request body payload.

2) PUT/DELETE `app/api/settings/items/[id]/route.ts`
- PUT: Updates a single item by ID. Determines which category the item lives in (including nested `customCategories`) and performs an array-positioned update with `arrayFilters`.
- DELETE: Removes a single item by ID. Uses `$pull` for standard categories; for custom categories, rebuilds `customCategories` with the item filtered out and overwrites that field.

### Frontend UI

Component: `components/settings/settings-form.tsx`
- Loads settings via GET `/api/settings` on mount, performs client-side ID normalization checks, and may write back if legacy structures are detected (e.g., missing `order`).
- Maintains an `activeId` for expand/collapse behavior per category/card and renders a `CategoryBox` per section.
- Supports add, edit, delete for all standard categories; supports create, delete, and reordering for `customCategories`.
- Reordering custom categories swaps their `order` values and persists via PUT `/api/settings` (optimistic UI with visual feedback).

Component: `components/settings/category-box.tsx`
- Collapsible container with heading and an item preview when collapsed.
- When expanded, provides an “Add New” button and renders children (the items or edit form).
- Expanded content is capped at 70vh with vertical scrolling to keep the panel within the viewport.

Page: `app/(main)/settings/page.tsx`
- Thin wrapper that renders `SettingsForm`.

### ID Strategy

- Backend uses Mongo ObjectIds, but the UI expects a stable string `id`.
- GET normalizes each item/category: `id = _id.$oid | _id.toString() | legacyId | existing id`.
- All item-level mutations on the UI use the string `id`.

### Persistence Flow

1. UI fetches settings (GET `/api/settings`) → receives normalized arrays with `id` strings.
2. UI edits (add/edit/delete/reorder) → prepares updated settings or single-item payloads.
3. For full updates (e.g., reordering, adding categories): PUT `/api/settings` with the entire updated arrays.
4. For single-item edits/deletes: PUT/DELETE `/api/settings/items/[id]` which targets the exact item.
5. On success, UI updates local state immediately (optimistic) or after confirmation, depending on operation.

### Sorting & Display Rules

- Standard categories are displayed first in a fixed order.
- `customCategories` are sorted by `order` ascending in the UI and in report-card usage.

### Security & Caching

- Admin-only page; relies on overall admin route protections in `(main)` layout.
- API responses include `no-store`/`no-cache` headers. Route exports `dynamic = 'force-dynamic'` to avoid ISR caching.

### Known Considerations

- The settings API for `training_options` uses the Mongo driver directly rather than the Mongoose model. This is acceptable but leads to two parallel representations (driver schema vs Mongoose types). Keep them aligned.
- Custom category item deletion rewrites `customCategories` as a whole; acceptable given single-document strategy, but large payloads could be optimized by targeted positional updates later if needed.
- The model includes future scheduling field definitions that are not yet persisted via the current `/api/settings` route.

### Files

- `models/Setting.ts`
- `app/api/settings/route.ts`
- `app/api/settings/items/[id]/route.ts`
- `components/settings/settings-form.tsx`
- `components/settings/category-box.tsx`
- `app/(main)/settings/page.tsx`


