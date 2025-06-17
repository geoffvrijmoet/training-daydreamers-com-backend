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

*   I believe there's an issue with our strategy of creating multiple calendartimeslot mongodb documents for recurring timeslots. since we're only going out a certain number of weeks with the new timeslot documents we're creating, the illusion of "weekly" timeslots is not maintained past those weeks. however, we don't want to create more mongodb documents than necessary so as not to bloat the collection. also, since we are deleting old timeslots on a regular schedule (or at least we plan to), maybe we also can create new timeslots on that same schedule which would maintain the weekly timeslot illusion going out multiple weeks? so that at any given time, for a "weekly" timeslot, we have x number of weeks worth of timeslots. we should brainstorm this before we start implementing.

### ✅ Recently Completed Tasks

*   Implemented Admin Report Card View (`app/(main)/report-cards/[id]`).
*   Established Client Portal structure (`app/portal`).
*   Implemented Admin Calendar (`app/(main)/calendar/page.tsx`) with dynamic timeslot fetching, creation popover, and initial UI enhancements (sticky header, month view fix, callback memoization).
*   Implemented Initial Recurring Timeslot functionality (generates 6 weeks ahead).
*   Modified Calendar Timezone Handling to store/display Eastern Time directly.
*   Implemented Client-Facing Calendar System including authentication page (`app/portal/calendar/page.tsx`), client-specific calendar (`app/portal/clients/[id]/calendar/page.tsx`), and related public API endpoints (`/api/portal/find-client`, `/api/portal/calendar-timeslots`, `/api/portal/book-timeslot`). Includes security features requiring dog's name + contact info.
*   Implemented comprehensive Brand Colors system in Tailwind config and applied to client-facing calendar.
*   Implemented Sticky Calendar Header functionality for week and day views.
*   Fixed Calendar Timezone issue by implementing proper UTC to Eastern conversion in API and frontend using `date-fns-tz`.
*   Configured Calendar Time Range to show business hours only (7 AM - 9 PM).
*   Modified Month View navigation to go to Day View on day click.
*   Changed Timeslot Click behavior to display details in a popup/tooltip.
*   Fixed Event Click Issue by removing `display: 'background'` from available timeslots.
*   Updated Timeslot Text Color to black for better readability.
*   Fixed Timeslot Details Time Display by using original string formats from FullCalendar events.
*   Added Escape Key cancellation for timeslot creation popover and drag selections.
*   Improved Drag Styling using brand blue colors.
*   Implemented Visual Selection Persistence during timeslot creation popover.
*   Implemented Recurring Timeslot Audit System (`/api/calendar-timeslots/audit-recurring`) to maintain 6 weeks of recurring timeslots dynamically and clean up old unbooked ones.
*   Implemented Basic Booking Functionality within the timeslot tooltip (placeholder confirmation).
*   Implemented Timeslot Tooltip Interface as a replacement for alert/confirm dialogs, supporting details view, booking form, and delete options.
*   Successfully implemented the comprehensive Client-Facing Calendar System.
*   Implemented Admin Calendar Timeslot Management Enhancements including deletion of single timeslots or recurring series, client name display for booked slots, and updated tooltip interface.
*   Implemented Lighter Color Theme for the Admin Calendar page.
*   Enhanced Client Calendar to show both available and client's own booked sessions with visual differentiation.
*   Added Optional Address Form Addition to the client intake page and Client data model.
*   Added Drag-and-Drop File Upload Enhancement to intake form upload areas.
*   Integrated Cloudinary for File Uploads (`/api/upload`), implementing organized folder structures (`vaccination-records/client-{clientId}/`, `dog-photos/client-{clientId}/`), smart resource handling, metadata enrichment, and CDN optimization.
*   Implemented Enhanced File Upload Experience with file deletion, real-time feedback, form reset cleanup, and automatic background cleanup for temp/orphaned files.
*   Implemented Dual-Layer File Protection System using metadata updates (`/api/upload/update-metadata`) and enhanced cleanup logic to prevent accidental deletion of files referenced in the database.
*   Implemented Admin Client Intake Enhancement including agency management, enhanced client/dog info, advanced file management integration, and business intelligence fields (session usage, intake status).
*   Enhanced Admin Client Intake Form with agency dropdown auto-fill, simplified package entry, per-session rate calculator, specified behavior concerns with "other" input, and real-time financial feedback displays.
*   Enhanced Financial Display & UX Improvements on the admin client intake form, including capitalized behavior concerns, comprehensive three-column financial breakdown (Deductions, Madeline's Portion, Tax Planning) with color coding, and package financial view toggle (Total vs Per-Session).
*   Implemented Dog Training Agencies Management System including data model, CRUD API endpoints (`/api/dog-training-agencies`), and admin interface pages for listing, creating, and editing agencies.
*   Added Cancel Button to the Admin Client Intake Form for better navigation.
*   Refactored Client Details Page (Phase 1) to remove Google Drive integration, use modern card-based layout, display comprehensive client/dog/business info, integrate session management with report card links, and add a "Book Session/Package" button linking to the calendar with pre-filled client ID.
*   Enhanced Calendar Booking System (Phase 2) to handle `clientId` URL parameters for pre-selected clients, auto-triggering the booking flow to the pricing step. Replaced text input with searchable client dropdown (with new client option). Added package/session selection, automatic tax calculation, and price pre-population from client records. Handles package instance creation (DB implementation noted as pending completion).
*   Implemented Inline Client Editing Implementation on the client details page, replacing separate edit page with toggle-based editing of core fields (names, contact, notes).
*   Fixed Number Input Scroll Behavior on pricing inputs in the calendar booking form.
*   Fixed Cloudinary Folder Structure Issue for admin-temp files in the upload API.
*   Implemented Client Delete Functionality including API endpoint (`DELETE /api/clients/[id]`), automatic Cloudinary file deletion, and user confirmation dialogs in both list and details views.
*   Fixed Internal Fetch Issue in File Metadata Updates by replacing internal HTTP calls with direct Cloudinary API calls within the client creation endpoint.
*   Fixed Mixed File Type Organization Issue in Cloudinary updates by implementing a hybrid approach using `upload` for images and `rename` for raw files (PDFs) to ensure all file types move to client folders.
*   Completed File Organization System after investigation, confirming both images and PDFs correctly move to client-specific folders.
*   Implemented Multiple UX Improvements including Sticky Calendar Header, Number Input Scroll Fix, and the initial Inline Client Editing System.
*   Implemented Comprehensive Inline Editing Extension on the client details page to include editing for address, emergency contact, detailed dog info (birthdate, breed, weight, spay/neuter, behavior concerns, previous training), business info (rates, package, source, agency), and file uploads.
*   Fixed Dog Birthdate Timezone Fix in the admin client intake form to save as midnight Eastern Time.
*   Implemented Enhanced Inline Client Editing System features including dog birthdate timezone fix, revenue share input labeling, clickable checkbox labels, and comprehensive file editing system integrated directly into the inline editing flow.
*   Fixed Calendar Client Pre-Population Fix to correctly pre-select client and trigger booking flow when navigating from client details page.
*   Added Calendar Navigation Enhancement by adding a Calendar link to the main header navigation bar.
*   Implemented Animated Welcome Homepage (`app/(main)/page.tsx`) with personalized greeting, animations, action-oriented 2x2 grid layout using brand colors, and secondary quick actions.
*   Resolved Production Build Fixes & Suspense Implementation by wrapping calendar page content in Suspense, cleaning up console statements, fixing Next.js config, updating hook dependencies, and optimizing API files.
*   Added ObjectId support to Settings embedded option items by updating `models/Setting.ts`, created one-time migration script `scripts/migrate-settings-subdoc-ids.ts`, and added `dotenv` runtime dependency for env loading.
*   Enabled ObjectId-based references for report-card option items (key concepts, recommendations, etc.) by updating `models/ReportCard.ts`, adjusting POST/GET logic, and adding migration script.
*   Implemented inline rich-text editing for selected items directly inside the report-card preview pane and on the report-card details page (`EditableListItem`, `ReportCardPreview`, `/report-cards/[id]`).
*   Added PUT handler in `app/api/report-cards/[id]/route.ts` allowing report-cards to be updated (summary, date, selected item descriptions).
*   Converted report-card details page to full client-side inline edit experience (date, summary, item descriptions) with pencil / save / cancel icon controls.
*   Made each report-card card in the admin list clickable (no separate "View Details" button) by wrapping the card in a `<Link>`.
*   Added independent scroll container for preview pane and improved hover/edit UI cues.
*   Fixed ESLint "no-unused-expressions" error in `components/report-cards/report-card-preview.tsx` by replacing logical short-circuit call with optional chaining in the Save button handler.
*   Added legacy `keyConcepts` and `productRecommendations` optional fields back to `IReportCard` interface (models/ReportCard.ts) to maintain backward compatibility with portal report-card page until it is refactored.

---

### Unresolved / Future Considerations

*   **PDF Report Card Download:** Implementing a button to download report cards as PDFs is pending. Guidance for serverless PDF generation on Vercel is available in `guidelines/serverless-pdf-generation.md`.

---
