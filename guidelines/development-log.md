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

*   the following should be done for both the client-side and the admin-side client intake (`app/portal/intake/page.tsx` for client-side, `app/(main)/clients/new/page.tsx` for admin-side):
    *   have a "Additional Contact" field that allows for another name, email and phone number to be added -- make this super friendly for when both clients are essentially going to be equally responsible for the dog, and have equal amounts of access to the portal / equal amounts of communication from Madeline. think of this as a "co-owner" field. be creative and thoughtful in how you implement it, both from UI and backend mongodb/model perspective. 

*   there should be an option in the "new report card" page that notes that this is a Day Training Report Card. this should trigger a different component from `report-card-form.tsx` -- we should have a `DayTrainingReportCardForm` component that is similar to `ReportCardForm` but with different fields. we can workshop how exactly these will differ, but one thing right off the bat that is different is, day training report cards should have the ability for madeline to upload a video. cloudinary? cloudflare? tell me what's best when we develop this.

*   I believe there's an issue with our strategy of creating multiple calendartimeslot mongodb documents for recurring timeslots. since we're only going out a certain number of weeks with the new timeslot documents we're creating, the illusion of "weekly" timeslots is not maintained past those weeks. however, we don't want to create more mongodb documents than necessary so as not to bloat the collection. also, since we are deleting old timeslots on a regular schedule (or at least we plan to), maybe we also can create new timeslots on that same schedule which would maintain the weekly timeslot illusion going out multiple weeks? so that at any given time, for a "weekly" timeslot, we have x number of weeks worth of timeslots. we should brainstorm this before we start implementing.

### ✅ Recently Completed Tasks

*   Redesigned the client portal details page (`app/portal/clients/[id]/page.tsx`) with a modern hero section, gradient background, quick-action buttons, responsive report-card grid, and improved empty state.
*   Added "Back to Client Portal" button on `app/portal/report-cards/[id]/page.tsx` linking users back to their client overview.
*   Added `export const dynamic = 'force-dynamic'` to `app/api/settings/route.ts` to disable caching in production, ensuring that updates to settings are immediately reflected in the admin UI and report-card option look-ups.
*   Implemented self-service identification page (`app/portal/page.tsx`) with `ClientFinderForm` component, debounce lookup to `/api/portal/find-client`, UX-friendly Tailwind styling, and automatic redirect to `/portal/clients/[id]`.
*   Added public Cloudinary signer endpoint (`app/api/portal/sign-upload/route.ts`) generating short-lived signatures for uploads to `clients/temp/*` folders, enabling unauthenticated intake uploads without exposing `/api/upload`.
*   Added public delete endpoint (`app/api/portal/delete-upload/route.ts`) restricted to `clients/temp/*` files and updated portal intake form to use it instead of protected `/api/upload/delete`.
*   Fixed Cloudinary metadata update logic (`app/api/upload/update-metadata/route.ts`) to remove unsupported `auto` resource_type fallback and always pass the correct `resource_type` to all Cloudinary operations, resolving `No such resource type` errors and ensuring uploaded files are correctly moved from `clients/temp/*` to `clients/client-{id}/*` folders.

---

### Unresolved / Future Considerations

*   **PDF Report Card Download:** Implementing a button to download report cards as PDFs is pending. Guidance for serverless PDF generation on Vercel is available in `guidelines/serverless-pdf-generation.md`.

---
