This document provides an overview of the project's current state, architectural decisions, and key features implemented recently, along with identified future considerations. The application is built using Next.js App Router, interacting with MongoDB via Mongoose.

### Brand Colors & Design System

**IMPORTANT: Always use brand colors when possible.** The application has a defined set of brand colors that should be used consistently throughout the interface to maintain visual cohesion and brand identity. These colors are available as Tailwind CSS classes with the `brand-` prefix.

**Available Brand Colors:**
- **Blue**: `brand-blue-50`, `brand-blue-100`, `brand-blue-700` (primary navigation, accents)
- **Green**: `brand-green-50`, `brand-green-100`, `brand-green-700` (success states, positive actions)
- **Purple**: `brand-purple-50`, `brand-purple-100`, `brand-purple-700` (headings, primary text)
- **Pink**: `brand-pink-50`, `brand-pink-100`, `brand-pink-700` (secondary actions, highlights)
- **Amber**: `brand-amber-50`, `brand-amber-100`, `brand-amber-700` (warnings, secondary buttons)
- **Orange**: `brand-orange-50`, `brand-orange-100`, `brand-orange-700` (tertiary actions, accents)

**Usage Guidelines:**
- Use `brand-purple-700` for primary headings and important text
- Use `brand-green-700` for primary action buttons (submit, confirm, book)
- Use `brand-pink-700` for secondary action buttons
- Use `brand-blue-50/100` for subtle backgrounds and borders
- Use `brand-amber-700` for utility buttons (today, reset, etc.)
- Maintain consistent hover states using the `100` variants for backgrounds

### Data Models

The application interacts with the following MongoDB collections: `clients`, `contact_form_submissions`, `qrCodes`, `report_cards`, `settings`, `calendar_timeslots`, `package_instances`, and `dog_training_agencies`. Mongoose models have been created for these collections and are located in the `models` or `lib/models` directory as TypeScript files.

*   **Report Card Data Structure:** Documents include fields like `clientId`, `clientName`, `dogName`, `date`, `summary`, `keyConcepts`, `productRecommendations`, `fileId`, `webViewLink`, and timestamps (`createdAt`).
    ```json
    {"_id":{"$oid":"..."},"clientId":"...","clientName":"...","dogName":"...","date":"...","summary":"...","keyConcepts":["..."],"productRecommendations":[],"fileId":"...","webViewLink":"...","createdAt":{"$date":{"$numberLong":"..."}}}
    ```
*   **Settings Data Structure:** Contains a single document (`type: "training_options"`) used to store predefined lists of `keyConcepts`, `productRecommendations`, `gamesAndActivities`, `homework`, `trainingSkills`, and `customCategories`.
    ```json
    {"_id":{"$oid":"..."},"type":"training_options","keyConcepts":[...],"productRecommendations":[...],"gamesAndActivities":[...],"homework":[...],"trainingSkills":[...],"customCategories":[{...}]}
    ```
*   **Client Data Structure:** Documents include `name`, `dogName`, `email`, `phone`, `notes`, `adminNotes`, `addressLine1`, `addressLine2`, `city`, `state`, `addressZipCode`, `emergencyContact`, `dogBreed`, `dogWeight`, `dogSpayedNeutered`, `behaviorConcerns`, `previousTraining`, `clientSource`, `agency`, `sessionRate`, `packageInfo`, `waiverSigned`, `vaccinationRecords`, `dogPhoto`, `liabilityWaiver`, and timestamps (`createdAt`, `updatedAt`).
    ```json
    {"_id":{"$oid":"..."},"name":"...","dogName":"...","email":"...","phone":"...","notes":"","adminNotes":"","addressLine1":"","addressLine2":"","city":"","state":"","addressZipCode":"","emergencyContact": {"name":"", "phone":"", "relationship":""},"dogBreed":"","dogWeight":0,"dogSpayedNeutered":false,"behaviorConcerns":[],"previousTraining":{"has":false, "details":""},"clientSource":"","agency": {"agencyId":"", "revenueSharePercentage":0, "agencyHandlesTax":false},"sessionRate":0,"packageInfo":{"totalSessions":0, "sessionsUsed":0, "packagePrice":0},"waiverSigned":false,"vaccinationRecords":[],"dogPhoto": null,"liabilityWaiver": null,"createdAt":{"$date":{"$numberLong":"..."}},"updatedAt":{"$date":{"$numberLong":"..."}}}
    ```
*   **Contact Form Submission Data Structure:** Stores details from submissions including `name`, `dogName`, `dogBirthdate`, `email`, `phone`, `zipCode`, `message`, and `submittedAt`.
    ```json
    {"_id":{"$oid":"..."},"name":"...","dogName":"...","dogBirthdate":"...","email":"...","phone":"...","zipCode":"...","message":"...","submittedAt":{"$date":{"$numberLong":"..."}}}
    ```
*   **QR Code Data Structure:** Records QR code details such as `name`, `type`, `url`, `description`, `qrCodeUrl`, `style` options, and `createdAt`.
    ```json
    {"_id":{"$oid":"..."},"name":"...","type":"...","url":"...","description":"...","qrCodeUrl":"...","style":{...},"createdAt":{"$date":{"$numberLong":"..."}}}
    ```
*   **Calendar Timeslot Data Structure:** Includes `startTime`, `endTime` (stored as UTC Date objects), `status` (`available`, `booked`), optional `notes`, `bookedByClientId`, `bookedBySessionId`, and `repeatingSeriesId` for recurring timeslots.
    ```json
    {"_id":{"$oid":"..."},"startTime":{"$date":{"$numberLong":"..."}},"endTime":{"$date":{"$numberLong":"..."}},"status":"available","notes":"","bookedByClientId":null,"bookedBySessionId":null,"repeatingSeriesId":null}
    ```
*   **Package Instance Data Structure:** Tracks individual package bookings, including `clientId`, `totalSessions`, `sessionsUsed`, `totalQuotedPrice`, `sessionIds` (array of session IDs linked to this package), and timestamps.
    ```json
    {"_id":{"$oid":"..."},"clientId":"...","totalSessions":5,"sessionsUsed":0,"totalQuotedPrice":500,"sessionIds":[],"createdAt":{"$date":{"$numberLong":"..."}}}
    ```
*   **Dog Training Agency Data Structure:** Manages details for partner agencies, including `name`, `contactPerson`, `phone`, `email`, `address`, `revenueSharePercentage`, `agencyHandlesTax`, `website`, `notes`, and `isActive` status.
    ```json
    {"_id":{"$oid":"..."},"name":"...","contactPerson":"","phone":"","email":"","address":{"street1":"","street2":"","city":"","state":"","zip":""},"revenueSharePercentage":0,"agencyHandlesTax":false,"website":"","notes":"","isActive":true}
    ```

### Application Structure & Layouts

The project uses the Next.js App Router and leverages route groups to manage different sections with distinct layouts.
*   Authenticated admin routes (e.g., `/clients`, `/report-cards`, `/calendar`) are placed within the `app/(main)` route group. The primary navigation bar and Clerk components are located within `app/(main)/layout.tsx`.
*   A public-facing client portal is established within the `app/portal` route group. This section has its own `app/portal/layout.tsx` which does *not* include the admin navigation or Clerk components, providing a separate visual experience for clients.
*   Dynamic routes like `[id]` are implemented within both `(main)` and `portal` groups to display details for specific records (e.g., `/clients/[id]`, `/report-cards/[id]`, `/portal/clients/[id]`, `/portal/report-cards/[id]`).

### Session Pricing Architecture

The application uses a sophisticated multi-layered pricing system that separates client quotes from actual session billing:

**Client-Level Quoted Pricing (Current Form):**
- **Session Rate**: Stored in `Client.sessionRate` - represents the quoted/agreed rate with the customer
- **Package Information**: Stored in `Client.packageInfo` - includes total package price and session count
- **Purpose**: Acts as the baseline quote and reference pricing for the client relationship

**Session-Level Independent Pricing:**
- **Individual Session Rates**: Each `Session` document has its own `quotedPrice` field
- **Flexibility**: Session prices can differ from the client's base rate (discounts, special pricing, etc.)
- **Package Integration**: Sessions can be linked to `PackageInstance` documents for package tracking via `sessionId` array on the package instance and `packageInstanceId` on the session (requires future model updates for session model)
- **Status Tracking**: Sessions have independent status tracking (`pending_payment`, `scheduled`, `completed`, etc.)

**Package Instance Pricing:**
- **Package-Specific Rates**: `PackageInstance` documents have `totalQuotedPrice` for the entire package
- **Session Linking**: Individual sessions within a package are linked back to the `PackageInstance`
- **Historical Tracking**: Package prices are captured at time of booking for historical accuracy

**Architectural Benefits:**
1.  **Quote Flexibility**: Client base rates serve as starting points, but actual session pricing can be adjusted per session.
2.  **Package Variations**: Package instances can have custom pricing independent of client base package rates.
3.  **Historical Accuracy**: Session and package prices are preserved even if client base rates change.
4.  **Business Intelligence**: Allows tracking of quoted vs actual pricing for profitability analysis.
5.  **Independent Billing**: Each session can be billed independently with its own rate and status.

**Recommended Workflow:**
1.  Client intake form sets baseline quoted rates (`Client.sessionRate`, `Client.packageInfo`) and agency details.
2.  When booking sessions via the calendar, rates default to client quotes/package rates but can be modified per session/package instance.
3.  If booking a package, a new `PackageInstance` document is created capturing the specific package pricing at that time.
4.  Individual session documents are created for the booked timeslots, linking back to the client and the `PackageInstance` (if applicable), and capturing their specific `quotedPrice`.
5.  Financial reporting can compare quoted vs actual rates, apply revenue share percentages based on the linked agency, and track package session usage.

---

## Development Log

### 🎯 Current To-Do Items / Questions for AI (Latest)

*   When a client selects and books a timeslot using the portal/[id]/calendar page, assume the session they are actually booking is one hour, rather than it being the length of the timeslot itself. If they select a four-hour timeslot, they should be allowed to choose which one-hour chunk within that timeslot they want. And then our web app should split that long timeslot into multiple — or rather, it should generate new timeslots in addition to the original, and change the times for the original one to be whatever the client selected. so: if there's a 1:00 pm - 5:00 pm timeslot, and the client books a 2:00 pm - 3:00 pm session, our web app should generate a new 1:00 pm - 2:00 pm timeslot, and a new 3:00 pm - 4:00 pm timeslot, and change the original 1:00 pm - 5:00 pm timeslot to be 2:00 pm - 5:00 pm. 

*   there should be an option in the "new report card" page that notes that this is a Day Training Report Card. this should trigger a different component from `report-card-form.tsx` -- we should have a `DayTrainingReportCardForm` component that is similar to `ReportCardForm` but with different fields. we can workshop how exactly these will differ, but one thing right off the bat that is different is, day training report cards should have the ability for madeline to upload a video. cloudinary? cloudflare? tell me what's best when we develop this.

*   I believe there's an issue with our strategy of creating multiple calendartimeslot mongodb documents for recurring timeslots. since we're only going out a certain number of weeks with the new timeslot documents we're creating, the illusion of "weekly" timeslots is not maintained past those weeks. however, we don't want to create more mongodb documents than necessary so as not to bloat the collection. also, since we are deleting old timeslots on a regular schedule (or at least we plan to), maybe we also can create new timeslots on that same schedule which would maintain the weekly timeslot illusion going out multiple weeks? so that at any given time, for a "weekly" timeslot, we have x number of weeks worth of timeslots. we should brainstorm this before we start implementing.

*   **Google Calendar Integration Setup**: Need to configure Google OAuth2 credentials in environment variables:
    - `GOOGLE_CLIENT_ID`: Google OAuth2 client ID from Google Cloud Console
    - `GOOGLE_CLIENT_SECRET`: Google OAuth2 client secret
    - `GOOGLE_REDIRECT_URI`: OAuth callback URL (defaults to localhost:7777/api/google-calendar/auth/callback)

### ✅ Recently Completed Tasks

*   **Fixed Report Card Paragraph Breaks Across All Views**: Resolved issue where paragraph breaks in rich text editor content were not displaying correctly in report card previews, finished report cards, and emails:
    * **Root Cause**: Multiple components were extracting only plain text content, stripping out all HTML formatting including paragraph breaks
    * **Preview Fix**: Updated `EditableListItem` component to render HTML content using `dangerouslySetInnerHTML` with proper paragraph spacing
    * **Finished Report Card Fix**: Updated `FormattedDescription` component to render HTML content instead of plain text
    * **Email Fix**: Updated `ReportCardEmail` component to preserve HTML formatting and add inline paragraph styling for email compatibility
    * **Implementation**: Added proper CSS classes for paragraph spacing (`[&>p]:mb-3 [&>p:last-child]:mb-0`) and inline email styles
    * **Result**: Paragraph breaks and other rich text formatting now display correctly across all report card views and emails
    * Files changed: `components/report-cards/report-card-preview.tsx`, `components/report-cards/formatted-description.tsx`, `emails/ReportCardEmail.tsx`, `guidelines/development-log.md`

*   **Fixed Custom Category Item Addition Bug**: Resolved issue where adding items to custom categories was adding them to all custom categories instead of the specific one:
    * **Root Cause**: Custom categories lacked unique IDs, making it impossible to identify which specific category to add items to
    * **Temporary Solution**: Added "Add IDs to Custom Categories" button that generates unique IDs for existing custom categories
    * **Logic Fix**: Updated custom category item addition logic to properly target the specific category using its unique ID
    * **Result**: Items are now correctly added only to the specific custom category the user is interacting with
    * Files changed: `components/settings/settings-form.tsx`, `guidelines/development-log.md`

*   **Fixed Item Deletion to Use IDs Instead of Titles**: Updated delete functionality to use unique item IDs for reliable deletion:
    * **Root Cause**: Delete operations were using item titles, which could cause issues with duplicate titles or special characters
    * **API Enhancement**: Added DELETE method to `/api/settings/items/[id]/route.ts` that handles deletion by ID for all categories including custom categories
    * **MongoDB Fix**: Used different approaches for regular categories ($pull) vs custom categories (full document update) to avoid complex nested array operations
    * **Frontend Update**: Replaced `deleteKeyConcept` function with generic `deleteItem` function that works with item IDs
    * **State Management**: Updated all delete confirmation dialogs to use item IDs instead of titles
    * **Result**: Reliable deletion of items across all categories using unique identifiers
    * Files changed: `app/api/settings/items/[id]/route.ts`, `components/settings/settings-form.tsx`, `guidelines/development-log.md`

*   **Fixed Google Calendar Multi-Account Connection Issue**: Resolved MongoDB duplicate key error that prevented connecting multiple Google accounts:
    * **Root Cause**: Unique index on `userId` in `GoogleCalendarConnection` collection prevented multiple connections per user
    * **Database Fix**: Dropped problematic unique index and created proper compound indexes for multi-account support
    * **Model Update**: Removed individual field indexes that created unique constraints, keeping only compound indexes
    * **Result**: Users can now successfully connect multiple Google accounts (e.g., geofferyv@gmail.com, hello@geoffvrijmoet.com)
    * Files changed: `models/GoogleCalendarConnection.ts`, `guidelines/development-log.md`

*   **Improved Google Calendar UX with Inline Controls**: Replaced hidden settings dialog with inline calendar management directly on the calendar page:
    * **Inline Calendar Display**: Created `GoogleCalendarInlineManager` component that shows connected Google accounts and their calendars directly on the calendar page
    * **Real-time Calendar Toggles**: Users can check/uncheck individual calendars and see events appear/disappear immediately
    * **Prominent Connect Button**: "Connect Another Account" button is visible and accessible without diving into settings
    * **Account Management**: Each connected account shows email address with easy disconnect option
    * **Better Visual Layout**: Calendars organized by account in a clean 2-column grid with proper spacing
    * **Immediate Feedback**: Calendar toggles save preferences automatically and refresh the calendar view
    * Files changed: `components/GoogleCalendarInlineManager.tsx`, `app/(main)/calendar/page.tsx`, `guidelines/development-log.md`

*   **Enhanced Google Calendar Integration with Auto-Selection**: Improved user experience by automatically selecting all calendars when connecting Google accounts:
    * **Auto-Select on Connection**: Modified OAuth callback to automatically fetch and select all available calendars from newly connected Google accounts
    * **Immediate Event Display**: Users now see Google Calendar events immediately after connecting, without needing to manually save preferences
    * **Accurate Preference Loading**: Updated UI to fetch and display actual stored calendar preferences from database
    * **Better UX Flow**: Eliminated the confusing step where users had to manually "Save Preferences" to start seeing events
    * Files changed: `app/api/google-calendar/auth/callback/route.ts`, `app/api/google-calendar/preferences/route.ts`, `components/GoogleCalendarManager.tsx`, `guidelines/development-log.md`

*   **Enhanced Google Calendar Integration with Multi-Account Support**: Extended Google Calendar integration to support connecting multiple Google accounts per user:
    * **Multi-Account Database Model**: Updated `GoogleCalendarConnection` to store `googleUserId` and `googleEmail` fields, removed unique constraint on `userId`
    * **Enhanced OAuth Flow**: Modified token exchange to fetch and store Google user info (ID/email) for each connected account
    * **Multi-Account API Support**: Updated all endpoints to handle multiple connections per user:
      - `/api/google-calendar/calendars`: Returns calendars grouped by Google account
      - `/api/google-calendar/events`: Accepts calendar selections per account
      - `/api/google-calendar/preferences`: Updates preferences for multiple accounts
      - `/api/google-calendar/disconnect`: Disconnects specific Google accounts
    * **Advanced UI**: Redesigned `GoogleCalendarManager` component with account management:
      - Lists all connected Google accounts with email addresses
      - "Connect Another Account" functionality for additional Google accounts
      - Per-account calendar selection with visual grouping
      - Individual account disconnect capability
      - Improved settings dialog with account organization
    * **Enhanced Event Display**: Google Calendar events now include account info and are visually distinguished
    * **Features**: Multiple Google account support, per-account calendar selection, individual account management, seamless OAuth flow for additional accounts
    * Files changed: `models/GoogleCalendarConnection.ts`, `lib/google-calendar.ts`, `app/api/google-calendar/*`, `components/GoogleCalendarManager.tsx`, `app/(main)/calendar/page.tsx`, `guidelines/development-log.md`

*   Redesigned the client portal details page (`app/portal/clients/[id]/page.tsx`) with a modern hero section, gradient background, quick-action buttons, responsive report-card grid, and improved empty state.
*   Added "Back to Client Portal" button on `app/portal/report-cards/[id]/page.tsx` linking users back to their client overview.
*   Added `export const dynamic = 'force-dynamic'` to `app/api/settings/route.ts` to disable caching in production, ensuring that updates to settings are immediately reflected in the admin UI and report-card option look-ups.
*   Implemented self-service identification page (`app/portal/page.tsx`) with `ClientFinderForm` component, debounce lookup to `/api/portal/find-client`, UX-friendly Tailwind styling, and automatic redirect to `/portal/clients/[id]`.
*   Added public Cloudinary signer endpoint (`app/api/portal/sign-upload/route.ts`) generating short-lived signatures for uploads to `clients/temp/*` folders, enabling unauthenticated intake uploads without exposing `/api/upload`.
*   Added public delete endpoint (`app/api/portal/delete-upload/route.ts`) restricted to `clients/temp/*` files and updated portal intake form to use it instead of protected `/api/upload/delete`.
*   Fixed Cloudinary metadata update logic (`app/api/upload/update-metadata/route.ts`) to remove unsupported `auto` resource_type fallback and always pass the correct `resource_type` to all Cloudinary operations, resolving `No such resource type` errors and ensuring uploaded files are correctly moved from `clients/temp/*` to `clients/client-{id}/*` folders.
*   Added tooltip-based delete flow with progress indicator on Clients list (`components/clients/client-list.tsx`) using Radix Popover; replaced alerts/confirm with inline UI.
*   Implemented responsive design for Clients list: table remains on `sm+`, mobile shows card list without horizontal scrolling; added copy-to-clipboard buttons with persistent "✔ Copied!" feedback and standardized phone formatting.
*   Fixed report-card option look-up for legacy IDs:
    * **API** – Updated helper logic in `/api/report-cards/[id]/send-email` and `/api/report-cards/route.ts` (GET) so `addToMap` no longer requires an `_id` to build the option map. This ensures items that only have an `id` or `legacyId` still resolve correctly, eliminating "Unknown" titles in emails and the admin list.
    * Files changed: `app/api/report-cards/[id]/send-email/route.ts`, `app/api/report-cards/route.ts`, `guidelines/development-log.md`.
*   Added "Additional Contact (Co-owner)" support across admin and client intake:
    * `models/Client.ts` – new `additionalContact` sub-document (name, email, phone)
    * UI fields in `components/clients/client-form.tsx` and `app/portal/intake/page.tsx`
    * Persisted via `/api/clients` (admin) and `/api/clients/intake` (portal) routes.
    * Enables equal portal access & communication for a second owner.
*   Displayed co-owner information on admin client details pages:
    * `components/clients/client-details.tsx` and `components/clients/client-details-mobile.tsx` now render any `additionalContacts` under the "Contact Information" card/mobile section, showing name, email, and phone of each co-owner.
*   Implemented 1-hour booking with automatic timeslot splitting:
    * **API** – Updated `/api/portal/book-timeslot` to atomically:
        * take an optional `selectedStartTime` for the desired one-hour chunk
        * split the original timeslot into one-hour segments before and after the chosen slot
        * mark the chosen hour as booked (`isAvailable:false`, `bookedByClientId`)
    * **UI** – Enhanced `components/ClientCalendar.tsx` to:
        * present a dropdown of one-hour chunks when a multi-hour slot is selected
        * send the chosen start time to the API
        * refresh and show success feedback after booking
    * Ensures clients can book any one-hour window inside a longer slot without admin intervention.
    * Files changed: `app/api/portal/book-timeslot/route.ts`, `components/ClientCalendar.tsx`, `guidelines/development-log.md`.
*   Fixed `id` generation in `/api/settings`:
    * Added robust `extractId()` util that converts JSON-serialized ObjectIds (e.g., `{ $oid:"..." }`) into their hex string, then re-applies it as the `id` field for every option.
    * Prevents the front-end from receiving the bogus string `"[object Object]"`, which led to un-resolvable IDs and "Unknown" item titles in emails.
    * Files changed: `app/api/settings/route.ts`, `guidelines/development-log.md`.
*   Fixed option-map `_id` handling:
    * All helper functions now extract `{ $oid }` when `_id` has been JSON-cloned, preventing `[object Object]` keys and resolving the final "Unknown" title issue across previews and emails.
    * Files changed: `app/api/report-cards/route.ts`, `app/api/report-cards/[id]/route.ts`, `app/api/report-cards/[id]/send-email/route.ts`, `guidelines/development-log.md`.
*   Added color-specific active click feedback to the homepage's action buttons (`app/(main)/page.tsx`), ensuring users see immediate visual confirmation when they press any primary or quick-action button.
*   Implemented animated ripple effect and cursor-wait loading state on Home page buttons:
    * ~~Implemented animated ripple effect and cursor-wait loading state on Home page buttons~~ (replaced by click-shadow pulse).
    * Added sharp color box-shadow pulse and robust cursor reset using pathname change.
    * Files changed: `app/(main)/page.tsx`, `app/globals.css`, `components/route-loading-handler.tsx`, `app/layout.tsx`, `guidelines/development-log.md`.
*   Added delete capability for custom “Report Card Elements” categories:
    * `components/settings/category-box.tsx` – optional delete button (Trash icon) in header when `onDelete` prop provided.
    * `components/settings/settings-form.tsx` – implemented category deletion flow with confirmation dialog, state management, and persistence via `/api/settings`.

---

### Unresolved / Future Considerations

*   **PDF Report Card Download:** Implementing a button to download report cards as PDFs is pending. Guidance for serverless PDF generation on Vercel is available in `guidelines/serverless-pdf-generation.md`.

---
