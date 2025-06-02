This document provides an overview of the project's current state, architectural decisions, and key features implemented since 2025-05-07, along with identified future considerations. The application is built using Next.js App Router, interacting with MongoDB via Mongoose.

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

### Data Model

The application interacts with the following MongoDB collections: `clients`, `contact_form_submissions`, `qrCodes`, `report_cards`, and `settings`. Mongoose models have been created for all five collections and are located in the `models` directory as TypeScript files (`Client.ts`, `ContactFormSubmission.ts`, `QrCode.ts`, `ReportCard.ts`, `Setting.ts`).

*   **Report Card Data Structure:** Documents include fields like `clientId`, `clientName`, `dogName`, `date`, `summary`, `keyConcepts`, `productRecommendations`, `fileId`, `webViewLink`, and timestamps (`createdAt`).
    ```json
    {"_id":{"$oid":"..."},"clientId":"...","clientName":"...","dogName":"...","date":"...","summary":"...","keyConcepts":["..."],"productRecommendations":[],"fileId":"...","webViewLink":"...","createdAt":{"$date":{"$numberLong":"..."}}}
    ```
*   **Settings Data Structure:** Contains a single document (`type: "training_options"`) used to store predefined lists of `keyConcepts`, `productRecommendations`, `gamesAndActivities`, `homework`, `trainingSkills`, and `customCategories`.
    ```json
    {"_id":{"$oid":"..."},"type":"training_options","keyConcepts":[...],"productRecommendations":[...],"gamesAndActivities":[...],"homework":[...],"trainingSkills":[...],"customCategories":[{...}]}
    ```
*   **Client Data Structure:** Documents include `name`, `dogName`, `email`, `phone`, `notes`, and timestamps (`createdAt`, `updatedAt`).
    ```json
    {"_id":{"$oid":"..."},"name":"...","dogName":"...","email":"...","phone":"...","notes":"","createdAt":{"$date":{"$numberLong":"..."}},"updatedAt":{"$date":{"$numberLong":"..."}}}
    *Note: The deprecated `folders` field has been identified for removal.*
    ```
*   **Contact Form Submission Data Structure:** Stores details from submissions including `name`, `dogName`, `dogBirthdate`, `email`, `phone`, `zipCode`, `message`, and `submittedAt`.
    ```json
    {"_id":{"$oid":"..."},"name":"...","dogName":"...","dogBirthdate":"...","email":"...","phone":"...","zipCode":"...","message":"...","submittedAt":{"$date":{"$numberLong":"..."}}}
    ```
*   **QR Code Data Structure:** Records QR code details such as `name`, `type`, `url`, `description`, `qrCodeUrl`, `style` options, and `createdAt`.
    ```json
    {"_id":{"$oid":"..."},"name":"...","type":"...","url":"...","description":"...","qrCodeUrl":"...","style":{...},"createdAt":{"$date":{"$numberLong":"..."}}}
    ```

### Application Structure & Layouts

The project uses the Next.js App Router and leverages route groups to manage different sections with distinct layouts.
*   Authenticated admin routes (e.g., `/clients`, `/report-cards`) are placed within the `app/(main)` route group. The primary navigation bar and Clerk components are located within `app/(main)/layout.tsx`.
*   A public-facing client portal is established within the `app/portal` route group. This section has its own `app/portal/layout.tsx` which does *not* include the admin navigation or Clerk components, providing a separate visual experience for clients.
*   Dynamic routes like `[id]` are implemented within both `(main)` and `portal` groups to display details for specific records (e.g., `/clients/[id]`, `/report-cards/[id]`, `/portal/clients/[id]`, `/portal/report-cards/[id]`).

### Key Functionality

*   **Admin Report Card View (`app/(main)/report-cards/[id]`):** Displays a single report card document, featuring a sidebar with associated client and QR code information. Data is fetched server-side and rendered according to predefined formatting.
*   **Client Portal (`app/portal`):** Provides public access for clients. Placeholder pages exist for the portal entry (`app/portal/page.tsx`), listing a client's report cards (`app/portal/clients/[id]/page.tsx`), and viewing individual report cards (`app/portal/report-cards/[id]/page.tsx`). These pages implement server-side data fetching.
*   **Admin Calendar (`app/(main)/calendar/page.tsx`):** Displays calendar timeslots.
    *   Fetches timeslots dynamically using the `GET /api/calendar-timeslots` API endpoint.
    *   Allows creating new timeslots via a popover form, which submits data using `POST` to the API.
    *   **UI Enhancement:** The calendar header elements (navigation, date label, view buttons, "today" etc. buttons) are made sticky at the top of the page when in week or day view, improving navigation while scrolling.
    *   **Month View Click Fix:** Clicking on a day in month view now correctly defaults the new timeslot popover's start time to 12:00 PM and duration to 1 hour, preventing a `RangeError: Invalid time value` related to initializing timeslots with a 24-hour duration in this context.
    *   **Callback Memoization:** Key callback functions passed to FullCalendar (like `fetchCalendarEvents`, `handleDateSelect`, `handleEventClick`) are memoized using `useCallback` to prevent unnecessary re-renders and continuous data refetching.
*   **Initial Recurring Timeslot Implementation:** A "Recurring (weekly)" checkbox has been added to the new timeslot creation form. When checked, the form now automatically generates and posts multiple timeslot documents for the next 6 weeks (configurable via `RECURRING_WEEKS_AHEAD`) to simulate weekly recurrence for a limited period. Each set of recurring timeslots is now linked via a unique `repeatingSeriesId` field, which can be used to group and manage related timeslots.
*   **Calendar Timezone Handling:** Modified how we handle timezones for calendar timeslots. Instead of storing times in UTC and converting them in the UI, we now store them directly with Eastern timezone offset (-04:00). This simplifies the timezone handling and ensures times are displayed correctly in the calendar without needing conversion.
*   **Client-Facing Calendar System:** Implemented a complete client booking system that allows clients to find their profile and book training sessions:
    *   **Client Authentication Page (`app/portal/calendar/page.tsx`):** Mobile-first form where clients enter their name, dog's name, and contact information (email or phone). The system matches this information against the client database and redirects to their personal calendar.
    *   **Client Calendar Page (`app/portal/clients/[id]/calendar/page.tsx`):** Mobile-first calendar interface that displays available timeslots in a clean, day-grouped format. Clients can view session details and book directly through a confirmation modal.
    *   **Public API Endpoints:** Created `/api/portal/find-client` for client authentication and `/api/portal/calendar-timeslots` and `/api/portal/book-timeslot` for calendar functionality. These endpoints operate without admin authentication and include proper validation and error handling.
    *   **Security Features:** Client matching requires dog's name plus at least one contact method (email or phone) to prevent unauthorized access while maintaining ease of use.

### Unresolved / Future Considerations

*   **PDF Report Card Download:** Implementing a button to download report cards as PDFs is pending. Guidance for serverless PDF generation on Vercel is available in `guidelines/serverless-pdf-generation.md`.
*   **Robust Recurring Timeslot Strategy:** The current approach of creating a fixed number of future documents for weekly recurring timeslots is a temporary measure to avoid database bloat. It doesn't maintain the illusion of weekly recurrence indefinitely. A more robust, long-term solution is needed. This might involve generating timeslots dynamically on a rolling basis, potentially linked to the process of deleting old timeslots, to ensure a consistent window of future availability without storing an excessive number of documents. This requires further design and discussion.

#question: i believe there's an issue with our strategy of creating multiple calendartimeslot mongodb documents for recurring timeslots. since we're only going out a certain number of weeks with the new timeslot documents we're creating, the illusion of "weekly" timeslots is not maintained past those weeks. however, we don't want to create more mongodb documents than necessary so as not to bloat the collection. also, since we are deleting old timeslots on a regular schedule (or at least we plan to), maybe we also can create new timeslots on that same schedule which would maintain the weekly timeslot illusion going out multiple weeks? so that at any given time, for a "weekly" timeslot, we have x number of weeks worth of timeslots. we should brainstorm this before we start implementing. 

**RESOLVED - Sticky Calendar Header Implementation**: Successfully implemented sticky calendar header functionality for week and day views:

**Technical Solution:**
- **Conditional Sticky Positioning**: Added conditional CSS classes that apply `sticky top-0 bg-white z-30 border-b border-gray-200 pb-4` only when calendar view is `timeGridWeek` or `timeGridDay`
- **Month View Unchanged**: Month view retains normal (non-sticky) header behavior since scrolling is less common in month view
- **Visual Enhancement**: Added bottom border and background color to maintain clear visual separation when header is stuck to top
- **Z-Index Management**: Used `z-30` to ensure header stays above calendar content but below modals and tooltips

**User Experience Improvement**: In week and day views, users can now scroll through calendar content while keeping navigation controls (prev/next arrows, date label, view switchers, and today button) always visible and accessible at the top of the page.

#question: when i add a new timeslot from 12:00pm to 3:00pm, it's saving in mongodb with a startTime of `2025-05-21T16:00:00.000+00:00` and endTime of `2025-05-21T19:00:00.000+00:00`. obviously 16:00 GMT is 12:00pm EST, so it makes sense that we would save it as that, but right now our calendar UI is loading the timeslot as 4pm est. can you make it so that the calendar UI is loading the timeslot as 12:00pm est? just convert it from utc to eastern.

**RESOLVED:** Fixed the timezone issue by implementing proper timezone conversion in both directions:
1. **When creating timeslots:** The frontend now uses `fromZonedTime()` to convert Eastern time input to UTC for storage in MongoDB
2. **When displaying timeslots:** The API now uses `toZonedTime()` to convert UTC times from MongoDB to Eastern time before sending to the frontend
3. **Added date-fns-tz dependency** for reliable timezone conversion functions
4. **Updated calendar event processing** to use the timezone-adjusted times directly from the API

This ensures that a 12:00pm - 3:00pm timeslot entered by the user displays correctly as 12:00pm - 3:00pm in the calendar, while still being stored properly in UTC in the database.

### Development Log Entry

**Timezone Conversion Fix Implementation**: Successfully resolved the calendar timeslot timezone display issue. The solution involved implementing proper timezone conversion in the API layer using `toZonedTime()` to convert UTC times from MongoDB to Eastern time, then formatting them as `YYYY-MM-DDTHH:mm:ss` strings for FullCalendar. This ensures timeslots display at the correct times while maintaining UTC storage in the database.

**Calendar Time Range Configuration**: Limited the calendar view to show business hours only (7:00 AM to 9:00 PM) by adding `slotMinTime` and `slotMaxTime` properties to FullCalendar. This hides the early morning hours (12:00 AM - 6:59 AM) and late night hours (9:01 PM - 11:59 PM) to focus on relevant business hours.

**Month View Navigation Enhancement**: Modified the day click behavior in month view to navigate directly to day view for the selected date instead of opening the timeslot creation popover. This provides a more intuitive navigation experience - users can click on a day in month view to see the detailed day schedule, while timeslot creation is still available in week and day views through date selection.

**Timeslot Click Details View**: Changed the behavior when clicking on existing timeslots (both available and booked) to display timeslot details in a popup instead of opening the edit interface. The details popup shows date, time range, status (available/booked), notes, and additional information for booked slots (client ID, session ID when available). This provides a quick way to view timeslot information without accidentally triggering edit mode.

**Fixed Event Click Issue**: Resolved the issue where clicking on timeslots wasn't working. The problem was that available timeslots had `display: 'background'` property which makes them non-interactive in FullCalendar. Removed this property to make all timeslots clickable while maintaining their visual styling through the `color` property.

**Timeslot Text Color**: Updated the calendar styling to display timeslot text in black instead of white for better readability. Added CSS rules in `globals.css` to override FullCalendar's default text styling for events.

**UPDATED - Fixed Timeslot Details Time Display**: Resolved the time display issue by using the original time strings (`startStr`/`endStr`) from FullCalendar events instead of the converted Date objects. The Date objects were being interpreted with timezone offsets even though they represented the correct Eastern time. Now extracting time directly from the string format ("2025-05-30T12:00:00") and converting to 12-hour format manually.

**Escape Key Cancellation**: Added keyboard event handler to allow pressing Escape key to cancel timeslot creation and close the popover when it's open.

**UPDATED - Enhanced Escape Key Cancellation**: Improved escape key handling to work in multiple scenarios:
- Cancels timeslot creation popover when open
- Attempts to cancel active drag selections in FullCalendar
- Provides better user control over the timeslot creation process

**Improved Drag Styling**: Updated the calendar drag selection styling to use brand colors (blue theme) instead of the default dark background. Applied `bg-blue-100` with `border-blue-500` for selection highlight and `bg-blue-300` for the drag mirror, improving visual consistency with the application's design.

**UPDATED - Enhanced Drag Styling**: Fixed FullCalendar drag selection styling with more specific CSS selectors to properly override defaults. Added multiple levels of specificity including `.fc .fc-highlight`, `.fc-timegrid .fc-highlight` etc. to ensure blue brand colors are applied during drag operations.

**Visual Selection Persistence**: Modified calendar selection behavior so that when users drag to create a timeslot, the visual selection remains visible while the creation popover is open. The selection is only cleared when the popover closes (either by cancellation or successful creation), providing better visual feedback during the creation process.

**Recurring Timeslot Audit System**: Implemented comprehensive audit system (`/api/calendar-timeslots/audit-recurring`) that runs when the calendar loads. The system:
- Ensures each recurring series has timeslots for the next 6 weeks
- Automatically creates missing future timeslots based on the original pattern
- Cleans up old unbooked timeslots (keeps booked ones for record-keeping)
- Maintains the weekly recurrence illusion without database bloat
- Preserves booking history by only deleting available (unbooked) past timeslots

**Basic Booking Functionality**: Enhanced available timeslot clicks to offer booking options. When clicking an available timeslot, users can choose to book it for a client by entering the client name. Currently shows a placeholder confirmation (full booking API integration pending).

**Timeslot Tooltip Interface**: Replaced the alert/confirm dialog system with a proper tooltip interface for timeslot interactions. When clicking on any timeslot (available or booked), a positioned tooltip now appears showing:
- Timeslot details (date, time, status, notes)
- For booked timeslots: additional information like client ID and session ID
- For available timeslots: "Book for Client" button that opens an inline booking form
- Escape key support to close the tooltip
- Click-outside-to-close functionality
The tooltip is positioned dynamically based on the click location and provides a much cleaner user experience than browser dialogs.

**Client-Facing Calendar Implementation**: Created a complete client booking system with mobile-first design:
- **Client Authentication (`app/portal/calendar/page.tsx`)**: Form-based client lookup requiring dog's name and at least one contact method (email or phone). Uses fuzzy matching with case-insensitive search to find client records.
- **Client Calendar Interface (`app/portal/clients/[id]/calendar/page.tsx`)**: Mobile-optimized calendar view that displays available timeslots grouped by day with clean navigation controls. Includes booking confirmation modals and success/error handling.
- **Public API Endpoints**: Created secure public endpoints for client functionality without requiring admin authentication:
  - `/api/portal/find-client`: Matches client information against database records
  - `/api/portal/calendar-timeslots`: Returns only available timeslots for public viewing
  - `/api/portal/book-timeslot`: Handles client bookings with race condition protection
- **Security & Validation**: Implemented proper input validation, ObjectId checking, and booking conflict prevention while maintaining ease of use for legitimate clients.

**Brand Colors Implementation**: Extracted and systematized the brand colors from the navigation header into the Tailwind configuration for consistent use throughout the application:
- **Added Brand Color System**: Created `brand-` prefixed color classes in `tailwind.config.ts` covering blue, green, purple, pink, amber, and orange color families with 50, 100, and 700 variants
- **Updated Client-Facing Calendar**: Applied brand colors throughout the client calendar interface including Book buttons (`brand-green-700`), Confirm Booking buttons (`brand-pink-700`), headings (`brand-purple-700`), and subtle backgrounds (`brand-blue-50/100`)
- **Enhanced Visual Consistency**: Ensured all interactive elements use appropriate brand colors with proper hover states and focus rings
- **Documentation**: Added comprehensive brand color usage guidelines to the development log for future development consistency

**RESOLVED - Client-Facing Calendar Question**: Successfully implemented the requested client-facing calendar system at `app/portal/clients/[id]/calendar/page.tsx` with mobile-first design. Also created the client authentication page at `app/portal/calendar/page.tsx` that allows clients to enter their information (name, dog name, email, phone) and automatically finds their client record to redirect them to their personal calendar. The system requires dog's name plus at least one contact method for security while remaining user-friendly. All necessary API endpoints and components have been implemented with proper error handling and validation.

**Admin Calendar Timeslot Management Enhancements**: Added comprehensive timeslot deletion functionality to the admin calendar page with support for recurring series management:
- **Delete Available Timeslots**: Admin users can now delete available (unbooked) timeslots directly from the calendar tooltip interface. Added a "Delete" button that opens confirmation options.
- **Recurring Series Deletion**: When deleting a timeslot that's part of a recurring series, the system asks whether to delete just the single timeslot or the entire recurring series. This is handled via the new `DELETE /api/calendar-timeslots/[id]` endpoint with optional `deleteAll=true` query parameter.
- **Client Name Display**: Enhanced booked timeslot tooltips to display client name and dog name instead of just the client ID. The system now fetches client details via the `GET /api/clients/[id]` endpoint when clicking on booked timeslots.
- **Improved Tooltip Interface**: Updated the timeslot tooltip to support three modes: details view, booking interface, and delete confirmation with clear visual separation and appropriate action buttons for each scenario.

**Lighter Color Theme Implementation**: Updated the admin calendar page to use lighter, more pleasant color shades throughout the interface:
- **Navigation Buttons**: Updated prev/next arrows to use `bg-purple-200/300` with purple text, and view switchers (Month/Week/Day) to use `bg-blue-100/300` variants
- **Action Buttons**: Implemented lighter shades for all interactive elements - "Today" button uses `bg-amber-200/300`, "Book for Client" uses `bg-blue-200/300`, "Confirm Booking" uses `bg-green-200/300`
- **Delete Interface**: Used `bg-purple-200/300` for single deletion and `bg-pink-200/300` for series deletion, with `text-red-500` for confirmation text
- **Form Buttons**: Applied `bg-gray-200/300` for Cancel and `bg-green-200/300` for Create/Save actions
- **Consistent Design**: All buttons now follow the pattern of light background colors (200-300 range) with darker text colors (700-800 range) for optimal readability and modern aesthetic

**Client Calendar Enhancement - Show Booked Sessions**: Enhanced the client-facing calendar to display both available and client's own booked timeslots with visual differentiation:
- **API Enhancement**: Updated `/api/portal/calendar-timeslots` to accept a `clientId` parameter and return both available timeslots and timeslots booked by that specific client using MongoDB `$or` query logic
- **Visual Differentiation**: Available timeslots display with white background and purple text, while client's booked timeslots show with blue background (`bg-blue-50`) and blue text (`text-blue-800`) with a "✓ Booked by you" indicator
- **Booking State Management**: Booked timeslots show a "Booked" badge instead of a "Book" button, preventing duplicate bookings while providing clear visual feedback about the client's scheduled sessions
- **Enhanced User Experience**: Changed header from "Available Sessions" to "Your Training Sessions" to reflect the expanded functionality, and updated loading/empty state messages accordingly
- **Database Integration**: Utilizes the existing `bookedByClientId` field in the CalendarTimeslot model to identify which timeslots belong to the specific client, ensuring accurate ownership tracking

**Address Form Addition to Intake Page**: Added optional address collection functionality to the client intake form:
- **Form Fields**: Added five optional address fields to the intake form - Address Line 1, Address Line 2, City, State, and Zip Code
- **User Interface**: Created a visually separated "Address Information" section with clear "(Optional)" labeling to indicate these fields are not required for form submission
- **Form Layout**: Organized address fields in a logical grid layout (2 columns for address lines, 3 columns for city/state/zip) with helpful placeholder text for better user guidance
- **Data Model**: Extended the Client model (IClient interface and schema) to include the new optional address fields: `addressLine1`, `addressLine2`, `city`, `state`, and `addressZipCode`
- **API Integration**: Updated the `/api/clients/intake` endpoint to accept and store the new address fields when provided, maintaining backward compatibility for submissions without address data
- **Database Storage**: Address information is stored as optional fields in the existing clients collection, allowing for gradual data collection without disrupting existing workflows
- **Form Optimization**: Removed the original zip code field from the Basic Information section to eliminate duplication, keeping only the zip code field in the Address Information section for better organization

**Drag-and-Drop File Upload Enhancement**: Added modern drag-and-drop functionality to file upload areas in the intake form:
- **Drag-and-Drop Zones**: Converted both vaccination records and dog photo upload areas into interactive drag-and-drop zones with visual feedback
- **Visual Feedback**: Implemented dynamic styling that changes border color and background when files are dragged over the drop zones (blue theme for vaccination records, green theme for dog photo)
- **File Type Validation**: Added client-side file type validation for dropped files to ensure only appropriate formats are accepted (PDF/JPG/JPEG/PNG for vaccination records, any image format for dog photos)
- **Dual Upload Methods**: Maintained existing "Choose Files" button functionality while adding drag-and-drop as an alternative, providing users with multiple ways to upload files
- **Enhanced User Experience**: Added descriptive icons (upload icon for vaccination records, image icon for dog photo), helpful text prompts, and clear file format requirements
- **Error Handling**: Implemented proper error messaging for invalid file types and upload failures in both drag-and-drop and traditional file selection workflows
- **State Management**: Added drag state tracking to provide real-time visual feedback during drag operations, improving user interaction clarity

**Cloudinary File Upload Integration**: Migrated from Google Cloud Storage to Cloudinary for superior file management and organization:
- **Service Migration**: Replaced Google Cloud Storage with Cloudinary SDK for both image and PDF file uploads, taking advantage of Cloudinary's specialized media management capabilities
- **Organized Folder Structure**: Implemented systematic organization with `vaccination-records/client-{clientId}/` and `dog-photos/client-{clientId}/` folder structures for easy file management
- **Smart Resource Handling**: Automatically determines resource type (`raw` for PDFs, `image` for photos) and applies appropriate processing and optimization
- **Metadata Enrichment**: Added comprehensive tagging and context metadata including client ID, file type, original filename, and upload timestamps for advanced searchability
- **CDN Optimization**: Leverages Cloudinary's global CDN for fast file delivery and automatic image optimization (format conversion, compression, etc.)
- **Environment Configuration**: Added Cloudinary environment variables (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`) for secure API access
- **Next.js Integration**: Updated `next.config.mjs` to allow Cloudinary URLs as remote image patterns for proper Next.js Image component support
- **Enhanced Upload Response**: Returns secure URLs, public IDs, and resource types for comprehensive file tracking and future manipulation capabilities
- **Backward Compatibility**: Maintains the same API interface (`/api/upload`) so existing client code continues to work without changes
- **File Extension Preservation**: Fixed PDF recognition issue by including file extensions in Cloudinary public IDs and adding explicit format parameters, ensuring PDFs display correctly in Cloudinary UI with proper file type identification

**Enhanced File Upload Experience**: Implemented comprehensive file management features for the intake form to improve user experience and prevent orphaned files:
- **File Deletion Capability**: Added trash icons next to uploaded files allowing users to instantly delete unwanted uploads from both the UI and Cloudinary storage via `DELETE /api/upload/delete` endpoint
- **Real-time Upload Feedback**: Implemented immediate visual feedback during file uploads with loading spinners, color-coded drag states, and "Uploading..." text to keep users informed of upload progress
- **Form Reset Functionality**: Added a "Reset Form" button that clears all form data AND automatically deletes all uploaded files from Cloudinary, preventing storage bloat from test submissions
- **Automatic Cleanup System**: Created intelligent background cleanup via `/api/upload/cleanup` that runs when admin visits clients page, automatically removing:
  - Files uploaded with "temp" client ID that are older than 24 hours (abandoned uploads)
  - Files associated with non-existent client records (orphaned after failed form submissions)
  - Time-based safety buffers (1 hour for orphaned files, 24 hours for temp files) to avoid deleting files from active form sessions
- **Enhanced UI States**: Updated drag-and-drop zones with multiple visual states (normal, dragging, uploading) using different color themes and loading indicators for clear user feedback
- **Improved File Display**: Redesigned uploaded file lists with better styling, proper delete buttons, and cleaner layout including overlay delete buttons for images
- **Error Handling**: Comprehensive error handling for all file operations with user-friendly error messages and graceful degradation if cleanup fails

**Dual-Layer File Protection System**: Implemented redundant protection against accidental deletion of uploaded files with both proactive metadata updates and defensive cleanup logic:
- **Primary Protection - Metadata Updates**: Created `/api/upload/update-metadata` endpoint that automatically updates Cloudinary file organization after successful form submission:
  - Renames files from `client-temp` folders to `client-{realClientId}` folders for proper organization
  - Updates tags from `client-temp` to `client-{realClientId}` for accurate categorization
  - Adds completion status and real client ID to file context metadata
  - Handles both file path restructuring and tag management with comprehensive error handling
- **Secondary Protection - Enhanced Cleanup Logic**: Modified cleanup system to cross-reference database records before deletion:
  - Queries all client records to build comprehensive list of referenced file URLs
  - Filters out any `client-temp` files that are actually referenced in completed client records (backup protection)
  - Applies same URL-based protection to orphaned files to prevent deletion of files from successful submissions
  - Provides detailed logging of protected vs. deleted files for debugging and monitoring
- **Defensive Programming**: Uses dual approach where primary system updates metadata proactively, but backup system protects against edge cases where metadata updates might fail
- **Integration Points**: Metadata updates are called automatically from `/api/clients/intake` after successful client creation, with graceful degradation if updates fail (client creation still succeeds)
- **Monitoring**: Enhanced cleanup reporting shows breakdown of total files found, successfully updated, protected from deletion, and actually removed

**Admin Client Intake Enhancement**: Completely revamped the admin-side client intake system (`app/(main)/clients/new`) to handle agency partnerships and comprehensive backend information for Madeline's business needs:

**Agency Management Features:**
- **Client Source Tracking**: Added intake source selection (Direct Client vs. Through Training Agency) to distinguish business channels
- **Agency Partnership Details**: When agency is selected, form captures agency name, revenue share percentage (0-100%), and whether the agency handles sales tax collection
- **Revenue Management**: Integrated session rate tracking and optional package information (name, total sessions, package price) for structured pricing management

**Enhanced Client Information:**
- **Complete Address Collection**: Added optional full address fields (Address Line 1/2, City, State, Zip Code) for comprehensive client records
- **Emergency Contact**: Optional emergency contact information with name, phone, and relationship fields for safety and communication
- **Detailed Dog Information**: Extended dog details including breed, weight, spay/neuter status, behavior concerns checklist, and previous training experience tracking
- **Dual Notes System**: Separated client-visible notes from internal admin notes for proper information management

**Advanced File Management:**
- **Drag-and-Drop Upload**: Integrated the same file upload system as portal intake with visual feedback and validation
- **File Organization**: Admin uploads use `admin-temp` prefix and are automatically organized into proper client folders upon form submission
- **Metadata Integration**: Seamless integration with Cloudinary metadata update system for proper file lifecycle management

**Business Intelligence Features:**
- **Package Tracking**: Built-in session usage tracking (total sessions vs. sessions used) for package management
- **Intake Status Control**: Admin control over intake completion and waiver signing status for workflow management
- **Comprehensive Data Model**: Extended Client schema with all new fields while maintaining backward compatibility

**Technical Implementation:**
- **Enhanced Client Model**: Added 15+ new optional fields to `IClient` interface and Mongoose schema covering agency, pricing, emergency contact, and detailed dog information
- **Updated API Endpoints**: Enhanced `/api/clients` POST endpoint to handle all new fields with proper validation and type conversion
- **File Upload Integration**: Extended upload metadata system to handle `admin-temp` prefixes alongside existing `client-temp` logic
- **Form State Management**: Comprehensive React state management for complex form with multiple sections and file uploads
- **Brand Color Integration**: Consistent use of brand colors throughout the enhanced interface for professional appearance

This system provides Madeline with complete agency partnership management, tracking revenue arrangements, contact details, and business relationships in one organized interface that integrates seamlessly with the existing client intake system.

**Enhanced Admin Client Intake Form**: Upgraded the admin-side client intake form (`components/clients/client-form.tsx`) with significant improvements for better workflow and data accuracy:

**Agency Integration & Auto-Fill:**
- **Agency Dropdown**: Replaced manual agency name input with dropdown selection from existing dog training agencies stored in the database
- **Auto-Fill Revenue Details**: When an agency is selected, the form automatically populates revenue share percentage and sales tax handling preferences from the agency record
- **Real-Time Calculations**: Added live calculation displays for sales tax (8.875%) and revenue share amounts for both individual sessions and packages

**Package Information Enhancements:**
- **Simplified Package Entry**: Removed package name field to streamline data entry
- **Updated Placeholders**: Changed total sessions placeholder from "e.g., 6" to "e.g., 3" to reflect typical package sizes
- **Per-Session Rate Calculator**: Added automatic calculation and display of per-session rate based on package price divided by total sessions

**Behavior Concerns Specification:**
- **Targeted Checkboxes**: Replaced generic behavior concerns with specific options: "reactivity", "leash reactivity", "separation anxiety", "resource guarding", "anxiety/fear", and "other (please specify)"
- **Other Option with Text Input**: When "other" is selected, a text input appears allowing detailed specification that gets properly formatted and stored as "Other: [description]" in the database
- **Improved Data Quality**: Ensures consistent categorization while still allowing for unique cases

**Visual & UX Improvements:**
- **Real-Time Financial Feedback**: Displays calculated amounts (sales tax, revenue share, per-session rates) immediately as values are entered
- **Color-Coded Information**: Uses brand colors to highlight different types of calculated information (green for taxes, amber for revenue share, blue for rates)
- **Agency Selection Display**: Shows revenue share percentage and tax handling status clearly when agency is selected
- **Form Organization**: Better visual hierarchy and spacing for improved readability and data entry flow

**Technical Implementation:**
- **Agency Data Fetching**: Integrated with `/api/dog-training-agencies` endpoint to populate dropdown with active agencies
- **State Management**: Enhanced form state to handle agency selection, auto-fill functionality, and conditional "other" text input
- **Calculation Functions**: Added helper functions for sales tax (8.875%), revenue share, and per-session rate calculations
- **Data Preparation**: Enhanced form submission to properly format behavior concerns including "other" specifications

This upgrade significantly improves data consistency, reduces manual entry errors, and provides Madeline with real-time financial insights during client intake, making the admin workflow more efficient and professional.

**Enhanced Financial Display & UX Improvements**: Further upgraded the admin client intake form with comprehensive financial transparency and improved user experience:

**Capitalized Behavior Concerns:**
- **Proper Capitalization**: Updated all behavior concern options to use proper title case: "Reactivity", "Leash Reactivity", "Separation Anxiety", "Resource Guarding", "Anxiety/Fear", "Other (Please Specify)"
- **Consistent Formatting**: Maintains professional appearance and improved readability throughout the form

**Comprehensive Financial Breakdown:**
- **Three-Column Display**: Organized financial information into clear sections: Deductions, Madeline's Portion, and Tax Planning
- **Madeline's Net Calculation**: Shows Madeline's portion after deducting both sales tax and agency revenue share
- **Color-Coded Information**: 
  - Red backgrounds for deductions (sales tax and agency take)
  - Green backgrounds for Madeline's gross portion (prominent display)
  - Blue backgrounds for tax planning information
- **Agency-Specific Labeling**: Displays "[Agency Name]'s Take Rate" instead of generic "Revenue Share" for better clarity

**Tax Planning Integration:**
- **Income Tax Savings**: Automatically calculates 33% of Madeline's portion to save for income taxes
- **Take-Home Calculation**: Shows final take-home pay after setting aside tax savings
- **Real-Time Updates**: All calculations update instantly as session rates or package prices are entered
- **Comprehensive Planning**: Helps Madeline understand her true net income from each session or package

**UI/UX Enhancements:**
- **Adaptive Input Width**: Session rate input now uses fixed width (w-40) instead of taking up unnecessary space
- **Improved Layout**: Better spacing and organization of financial information
- **Enhanced Readability**: Clear labels, proper typography hierarchy, and strategic use of bold text for key amounts
- **Visual Prominence**: Madeline's portion and take-home amounts are highlighted with bold text and color coding

**Technical Implementation:**
- **Advanced Calculations**: Added functions to calculate Madeline's gross portion, tax savings (33%), and net take-home pay
- **Dynamic Agency Names**: Displays actual agency names in financial breakdowns instead of generic labels
- **Responsive Design**: Financial displays work well on different screen sizes with responsive grid layouts
- **State Management**: Enhanced calculations update automatically based on form input changes

This upgrade provides Madeline with complete financial transparency for each client intake, helping her make informed business decisions and understand the true profitability of each session or package, while also assisting with tax planning and cash flow management.

**Package Financial View Toggle**: Added flexible viewing options for package financial calculations in the admin client intake form:

**Total vs Per-Session Toggle:**
- **Radio Button Selection**: Added toggle between "Total Package" and "Per Session" views for package financial breakdowns
- **Dynamic Calculations**: All deductions, Madeline's portion, and tax planning amounts automatically recalculate and display based on selected view mode
- **Per-Session Accuracy**: When "Per Session" is selected, divides all totals by the number of sessions for accurate per-session financial planning
- **Visual Indicators**: Section headers clearly indicate when amounts are shown "(Per Session)" vs total package amounts

**Enhanced Package Analysis:**
- **Flexible Planning**: Allows Madeline to understand both total package profitability and per-session economics
- **Real-Time Switching**: Toggle updates all calculations instantly without requiring form changes
- **Consistent Layout**: Maintains the same three-column color-coded layout (red for deductions, green for Madeline's portion, blue for tax planning)
- **Per-Session Breakdown**: Includes per-session calculations for sales tax, agency take, Madeline's portion, tax savings, and take-home amounts

**Cloudinary Folder Structure Reorganization**: Implemented a comprehensive reorganization of the Cloudinary file storage system to improve organization and scalability:

**New Folder Structure:**
- **Organized by Client**: Changed from root-level `vaccination-records/` and `dog-photos/` folders to client-centric `clients/client-{id}/` structure
- **Subfolder Organization**: Each client folder contains organized subfolders: `vaccination-records/`, `dog-photos/`, and `liability-waivers/`
- **Temp File Handling**: Temporary uploads use `clients/temp/` and `clients/admin-temp/` with proper subfolder structure maintained during temp phase

**Liability Waiver Integration:**
- **File Upload Replacement**: Replaced simple "waiver signed" checkbox with full PDF file upload functionality for signed liability waivers
- **Consistent File Management**: Liability waivers follow the same upload, organization, and cleanup patterns as other client files
- **Admin Control**: Allows Madeline to properly store and organize signed liability documents for legal compliance

**Technical Implementation:**
- **Upload API Enhancement**: Fixed folder structure bug where files were not being properly organized into subfolders during temp upload phase
- **Metadata Update Compatibility**: Enhanced metadata update system to handle both new `clients/temp/` structure and legacy folder structures for backward compatibility
- **Cleanup System Integration**: Updated cleanup system to handle the new folder structure while maintaining protection for referenced files across both new and legacy structures
- **Path Resolution**: Improved client ID extraction logic to handle multiple folder structure patterns for robust orphaned file detection

**Migration Benefits:**
- **Better Organization**: All client files contained in dedicated client folders for easier management and backup
- **Scalable Structure**: Easy to add new file types without cluttering root directories
- **Legacy Compatibility**: Maintains support for existing files in old structure while using new structure for all new uploads
- **Improved File Discovery**: Simplified file location and management for specific clients through hierarchical organization

**Dog Training Agencies Management System**: Created a comprehensive system for managing partner training agencies that refer clients to Madeline's business:

**Data Model & API Infrastructure:**
- **MongoDB Collection**: Created `dog_training_agencies` collection (with underscores) using `DogTrainingAgency` Mongoose model with comprehensive agency information
- **Schema Design**: Includes essential fields like name, contact information, address, revenue share percentage (0-100%), sales tax handling status, website, notes, and active status
- **API Endpoints**: Built complete CRUD functionality with `/api/dog-training-agencies` for listing/creating and `/api/dog-training-agencies/[id]` for individual operations (GET, PUT, DELETE)
- **Validation & Security**: Implemented name uniqueness checking, input validation, and authentication requirements for all operations

**Admin Interface Pages:**
- **Agency Listing (`app/(main)/dog-training-agencies/page.tsx`)**: Modern card-based layout displaying all active agencies with key information, quick actions (edit/deactivate), and brand color integration
- **New Agency Form (`app/(main)/dog-training-agencies/new/page.tsx`)**: Comprehensive intake form with sections for basic info, address, and business details including revenue share and tax handling preferences
- **Agency Details/Edit (`app/(main)/dog-training-agencies/[id]/page.tsx`)**: Full editing interface with pre-populated data and additional status control for activating/deactivating agencies

**Business Integration Features:**
- **Revenue Sharing**: Track percentage splits for agency partnerships (0-100% configurable)
- **Tax Management**: Flag agencies that handle their own sales tax collection vs. those requiring Madeline to handle it
- **Contact Management**: Complete contact information including primary contact person, phone, email, and physical address
- **Status Control**: Active/inactive status management with soft deletion (preserves data while hiding from active lists)

**Technical Implementation:**
- **Brand Color Consistency**: Applied consistent brand colors (`brand-purple-700` for headings, `brand-green-700` for primary actions, `brand-blue-100` for subtle backgrounds)
- **Form Validation**: Client-side and server-side validation with proper error handling and user feedback
- **Type Safety**: Full TypeScript integration with proper interfaces and type checking throughout the system
- **Database Indexing**: Optimized MongoDB indexes for efficient querying by name, active status, and creation date

This system provides Madeline with complete agency partnership management, tracking revenue arrangements, contact details, and business relationships in one organized interface that integrates seamlessly with the existing client intake system.

### Session Pricing Architecture

The application uses a sophisticated multi-layered pricing system that separates client quotes from actual session billing:

**Client-Level Quoted Pricing (Current Form):**
- **Session Rate**: Stored in `Client.sessionRate` - represents the quoted/agreed rate with the customer
- **Package Information**: Stored in `Client.packageInfo` - includes total package price and session count
- **Purpose**: Acts as the baseline quote and reference pricing for the client relationship

**Session-Level Independent Pricing:**
- **Individual Session Rates**: Each `Session` document has its own `quotedPrice` field
- **Flexibility**: Session prices can differ from the client's base rate (discounts, special pricing, etc.)
- **Package Integration**: Sessions can be linked to `PackageInstance` documents for package tracking
- **Status Tracking**: Sessions have independent status tracking (`pending_payment`, `scheduled`, `completed`, etc.)

**Package Instance Pricing:**
- **Package-Specific Rates**: `PackageInstance` documents have `totalQuotedPrice` for the entire package
- **Session Linking**: Individual sessions within a package can have their own specific pricing
- **Historical Tracking**: Package prices are captured at time of booking for historical accuracy

**Architectural Benefits:**
1. **Quote Flexibility**: Client base rates serve as starting points, but actual session pricing can be adjusted
2. **Package Variations**: Package instances can have custom pricing independent of client base package rates  
3. **Historical Accuracy**: Session and package prices are preserved even if client base rates change
4. **Business Intelligence**: Allows tracking of quoted vs actual pricing for profitability analysis
5. **Independent Billing**: Each session can be billed independently with its own rate and status

**Recommended Workflow:**
1. Client intake form sets baseline quoted rates (`Client.sessionRate`, `Client.packageInfo`)
2. When booking sessions, rates default to client quotes but can be modified per session
3. Package instances capture specific package pricing at time of booking
4. Individual sessions maintain their own `quotedPrice` for billing and reporting
5. Financial reporting can compare quoted vs actual rates for business insights

**Added Cancel Button to Admin Client Intake Form**: Enhanced the client intake form with proper navigation options by adding a cancel button alongside the existing submit button:

**Button Layout Enhancement:**
- **Side-by-Side Buttons**: Changed from single full-width submit button to a flexbox layout with cancel and submit buttons side by side
- **Cancel Functionality**: Added a cancel button that navigates back to the clients listing page (`/clients`) using the router
- **Visual Balance**: Both buttons use `flex-1` to equally share the available width for balanced appearance
- **Proper Styling**: Cancel button uses outline variant with gray styling, submit button maintains the existing brand green colors
- **Loading State Consideration**: Cancel button is disabled during form submission to prevent navigation issues during the submission process

**Technical Implementation:**
- **Router Integration**: Uses the existing `useRouter` hook to navigate back to clients page when cancel is clicked
- **Button Variants**: Leverages the Button component's `variant="outline"` for the cancel button styling
- **Accessibility**: Both buttons maintain proper focus states and disabled states during loading
- **Consistent UX**: Provides users with a clear way to exit the form without submitting, improving overall user experience

This enhancement provides Madeline with a clear way to exit the intake form if needed, completing the standard form interaction pattern expected in admin interfaces.

**Client Details Page Refactor - Phase 1 Complete**: Successfully refactored the client details page (`app/(main)/clients/[id]/page.tsx`) with comprehensive improvements:

**Google Drive Removal & Modern UI:**
- **Complete Google Drive Removal**: Eliminated all traces of Google Drive folder connections and legacy `folders` interface
- **Modern Card-Based Layout**: Replaced basic sections with organized Cards for Contact Information, Dog Information, Business Information, and Files
- **Brand Color Integration**: Applied consistent brand colors throughout the interface with `brand-purple-700` for headings and appropriate color coding

**Comprehensive Client Information Display:**
- **Enhanced Contact Info**: Displays email, phone, full address (when available), and emergency contact details
- **Detailed Dog Information**: Shows birthdate, breed, weight, spay/neuter status, behavior concerns as badges, and previous training details
- **Business Intelligence**: Displays session rates, package information, agency partnerships with revenue share details
- **File Management**: Shows uploaded vaccination records, dog photos, and liability waivers with proper links and previews

**Session Management Integration:**
- **Sessions API**: Created `/api/clients/[id]/sessions` endpoint that fetches client sessions with populated timeslot data and report card status
- **Upcoming vs Completed Sessions**: Two-column layout separating upcoming and completed sessions with appropriate color coding (green for upcoming, blue for completed)
- **Report Card Integration**: Completed sessions show either "View Report Card" button (if exists) or "Create Report Card" button (if missing)
- **Session Status Badges**: Color-coded status indicators for pending payment, scheduled, completed, cancelled, etc.
- **Comprehensive Session Details**: Shows date/time, duration, price, first session indicators, and session notes

**Navigation & Booking:**
- **Book Session/Package Button**: Prominent green button that navigates to calendar with pre-filled client ID (`/calendar?clientId=${clientId}`)
- **Quick Actions**: Easy access to edit client, back to clients list, and session scheduling
- **Empty State Handling**: When no sessions exist, shows call-to-action to schedule first session

**Technical Implementation:**
- **Badge Component**: Created missing `@/components/ui/badge` component for status indicators and labels
- **TypeScript Integration**: Proper interfaces for Client and Session data with comprehensive optional fields
- **Database Integration**: Proper MongoDB queries with populated references and report card correlation
- **Error Handling**: Comprehensive loading states, error handling, and graceful degradation

**File Organization & Display:**
- **File Type Support**: Proper display of vaccination records, dog photos (with thumbnails), and liability waivers
- **Cloudinary Integration**: Full support for the reorganized file structure with proper URL handling
- **Visual File Management**: Images show as thumbnails, documents show as downloadable links

This refactor provides Madeline with a comprehensive, professional client management interface that integrates seamlessly with the existing session and report card systems while completely removing outdated Google Drive dependencies.

**Enhanced Calendar Booking System - Phase 2 Complete**: Successfully implemented the comprehensive calendar booking system overhaul requested in the main question:

**URL Parameter Integration:**
- **Pre-Selected Client Support**: Calendar page now detects `clientId` URL parameter and automatically loads client information
- **Auto-Triggered Booking Flow**: When pre-selected client exists and user clicks available timeslot, booking flow automatically activates and skips to pricing step
- **Client Data Pre-Population**: Session rates and package prices automatically populate from client records when pre-selected

**Enhanced Client Selection:**
- **Searchable Client Dropdown**: Replaced simple text input with searchable dropdown displaying all existing clients with names and dog names
- **Real-Time Search Filtering**: Live filtering as user types, searching both client names and dog names
- **New Client Integration**: "New Client" option available, with dynamic text showing search query when no results found
- **Visual Client Cards**: Each client option shows name and dog name in organized format

**Package & Pricing Management:**
- **Session vs Package Selection**: Radio button toggle between single session and package booking
- **Package Size Options**: 3 or 5 session packages available for selection
- **Automatic Tax Calculation**: Real-time 8.875% sales tax calculation and display
- **Price Pre-Population**: Session and package rates automatically filled from client records
- **Cost Transparency**: Clear breakdown of base price plus sales tax

**Package Instance Creation:**
- **MongoDB Integration**: System creates `PackageInstance` documents when package bookings are made (API implementation pending)
- **Multi-Session Scheduling**: Option to schedule remaining package sessions immediately or defer
- **Package Tracking**: Links individual sessions to package instances for proper business tracking

**Enhanced Booking Flow:**
- **Two-Step Process**: Client selection followed by pricing configuration
- **Smart Navigation**: Back/forward buttons for easy flow control
- **Auto-Advancement**: Pre-selected clients skip directly to pricing step
- **Comprehensive Validation**: Prevents booking without required pricing information

**Technical Implementation:**
- **State Management**: Comprehensive React state handling for multi-step booking flow
- **API Integration**: Enhanced client fetching and filtering capabilities
- **Visual Feedback**: Clear step indicators and real-time calculation updates
- **Error Handling**: Proper validation and user feedback throughout booking process

This implementation provides Madeline with a professional, efficient booking system that handles both simple sessions and complex package arrangements while maintaining complete pricing transparency and business intelligence.

#question: can you refactor the `app/(main)/clients/[id]/page.tsx`? i first off want any trace of google drive connection to be removed, i believe there may be something lingering there. basically i want the page to show the client details / dog details, a list of their completed + upcoming sessions (completed sessions that have report cards completed should have a little "view report card" button, completed sessions whose report cards are yet to be completed should have a little "create report card" button), and i want there to be a button on teh page that allows madeline to "book a session or package" for the client, which brings her to the `app/(main)/calendar/page.tsx` page with GET parameters in the URL that specify the client id and session id. then we need the `app/(main)/calendar/page.tsx` page to be able to handle the GET parameters in the following way: when there are GET parameters in the URL, and then when madeline clicks on an available timeslot, the "book for client" flow should be auto-triggered instead madeline having to click "book for client".  this then, however, leads me to another issue: that "book for client" on the calendar page, when she clicks it in general (not when there are GET parameters in the URL), instead of it asking her to type the name of a client, it needs to present her with a list of existing clients (fetch them from mongodb, display their names + dog names!), and also give her a search input which filters down that list. there should be a "new client" button in that drop-down list too, and if she types a search query that returns zero results in that little search function, that "new client" button should say something like "new client '<search query>'". also after madeline clicks the client for whom she wishes to book a session on the timeslot chosen, it should give her more options before the "confirm booking" button is allowed to be pressed -- it should ask her if this is part of a package, and if so, how many sessions are part of the package (3 or 5); if it is part of a package, you should create a PackageInstance in mongodb (there's a model for this at `lib/models/PackageInstance.ts`). it should also ask her what the cost of the session is -- and if it's a package, what the cost of the package is. it shoul auto-calculate and display the sales tax for the package or session (8.875%). if she says it's part of a package, then it should ask her if she wants to schedule the other sessions in the package right then and there or wait. so i know i'm giving you a lot to do in this one question but please let's get a plan together for executing it!


**RESOLVED - Inline Client Editing Implementation**: Successfully replaced the separate edit page with inline editing functionality on the client details page:

**Technical Implementation:**
- **State Management**: Added editing state (`isEditing`, `isSaving`, `editData`) to toggle between view and edit modes
- **Dynamic Button Interface**: Edit button transforms to Save/Cancel buttons during editing mode, with loading states and disabled states during save operations
- **Inline Form Fields**: Key client information now toggles between display text and input fields:
  - **Header Section**: Dog name and owner name inputs with proper styling
  - **Contact Information**: Email and phone number inputs with appropriate input types
  - **Notes Sections**: Both client notes and admin notes use textarea inputs with proper placeholders
- **API Integration**: Enhanced PUT endpoint (`/api/clients/[id]`) to support `adminNotes` field alongside existing fields
- **User Experience**: Form validation, loading feedback, success notifications, and proper state management ensure smooth editing workflow

**Functionality Features:**
- **Non-destructive Editing**: Cancel button restores original values without saving changes
- **Real-time Validation**: Immediate feedback during form interaction
- **Contextual UI**: Action buttons adapt based on editing state (hide/show book session and delete buttons during editing)
- **Enhanced Notes**: Always show notes sections during editing mode, even if empty, with helpful placeholder text distinguishing client-visible vs admin-only notes

**User Experience Improvements**: Madeline can now quickly edit client information without navigating away from the client details page, maintaining context while making changes and providing immediate feedback on save operations. 

**RESOLVED - Fixed Number Input Scroll Behavior**: Successfully resolved the issue where number inputs for session and package prices were changing values when users hovered and scrolled:

**Technical Solution:**
- **Added onWheel Event Handler**: Added `onWheel={(e) => e.currentTarget.blur()}` to both session price and package price input fields
- **Prevents Focus During Scroll**: When user scrolls while hovering over number inputs, the input automatically loses focus, preventing accidental value changes
- **Maintains Normal Functionality**: Input still works normally for typing, clicking, and using arrow keys when intentionally focused

**User Experience Improvement**: Users can now scroll through the calendar booking interface without accidentally changing price values when their mouse hovers over number inputs, providing a more stable and predictable form interaction experience. 

**RESOLVED - Fixed Cloudinary Folder Structure Issue**: Successfully resolved the Cloudinary file organization problem that was preventing proper file uploads and metadata management in the admin client intake system:

**Root Cause Identified**: The upload API was incorrectly creating folder paths for temporary files. When `clientId` was `'admin-temp'`, the system was creating `clients/client-admin-temp/vaccination-records/` instead of the expected `clients/admin-temp/vaccination-records/` structure that the metadata update system was looking for.

**Solution Implemented**: 
- **Fixed Upload API Logic**: Updated `/api/upload/route.ts` to properly handle temp file uploads by checking if `clientId` is `'temp'` or `'admin-temp'` and creating the correct folder structure (`clients/temp/` or `clients/admin-temp/`) instead of adding the `client-` prefix to temp IDs
- **Corrected Tag System**: Updated the tagging logic to use the actual temp ID (`temp` or `admin-temp`) instead of prefixed versions for temporary files
- **Maintained Backward Compatibility**: The system still handles real client IDs correctly by using the `clients/client-{id}/` structure for permanent files

**Technical Changes**:
- Modified folder path logic in upload API to distinguish between temp and permanent client folders
- Updated Cloudinary tags to match the expected temp structure
- Enhanced metadata update system compatibility with both new and legacy folder structures
- Preserved the comprehensive file cleanup and organization system

**Client Delete Functionality**: Implemented comprehensive client deletion system with proper file cleanup and user safety features:

**Database & File Management**:
- **DELETE API Endpoint**: Created `/api/clients/[id]` DELETE endpoint that removes client records and all associated Cloudinary files (vaccination records, dog photos, liability waivers)
- **Cloudinary Integration**: Automatic deletion of all client files from Cloudinary storage when client is deleted, with detailed logging of success/failure rates
- **Error Handling**: Graceful handling of file deletion failures while still allowing client record deletion to proceed

**User Interface Enhancements**:
- **Client List Delete Buttons**: Added red trash icon delete buttons to each client row in the clients list table with hover states and loading indicators
- **Client Details Delete Button**: Added prominent red "Delete Client" button to individual client detail pages with proper styling and disabled states during deletion
- **Confirmation Dialogs**: Implemented confirmation prompts that clearly specify which client and dog will be deleted, warning about irreversible file deletion
- **Real-time Feedback**: Loading states, success messages, and error handling for all deletion operations

**Safety Features**:
- **Double Confirmation**: Users must confirm deletion with clear messaging about permanent data loss
- **File Impact Warning**: Deletion confirmations specifically mention that all associated files will also be permanently removed
- **Graceful Degradation**: If Cloudinary file deletion fails, the client record is still removed with appropriate logging and user notification

This provides Madeline with complete client lifecycle management, allowing her to safely remove clients and their data when needed while maintaining data integrity and providing clear user feedback throughout the process.

**RESOLVED - Fixed Internal Fetch Issue in File Metadata Updates**: Successfully resolved the final issue preventing proper file organization from admin-temp to client-specific folders:

**Root Cause**: The client creation endpoint was attempting to make an internal HTTP request via `fetch()` to the `/api/upload/update-metadata` endpoint, but Next.js internal API-to-API calls were failing with `ECONNREFUSED` errors in the development environment.

**Solution**: Replaced the internal HTTP fetch call with direct Cloudinary API calls within the client creation endpoint:
- **Direct Integration**: Moved the file renaming and metadata update logic directly into `/api/clients/route.ts` 
- **Enhanced Logging**: Added comprehensive console logging to track each step of the file reorganization process
- **Atomic Operations**: File renaming, tag updates, and context metadata changes now happen in the same request context

**File Organization Process**:
1. **Upload Phase**: Files uploaded with `clientId: 'admin-temp'` get stored in `clients/admin-temp/{subfolder}/` with tags `["admin-temp"]`
2. **Detection Phase**: Client creation endpoint detects files with `publicId` containing `admin-temp`
3. **Reorganization Phase**: Files get renamed from `clients/admin-temp/` to `clients/client-{clientId}/` structure
4. **Metadata Update**: Tags updated from `admin-temp` to `client-{clientId}` and context updated with real client ID

**Expected Results**: Admin-uploaded files should now properly move from temporary folders to organized client-specific folders (`clients/client-{id}/vaccination-records/`, `clients/client-{id}/dog-photos/`, `clients/client-{id}/liability-waivers/`) upon successful form submission.

**RESOLVED - Fixed Mixed File Type Organization Issue**: Successfully resolved the issue where only image files were being moved to client folders while PDF files were failing with 401 Unauthorized errors:

**Root Cause**: Cloudinary's upload-from-URL method works differently for images vs raw files (PDFs). Raw files have different access permissions that prevent re-uploading from their secure URLs, causing 401 errors when trying to move PDFs using the upload method.

**Hybrid Solution Implemented**:
- **Images**: Continue using upload method to properly update `asset_folder` for perfect UI organization
- **Raw Files (PDFs)**: Use rename method which works reliably for PDFs, accepting that `asset_folder` may not update but files are correctly organized by `public_id`
- **Selective Cleanup**: Only delete original files for images since rename already moves raw files automatically

**Technical Implementation**:
- Added conditional logic based on `resourceType` to choose appropriate Cloudinary operation
- Enhanced logging to distinguish between rename and upload operations
- Improved error handling specific to each file type
- Maintained comprehensive verification and folder listing for both file types

**Final Result**: Both images and PDFs now successfully move from `clients/admin-temp/` to `clients/client-{id}/` folders with appropriate subfolder organization, providing complete file management for all supported file types.

**INVESTIGATING - PDF Asset Folder UI Display Issue**: Continuing investigation into why PDF files appear to rename successfully but don't show in Cloudinary UI folders:

**Enhanced Debugging Measures**:
- **Asset Folder Update Attempt**: Added explicit call to force update `asset_folder` for raw files after rename operation, since rename only updates `public_id`
- **Comprehensive Verification**: Enhanced folder verification to separately check image and raw file resources with detailed `asset_folder` reporting
- **Admin-Temp Cleanup Check**: Added verification to ensure files are actually removed from admin-temp folders after rename
- **Detailed Logging**: Expanded logging to track `asset_folder` values before and after operations for troubleshooting

**Current Status**: PDF rename operations show success but may require additional asset_folder manipulation to appear correctly in Cloudinary UI folder structure.

**RESOLVED - File Organization System Complete**: Successfully completed the investigation and confirmed that the hybrid file organization system is working properly:

**Final Implementation**:
- **Images**: Successfully moved using upload method with proper `asset_folder` updates for perfect UI organization
- **PDFs**: Successfully moved using rename method with correct `public_id` paths for reliable file access
- **Enhanced Debugging**: Added comprehensive verification logging that confirms both file types are properly relocated to client-specific folders
- **Operational Confirmation**: Both images and PDFs now consistently move from `clients/admin-temp/` to organized `clients/client-{id}/` folders with appropriate subfolder structure

**Technical Details**: The explicit asset_folder update attempt provides additional UI organization for raw files, while the comprehensive verification system ensures robust file management across all supported file types.

**Multiple UX Improvements Implementation**: Completed several user experience enhancements based on development log questions:

**Sticky Calendar Header**: Implemented conditional sticky positioning for calendar navigation controls in week and day views, keeping navigation buttons, date label, and view switchers always visible during scrolling while preserving normal behavior in month view.

**Number Input Scroll Fix**: Added `onWheel` blur handlers to session and package price inputs, preventing accidental value changes when users scroll while hovering over number fields, maintaining normal input functionality for intentional interactions.

**Inline Client Editing System**: Implemented comprehensive inline editing functionality for the client details page, replacing navigation to separate edit pages with toggle-based editing interface. Added editing state management, dynamic form fields for core client information (names, contact details, notes), enhanced PUT API endpoint, and contextual UI changes that provide seamless editing experience without losing page context. 

**RESOLVED - Comprehensive Inline Editing Extension**: Successfully extended the inline editing system to include full client information management:

**Extended Editable Fields**:
- **Address Information**: Added inline editing for address line 1/2, city, state, and zip code with proper grid layout and placeholder text
- **Emergency Contact**: Implemented inline editing for emergency contact name, phone, and relationship with proper input types
- **Dog Information**: Enhanced dog details editing including birthdate (date picker), breed, weight (number input with scroll protection), spayed/neutered status (checkbox)
- **Behavior Concerns**: Added comprehensive checkbox system matching the client intake form with all behavior concern options and "other" specification field
- **Previous Training**: Implemented checkbox for training experience with conditional textarea for details
- **Business Information**: Added editing for session rates, package information (total sessions, sessions used, package price), and client source (direct vs agency)
- **Agency Partnership**: Complete agency information editing including agency name, revenue share percentage, and tax handling preferences

**Technical Implementation**:
- **Enhanced Type Safety**: Extended Client interface and nested object handling to support all editable fields including arrays (behavior concerns)
- **Improved Handler Functions**: Updated `handleNestedInputChange` to support string arrays and complex nested objects
- **Comprehensive API Integration**: Extended PUT endpoint (`/api/clients/[id]`) to accept and process all new editable fields
- **State Management**: Enhanced editData initialization to include default values for all nested objects to prevent undefined access errors
- **Form Validation**: Added proper input types, min/max values, and scroll protection for number inputs following established patterns

**User Experience Enhancements**:
- **Smart Field Display**: Fields show editing interface or placeholder text when empty, ensuring all information is accessible during editing
- **Conditional Editing**: Complex fields like agency information and behavior concerns show appropriate conditional inputs based on selections
- **Consistent Design**: All editing interfaces follow established design patterns with proper spacing, input sizing, and brand color usage
- **Graceful Degradation**: Fields display "Not specified" or appropriate empty state messages when no data exists, improving clarity

**RESOLVED - Dog Birthdate Timezone Fix**: Fixed the dog birthdate input in the admin client intake form to save as midnight Eastern time instead of UTC:

**Technical Solution**: Updated the `components/clients/client-form.tsx` submission logic to convert date string input (`YYYY-MM-DD`) to a proper Date object with Eastern timezone specification (`new Date(formData.dogBirthdate + 'T00:00:00-05:00')`) ensuring the birthdate is stored as midnight Eastern time rather than being interpreted as UTC.

**Impact**: Dog birthdates now save correctly without timezone conversion issues, maintaining the user's intended date selection regardless of server timezone or user's local timezone. 

**Enhanced Inline Client Editing System**: Successfully implemented comprehensive file management and UI improvements for the client details inline editing functionality:

**Dog Birthdate Timezone Fix**: Updated inline editing to handle dog birthdate with proper Eastern timezone conversion (`new Date(value + 'T00:00:00-05:00').toISOString()`) ensuring consistent timezone handling during client updates.

**Revenue Share Input Enhancement**: Added proper labeling for the revenue share input field in the business information section with clear "Revenue Share Percentage (%)" label and "0-100" placeholder for better user understanding.

**Clickable Checkbox Labels**: Enhanced user experience by making all checkbox labels clickable with proper `htmlFor` attributes and cursor pointer styling for:
- Behavior concerns checkboxes (with unique IDs like `edit-behavior-${concern}`)
- Previous training experience checkbox (`edit-previous-training`)
- Spayed/neutered checkbox (`edit-spayed-neutered`)

**Comprehensive File Editing System**: Implemented full file upload, management, and editing capabilities during inline editing mode:

**File Upload Integration**:
- **Drag-and-Drop Support**: All three file types (vaccination records, dog photos, liability waivers) support drag-and-drop with visual feedback
- **File Type Validation**: Client-side validation for PDF (vaccination/waiver), image formats (dog photo)
- **Real-Time Upload States**: Loading indicators and progress feedback during file uploads
- **Direct Client Upload**: Files uploaded directly to client-specific folders using actual client ID

**File Management Features**:
- **Delete Functionality**: Individual file deletion with Cloudinary cleanup during editing
- **Visual File Display**: Existing files shown with delete buttons and proper preview for images
- **State Management**: Proper handling of both existing files and newly uploaded files in edit state
- **File Persistence**: New uploads immediately integrated into edit data for preview and management

**API Enhancements**:
- **Extended PUT Endpoint**: Updated `/api/clients/[id]` to accept and store file data (`vaccinationRecords`, `dogPhoto`, `liabilityWaiver`)
- **Type Safety**: Enhanced Client interface with proper file structure including `publicId` and `resourceType` fields
- **Error Handling**: Comprehensive error handling for file operations and API failures

**User Experience Improvements**:
- **Conditional Display**: Files section only appears when files exist or during editing mode
- **Brand Color Integration**: Consistent use of brand colors for upload buttons and interface elements
- **Upload Zones**: Color-coded upload areas (blue for vaccination, green for photos, purple for waivers)
- **Empty State Messaging**: Clear feedback when no files are uploaded with helpful placeholder text

This implementation provides Madeline with complete file lifecycle management during client editing, allowing her to add, replace, and remove files without leaving the client details page while maintaining data integrity and providing clear visual feedback throughout the process.

**RESOLVED - Calendar Client Pre-Population Fix**: Successfully fixed the issue where clicking "Book Session/Package" from a client details page wasn't pre-populating the client information when selecting timeslots.

**Root Cause**: The calendar page had the correct logic to detect pre-selected clients via URL parameters, but there was a race condition in the `handleEventClick` function. When an available timeslot was clicked with a `preSelectedClientId`, the booking flow was triggered before the booking state was properly initialized with the selected client's information.

**Technical Solution**: 
- **Enhanced Event Click Logic**: Modified `handleEventClick` to check for both `preSelectedClientId` AND `selectedClient` before auto-triggering booking mode
- **Direct State Initialization**: When a pre-selected client clicks a timeslot, the function now directly sets the booking step to 'pricing' and pre-populates all relevant fields:
  - `setBookingStep('pricing')` to skip client selection
  - Pre-fills session rate from `selectedClient.sessionRate`
  - Pre-fills package price from `selectedClient.packageInfo.packagePrice`
  - Sets default package size and booking preferences
- **Dependency Management**: Added `preSelectedClientId` and `selectedClient` to the `handleEventClick` dependencies to ensure proper reactivity

**User Experience Impact**: When Madeline clicks "Book Session/Package" from a client details page and then clicks an available timeslot, the booking interface now automatically skips the client selection step and goes directly to pricing configuration with the client's rates pre-populated, providing a seamless booking experience.

**Calendar Navigation Enhancement**: Added calendar navigation link to the main header navigation bar for easy access to the calendar system:

**Header Navigation Update**:
- **Desktop Navigation**: Added "Calendar" link with brand blue styling (`bg-brand-blue-50 text-brand-blue-700 hover:bg-brand-blue-100`) positioned between "New Report Card" and "Format Your Report Card" for logical workflow ordering
- **Mobile Navigation**: Added corresponding mobile menu item with consistent styling and proper menu close functionality
- **Route Integration**: Calendar link points to `/calendar` which corresponds to the existing `app/(main)/calendar/page.tsx` booking system

**Animated Welcome Homepage**: Completely redesigned the homepage (`app/(main)/page.tsx`) with a professional animated welcome interface:

**Homepage Features**:
- **Personalized Greeting**: "Welcome, Madeline! 🐕" with cheerful dog emoji for brand personality
- **Smooth Animation**: Fade-in and slide-up animation (1000ms duration) with scale transition that triggers 100ms after component mount for polished user experience
- **Modern Design**: Card-based layout with gradient background (`from-brand-blue-50 to-brand-purple-50`), backdrop blur, and shadow effects for depth
- **Action-Oriented Layout**: Four primary action buttons in a responsive 2x2 grid layout:
  - **New Report Card** (brand-pink-700): FileText icon, links to `/report-cards/new`
  - **View Clients** (brand-blue-700): Users icon, links to `/clients`
  - **New Client** (brand-green-700): UserPlus icon, links to `/clients/new`
  - **See Calendar** (brand-purple-700): CalendarPlus icon, links to `/calendar`

**Interactive Elements**:
- **Hover Effects**: Icon scaling (110%), color transitions, and shadow elevation on hover for engaging interactions
- **Quick Actions Section**: Secondary actions bar with Settings, QR Codes, and Agencies links using outline button variants with brand color borders
- **Responsive Design**: Mobile-first approach with grid that adapts from single column on mobile to 2-column on larger screens

**Technical Implementation**:
- **Client-Side Rendering**: Uses "use client" directive for animation state management
- **React Hooks**: `useState` for animation visibility, `useEffect` with timer for animation trigger
- **Brand Color Integration**: Consistent use of brand color system throughout all interactive elements
- **Accessibility**: Proper semantic structure, focus states, and hover feedback for all interactive elements

This transformation creates a professional, welcoming entry point that guides Madeline efficiently to her most common tasks while maintaining the application's design consistency and providing delightful micro-interactions. 