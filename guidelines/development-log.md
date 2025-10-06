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

*   **PDF Upload Debugging**: Created test page at `/portal/test-pdf-upload` to debug Cloudinary PDF upload issues with liability waiver functionality. The test page replicates the exact same PDF generation and upload flow as the intake form, allowing for isolated testing and debugging of the Cloudinary upload process. Also created `/api/portal/liability-waiver-url` endpoint to generate proper Cloudinary URLs for raw PDF resources.

*   **Liability Waiver File Management Fix**: Disabled the file moving process for liability waivers to keep them in the temp folder (`clients/temp/liability-waivers`) instead of moving them to the final client folder. This prevents the "PDF not found" errors that occur when the database still references the temp folder path but the file has been moved. Liability waivers now stay in the temp folder permanently, making the download process more reliable.

*   When a client selects and books a timeslot using the portal/[id]/calendar page, assume the session they are actually booking is one hour, rather than it being the length of the timeslot itself. If they select a four-hour timeslot, they should be allowed to choose which one-hour chunk within that timeslot they want. And then our web app should split that long timeslot into multiple — or rather, it should generate new timeslots in addition to the original, and change the times for the original one to be whatever the client selected. so: if there's a 1:00 pm - 5:00 pm timeslot, and the client books a 2:00 pm - 3:00 pm session, our web app should generate a new 1:00 pm - 2:00 pm timeslot, and a new 3:00 pm - 4:00 pm timeslot, and change the original 1:00 pm - 5:00 pm timeslot to be 2:00 pm - 5:00 pm. 

*   there should be an option in the "new report card" page that notes that this is a Day Training Report Card. this should trigger a different component from `report-card-form.tsx` -- we should have a `DayTrainingReportCardForm` component that is similar to `ReportCardForm` but with different fields. we can workshop how exactly these will differ, but one thing right off the bat that is different is, day training report cards should have the ability for madeline to upload a video. cloudinary? cloudflare? tell me what's best when we develop this.

*   I believe there's an issue with our strategy of creating multiple calendartimeslot mongodb documents for recurring timeslots. since we're only going out a certain number of weeks with the new timeslot documents we're creating, the illusion of "weekly" timeslots is not maintained past those weeks. however, we don't want to create more mongodb documents than necessary so as not to bloat the collection. also, since we are deleting old timeslots on a regular schedule (or at least we plan to), maybe we also can create new timeslots on that same schedule which would maintain the weekly timeslot illusion going out multiple weeks? so that at any given time, for a "weekly" timeslot, we have x number of weeks worth of timeslots. we should brainstorm this before we start implementing.

*   **Google Calendar Integration Setup**: Need to configure Google OAuth2 credentials in environment variables:
    - `GOOGLE_CLIENT_ID`: Google OAuth2 client ID from Google Cloud Console
    - `GOOGLE_CLIENT_SECRET`: Google OAuth2 client secret

### ✅ Recently Completed Tasks

*   **Settings Page Infinite Loop Fix** - COMPLETED ✅
    *   Fixed infinite re-GET'ing issue on settings page caused by circular dependency between useEffect and saveSettings
    *   Resolved by removing saveSettings dependency from useEffect and using eslint-disable for the warning
    *   Files changed: `components/settings/settings-form.tsx`
    - `GOOGLE_REDIRECT_URI`: OAuth callback URL (defaults to localhost:7777/api/google-calendar/auth/callback)

*   **Contact Form Submission to Client Conversion**: Need to implement the "Convert to Client" functionality that pre-fills the new client form with data from the contact form submission when accessed via the `?fromSubmission=${id}` URL parameter.

### ✅ Recently Completed Tasks

*   **Linked Titles for Report Card Elements (URL Support)**:
    * **Feature**: Allow settings items to include an optional URL and support "title-only" items that render as clickable links.
    * **Admin Settings**: `components/settings/settings-form.tsx` already supports a URL field for items; no schema change required.
    * **Preview (Admin UI)**: Titles now render as links when a URL exists; the trailing colon is hidden if there is no description (title-only link item).
    * **API Mapping**: URL is propagated from settings to report cards in list/detail responses and email composition.
    * **Email Rendering**: Email template renders the item/product title as a hyperlink when a URL is present; supports title-only case (no description).
    * **Files changed**:
      - `app/api/report-cards/route.ts` – include `url` in option map and mapped outputs
      - `app/api/report-cards/[id]/route.ts` – include `url` in option map and mapped outputs
      - `app/api/report-cards/[id]/send-email/route.ts` – include `url` in option map; pass through to email
      - `components/report-cards/report-card-preview.tsx` – clickable titles with URL; hide colon when no description
      - `emails/ReportCardEmail.tsx` – link titles when URL present; handle title-only items

*   **Comprehensive Engineering Wiki Buildout**: Created complete internal engineering documentation covering all aspects of the platform architecture, integrations, and operations.
    * **System Architecture**: Full technology stack documentation including Next.js App Router, MongoDB, authentication, and deployment architecture
    * **Database Schema**: Comprehensive documentation of all MongoDB collections, relationships, indexes, and data models

*   **Enhanced Client Intake Form - Comprehensive Data Collection**: Complete overhaul of the client intake form to capture comprehensive training context and safety information.
    * **New Fields Added**: Pronouns, emergency contacts, additional dogs, enhanced dog information (breed, weight, reproductive status, source, time with dog, diet, favorite things, previous training), household information (other pets, children, allergies), medical information (veterinarian, medical issues, medications), and behavioral information (training goals, bite history, behavioral issues, additional notes).
    * **Technical Implementation**: Enhanced React form state management with nested objects, added helper functions for complex nested data updates, implemented proper TypeScript types, and fixed form field typing issues for better UX.
    * **Backend Updates**: Updated IClient interface and Mongoose schema with comprehensive new fields, enhanced API endpoints to handle new field submission, maintained backward compatibility.
    * **Business Impact**: Enables trainers to have comprehensive context before sessions, improves safety through bite history and medical information capture, supports personalized training approaches, and facilitates better client relationships through inclusive data collection.
    * **Files Modified**: `app/portal/intake/page.tsx`, `models/Client.ts`, `app/api/clients/intake/route.ts`, `app/api/clients/route.ts`, `internal/engineering/architecture/database-schema.md`
    * **API Reference**: Complete REST API documentation with all endpoints, request/response formats, authentication, and error handling
    * **Third-Party Integrations**: Detailed documentation of all external services including Clerk, Cloudinary, Google Calendar, Resend, Twilio, and React-PDF
    * **Deployment Guide**: Complete deployment procedures, environment configuration, monitoring, and troubleshooting for Vercel platform
    * **Security Practices**: Comprehensive security architecture including authentication, data protection, input validation, file upload security, OAuth security, and incident response procedures
    * **Documentation Organization**: Created structured README files for easy navigation and quick reference
    * **Files created/updated**: 
      - `internal/engineering/architecture/system-overview.md` - Complete system architecture
      - `internal/engineering/architecture/database-schema.md` - All data models and relationships
      - `internal/engineering/integrations/api-reference.md` - Complete API documentation
      - `internal/engineering/integrations/third-party-services.md` - All external integrations
      - `internal/engineering/runbooks/deployment.md` - Deployment and infrastructure guide
      - `internal/engineering/standards/security-practices.md` - Security architecture and practices
      - `internal/engineering/README.md`, `internal/engineering/architecture/README.md`, `internal/engineering/integrations/README.md`, `internal/engineering/standards/README.md` - Navigation and organization

*   **Engineering Wiki – PDF Generation & Storage**: Documented current PDF pipeline and comparison with headless Chromium approach.
    * **Content**: React-PDF generation in API, client-side direct uploads to Cloudinary (raw), folder strategy, security, performance, and when to choose Lambda+Chromium.
    * **Files added/updated**: `internal/engineering/architecture/pdf-architecture.md`, `internal/engineering/architecture/README.md`, `internal/engineering/README.md`

*   **Engineering Wiki – Settings System Architecture**: Added comprehensive documentation for the settings system.
    * **Content**: Data model, API endpoints, UI components, ID strategy, persistence flow, sorting/display rules, security/caching, considerations, and file map.
    * **Files added/updated**: `internal/engineering/architecture/settings-architecture.md`, `internal/engineering/architecture/README.md`, `internal/engineering/README.md`

*   **Settings Page – Scrollable Expanded Sections**: Ensured long lists are usable by adding vertical scrolling inside expanded category panels on the settings page.
    * **UX Fix**: Expanded panels now cap height and scroll internally instead of growing past the viewport.
    * **Implementation**: Applied `maxHeight: '70vh'` with `overflowY: 'auto'` when expanded; collapsed state remains hidden and animated via `max-height` transition.
    * **Files changed**: `components/settings/category-box.tsx`

*   **Custom Category Ordering System with Smooth Arrow Controls**: Implemented comprehensive ordering system for custom categories with intuitive up/down arrow controls and smooth user experience:
    * **Database Model**: Added `order` field to `ICustomCategory` interface and `customCategorySchema` in Setting.ts model with default value of 0
    * **Arrow Controls**: Added up/down arrow buttons to the left side of each custom category card for intuitive reordering
    * **Optimistic Updates**: Implemented immediate UI updates before database save for smooth, responsive reordering experience
    * **Loading States**: Added loading states with disabled controls and visual feedback during save operations
    * **Smooth Animations**: Added transitions, pulse animations, and success feedback for enhanced user experience
    * **Real-time Reordering**: Implemented `handleMoveCategoryUp` and `handleMoveCategoryDown` functions that swap order values and save to MongoDB
    * **Smart Arrow States**: Arrow buttons are automatically disabled when categories are at the top (up arrow) or bottom (down arrow) of the list
    * **Error Handling**: Added error recovery that reverts optimistic updates if database save fails
    * **Success Feedback**: Added green pulse animation when reordering completes successfully
    * **Settings Management**: Enhanced settings form to display custom categories sorted by order field with intuitive arrow controls (removed number input fields for cleaner UI)
    * **Report Card Display**: Updated report card form and preview to sort custom categories by order field, ensuring consistent display sequence with Product Recommendations always appearing above custom categories
    * **Automatic Migration**: Added automatic order field assignment when settings page loads, ensuring existing custom categories get order values and are saved to database
    * **API Integration**: Existing API routes automatically handle the new order field through the updated MongoDB schema
    * **User Experience**: Custom categories now display in the order specified by users, with standard categories appearing first, followed by custom categories in their specified order. Users can reorder using intuitive arrow buttons with smooth, responsive feedback.
    * **Result**: Users can now easily reorder custom categories using intuitive arrow controls with smooth animations, immediate feedback, and reliable error handling
    * Files changed: `models/Setting.ts`, `components/settings/settings-form.tsx`, `components/settings/category-box.tsx`, `components/report-cards/report-card-form.tsx`, `components/report-cards/report-card-preview.tsx`, `guidelines/development-log.md`

*   **System-Level Google Calendar Integration for Portal**: Implemented system-level Google Calendar integration to show Madeline's availability to all clients:
    * **System Calendar Model**: Created `SystemGoogleCalendarConnection` model to store system-level Google Calendar connections separate from user-specific connections
    * **System Calendar Functions**: Added system-level functions in `lib/google-calendar.ts` for fetching events without user authentication
    * **Public API Endpoint**: Created `/api/system-google-calendar/events` endpoint that fetches Google Calendar events without requiring user authentication
    * **Portal Integration**: Updated `/api/portal/calendar-timeslots` to include system Google Calendar events as blocked/unavailable times
    * **Admin Management**: Created `SystemGoogleCalendarManager` component for managing system calendar connections directly on the calendar page
    * **OAuth Flow**: Implemented system-level OAuth flow with dedicated auth and callback endpoints for system calendar connections
    * **Privacy Protection**: System calendar events are displayed as "Unavailable" to clients without revealing event details
    * **Graceful Degradation**: Portal continues to work even if system Google Calendar connection fails
    * **Result**: Clients visiting the portal calendar now see Madeline's Google Calendar events as blocked times, preventing double-booking while maintaining privacy
    * Files changed: `models/SystemGoogleCalendarConnection.ts`, `lib/google-calendar.ts`, `app/api/system-google-calendar/*`, `app/api/portal/calendar-timeslots/route.ts`, `components/SystemGoogleCalendarManager.tsx`, `app/(main)/settings/page.tsx`, `guidelines/development-log.md`
*   **Client Portal Liability Waiver E-Sign with Cloudinary Storage**: Added full e-sign flow to the portal intake page and storage pipeline:
    * **API – PDF Generation**: New endpoint generates a waiver PDF from the provided e-signature and uploads it to Cloudinary temp folder (`clients/temp/liability-waivers`) as `raw` resource.
    * **UI – Signature Capture**: Intake page now includes a signature canvas with clear/attach actions. Clicking "Attach Signed Waiver" creates and attaches a signed waiver PDF.
    * **Public Signer Update**: Extended public signer to support `liabilityWaiver` with correct folder/resource type.
    * **Persistence**: Intake API persists `liabilityWaiver` object and moves Cloudinary assets from temp to `clients/client-{id}/liability-waivers` via existing metadata mover.
    * **Cleanup**: Users can remove the attached waiver before submitting; reset deletes temp assets.
    * Files changed: `app/api/portal/generate-liability-waiver/route.ts`, `app/portal/intake/page.tsx`, `app/api/clients/intake/route.ts`, `app/api/portal/sign-upload/route.ts`, `guidelines/development-log.md`


*   **Fixed Google Calendar Token Refresh Issue**: Resolved critical `invalid_grant` error that prevented Google Calendar events from loading:
    * **Root Cause**: Google refresh tokens can expire after 6 months of inactivity or when users revoke access, causing `invalid_grant` errors during token refresh attempts
    * **Enhanced Error Handling**: Updated `getValidAccessToken()` function to detect `invalid_grant` errors and automatically mark expired connections as inactive
    * **Graceful Degradation**: Modified `getUserCalendars()` and `getCalendarEvents()` functions to continue processing other accounts even when one connection fails
    * **User-Friendly Error Messages**: Enhanced API routes to return specific error messages with `requiresReauth` flag when connections expire
    * **UI Improvements**: Updated `GoogleCalendarInlineManager` component to display clear error messages and "Reconnect" buttons when connections expire
    * **Calendar Page Resilience**: Modified calendar page to handle Google Calendar failures gracefully without breaking the entire calendar view
    * **Automatic Cleanup**: Expired connections are automatically marked as inactive to prevent repeated failed attempts
    * **Result**: Users now see clear error messages when Google Calendar connections expire and can easily reconnect their accounts without losing access to other calendar functionality
    * Files changed: `lib/google-calendar.ts`, `app/api/google-calendar/events/route.ts`, `app/api/google-calendar/calendars/route.ts`, `components/GoogleCalendarInlineManager.tsx`, `app/(main)/calendar/page.tsx`, `guidelines/development-log.md`

*   **Contact Form Submissions Management System**: Implemented comprehensive contact form submissions management with full CRUD operations and workflow features:
    * **Enhanced Data Model**: Updated `ContactFormSubmission` model to include missing address fields (`streetAddress`, `city`, `state`) and workflow fields (`reviewed`, `reviewedAt`, `reviewedBy`, `notes`)
    * **API Routes**: Created `/api/contact-form-submissions` for listing with filtering, sorting, and pagination, and `/api/contact-form-submissions/[id]` for individual CRUD operations
    * **Navigation Integration**: Added "Contact Forms" link to main navigation with indigo color scheme for easy access
    * **List Page**: Built comprehensive submissions list with search, filtering (reviewed/unreviewed), sorting, pagination, and status indicators
    * **Detail Page**: Created detailed submission view with contact info, dog info, message display, notes management, and action buttons
    * **Workflow Features**: Added ability to mark submissions as reviewed, add admin notes, and convert submissions to clients
    * **UI/UX**: Implemented responsive design with loading states, empty states, and consistent styling using Tailwind color system
    * **Status Tracking**: Visual indicators for reviewed/unreviewed status with timestamps and reviewer information
    * **Search & Filter**: Full-text search across name, dog name, email, and message fields with status filtering
    * **Pagination**: Smart pagination with page numbers and navigation controls
    * **Phone Number Formatting**: Added consistent phone number formatting across all contact form submission displays using (123) 456-7890 format
    * **Address Display with Google Maps Integration**: Enhanced contact form submission cards to show full street address, city, and state (excluding zip code) with clickable Google Maps links for easy location lookup
    * **Copy to Clipboard Functionality**: Added copy icons next to email and phone numbers on both list and detail pages with visual feedback (checkmark animation) when items are copied to clipboard
    * **Route and UI Updates**: Renamed route from `/contact-form-submissions` to `/new-training-inquiries` and updated page heading to "New Training Inquiries" for better clarity
    * **Enhanced Address Display**: Added Google Maps hyperlink and copy icon to address field on detail page, matching the functionality from the list page
    * **Address Copy Functionality**: Added copy icon next to address on list page cards for easy copying of full addresses
    * **Enhanced Dog Age Display**: Updated dog age display on detail page to show calculated age as primary information (e.g., "3 years 2 months old") with formatted birthdate (e.g., "May 1, 2021") in smaller text below
          * Files changed: `models/ContactFormSubmission.ts`, `app/api/contact-form-submissions/route.ts`, `app/api/contact-form-submissions/[id]/route.ts`, `components/layout/header.tsx`, `app/(main)/new-training-inquiries/page.tsx`, `app/(main)/new-training-inquiries/[id]/page.tsx`, `app/(main)/dog-training-agencies/page.tsx`, `components/clients/client-details.tsx`, `guidelines/development-log.md`

*   **Fixed Report Card Draft ID Preservation**: Resolved critical issue where item IDs were lost when loading drafts, causing "Unknown" items in final report cards:
    * **Root Cause**: When loading drafts, the API was transforming data to only include titles and descriptions, losing the original item IDs needed for proper database storage
    * **Solution**: Updated draft API to preserve original `itemId` as `id` field in transformed data, ensuring IDs are maintained throughout the draft lifecycle
    * **Product Recommendations Fix**: Enhanced product recommendations handling to support both string titles (new selections) and objects with id/title (loaded drafts)
    * **Type Safety**: Updated TypeScript interfaces to properly handle mixed data types for product recommendations
    * **UI Consistency**: Updated product selection logic and preview component to handle both data formats seamlessly
    * **Result**: Drafts now properly preserve item IDs, preventing "Unknown" items when creating final report cards
    * Files changed: `app/api/report-cards/draft/route.ts`, `components/report-cards/report-card-form.tsx`, `components/report-cards/report-card-preview.tsx`, `guidelines/development-log.md`

*   **Improved Report Card Auto-Save Architecture**: Refined the auto-save implementation with better architecture and simplified data model:
    * **Simplified Data Model**: Removed redundant `isFinished` field, using only `isDraft` to track draft vs finished status
    * **Fixed Draft-to-Finished Flow**: Updated main API route to properly update existing drafts instead of creating new documents when "Create Report Card" is clicked
    * **Shared Utility Functions**: Created `lib/report-card-utils.ts` with shared logic for data transformation, reducing code duplication between draft and main API routes
    * **Better Type Safety**: Improved TypeScript handling in API routes to prevent type errors
    * **Maintainable Architecture**: Centralized common operations (ID validation, data transformation, option mapping) to ensure consistency across routes
    * **Efficient Database Operations**: Drafts are now properly updated in-place rather than creating duplicate documents
    * Files changed: `models/ReportCard.ts`, `app/api/report-cards/route.ts`, `app/api/report-cards/draft/route.ts`, `components/report-cards/report-card-form.tsx`, `lib/report-card-utils.ts`, `guidelines/development-log.md`

*   **Enhanced Client Details with Additional Contacts Management**: Added ability to manage additional contacts directly from client details pages:
    * **API Support**: Updated `/api/clients/[id]` PUT route to handle `additionalContacts` field updates
    * **Desktop Component**: Enhanced `ClientDetails` component with inline editing for additional contacts, including add/remove functionality
    * **Mobile Component**: Updated `ClientDetailsMobile` component with similar editing capabilities optimized for mobile
    * **UI Consistency**: Used same patterns as `ClientForm` component for managing additional contacts (name, email, phone fields)
    * **State Management**: Added proper state handling for editing mode with save/cancel functionality
    * **Result**: Users can now add, edit, and remove co-owners/additional contacts directly from client details pages without navigating to separate edit forms
    * Files changed: `app/api/clients/[id]/route.ts`, `components/clients/client-details.tsx`, `components/clients/client-details-mobile.tsx`, `guidelines/development-log.md`

*   **Enhanced Report Card Email Preview with Subject and Recipients**: Improved email preview to show complete email information:
    * **Subject Line Display**: Added subject line preview showing "Training Report Card – [Dog Name] ([Formatted Date])"
    * **Recipient Details**: Enhanced recipient list to show individual names instead of generic "Additional contacts"
    * **Visual Organization**: Reorganized preview into separate sections for subject and recipients with better visual hierarchy
    * **Date Formatting**: Applied same Eastern timezone date formatting to preview subject line
    * **Result**: Users can now see exactly what the email subject will be and who will receive it before sending
    * Files changed: `app/(main)/report-cards/[id]/page.tsx`, `guidelines/development-log.md`

*   **Enhanced Report Card Email Greetings with First Names**: Improved email greetings to use first names only for a more personal touch:
    * **Name Parsing**: Added `getFirstName()` helper function to extract first names from full names (e.g., "Geoff Vrijmoet" → "Geoff")
    * **Greeting Optimization**: Updated send-email route to pass only first names to email component
    * **Preview Fix**: Updated report card preview page to use same first name logic and include additional contacts
    * **Personal Touch**: Emails now display greetings like "Hi Geoff," or "Hi Geoff and Rocco," instead of full names
    * **Robust Parsing**: Handles edge cases like empty names, single names, and malformed input gracefully
    * **Result**: More personal and friendly email greetings that feel less formal while maintaining professionalism
    * Files changed: `app/api/report-cards/[id]/send-email/route.ts`, `app/(main)/report-cards/[id]/page.tsx`, `guidelines/development-log.md`

*   **Enhanced Report Card Email Greetings with Additional Contacts**: Added support for including additional contact names in report card email greetings:
    * **Report Card Creation**: Updated `ReportCardForm` to include `additionalContacts` when creating report cards
    * **Database Storage**: Modified `/api/report-cards` POST route to store additional contacts in report card documents
    * **Email Greeting Logic**: Enhanced `ReportCardEmail` component to dynamically generate greetings like "Hi John and Jane," or "Hi John, Jane, and Bob,"
    * **Smart Formatting**: Implemented proper grammar handling for different numbers of additional contacts (single vs multiple)
    * **API Integration**: Updated send-email route to pass additional contacts to email component
    * **Result**: Report card emails now include all relevant contact names in the greeting, making them more personal and inclusive
    * Files changed: `components/report-cards/report-card-form.tsx`, `app/api/report-cards/route.ts`, `emails/ReportCardEmail.tsx`, `app/api/report-cards/[id]/send-email/route.ts`, `guidelines/development-log.md`

*   **Fixed Report Card Paragraph Breaks Across All Views**: Resolved issue where paragraph breaks in rich text editor content were not displaying correctly in report card previews, finished report cards, and emails:
    * **Root Cause**: Multiple components were extracting only plain text content, stripping out all HTML formatting including paragraph breaks
    * **Preview Fix**: Updated `EditableListItem` component to render HTML content using `dangerouslySetInnerHTML` with proper paragraph spacing
    * **Finished Report Card Fix**: Updated `FormattedDescription` component to render HTML content instead of plain text
    * **Email Fix**: Updated `ReportCardEmail` component to preserve HTML formatting and add inline paragraph styling for email compatibility
    * **Implementation**: Added proper CSS classes for paragraph spacing (`[&>p]:mb-3 [&>p:last-child]:mb-0`) and inline email styles
    * **Result**: Paragraph breaks and other rich text formatting now display correctly across all report card views and emails
    * Files changed: `components/report-cards/report-card-preview.tsx`, `components/report-cards/formatted-description.tsx`, `emails/ReportCardEmail.tsx`, `guidelines/development-log.md`
*   **Enhanced Session Summary with Rich Text Formatting**: Upgraded the session summary field from plain text to full rich text editing with HTML storage:
    * **Form Enhancement**: Replaced `Textarea` with `RichTextEditor` in the report card form, enabling bold, italics, links, lists, and other formatting
    * **HTML Storage**: Session summaries are now stored as HTML in MongoDB, preserving all formatting and structure
    * **Display Updates**: Updated all summary display locations to render HTML content:
      - Report card preview component with proper styling for paragraphs, lists, and links
      - Finished report card display page with consistent HTML rendering
      - Email template with inline styles for email compatibility
      - Portal report card display for client viewing
      - Report cards list with HTML stripping for preview text
      - Portal client page with HTML stripping for card previews
    * **Styling Consistency**: Applied consistent CSS classes for HTML content rendering across all components
    * **Backward Compatibility**: Existing plain text summaries will display normally (no breaking changes)
    * **Result**: Users can now create richly formatted session summaries with professional formatting that displays consistently across all views
    * Files changed: `components/report-cards/report-card-form.tsx`, `components/report-cards/report-card-preview.tsx`, `app/(main)/report-cards/[id]/page.tsx`, `emails/ReportCardEmail.tsx`, `app/portal/report-cards/[id]/page.tsx`, `components/report-cards/report-cards-list.tsx`, `app/portal/clients/[id]/page.tsx`, `guidelines/development-log.md`

*   **Fixed Rich Text Editor Link Click Error inside Lists**:
    * **Issue**: Clicking a newly inserted link while editing inside a bullet point caused a client-side error: `Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node`.
    * **Root Cause**: `BubbleMenu` tooltip DOM nodes were being mounted within mutable list item containers; when Tiptap updated the list structure, the tooltip tried to detach from a node no longer in the tree.
    * **Solution**: Standardized `BubbleMenu` configuration to append to `document.body` and always control visibility via `shouldShow`, avoiding conditional unmount/mount tied to list nodes. Enabled `openOnClick` in the Link extension so links can be clicked while editing. Added an in-editor flow to edit links: link bubble now shows only "Change Link" (removed inline Remove), opening the dialog prefilled with the current URL, with a remove option inside the dialog. Improved reliability by instantly selecting the hovered link range and removing tippy delays so the bubble appears immediately.
    * **Result**: Links can be inserted, edited, and removed while editing list items without runtime DOM errors; the "Change Link" bubble appears instantly on hover and clicks open in a new tab.
    * Files changed: `components/ui/rich-text-editor.tsx`, `guidelines/development-log.md`

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
