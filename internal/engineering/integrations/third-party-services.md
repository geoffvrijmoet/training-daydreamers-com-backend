# Third-Party Service Integrations

## Overview

The Training Daydreamers platform integrates with multiple third-party services to provide comprehensive functionality including authentication, file storage, calendar synchronization, email delivery, and SMS messaging.

## Authentication & User Management

### Clerk Authentication

**Purpose**: User authentication and session management for admin users

**Implementation**:
- **Package**: `@clerk/nextjs` v6.5.1
- **Configuration**: `middleware.ts` with route protection
- **Protected Routes**: All `(main)` routes require authentication
- **Public Routes**: Portal routes and specific API endpoints

**Environment Variables**:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

**Key Features**:
- Session-based authentication
- Automatic route protection via middleware
- User context available in server components
- Sign-in/sign-up pages at `/sign-in` and `/sign-up`

**Implementation Files**:
- `middleware.ts` - Route protection configuration
- `app/(main)/layout.tsx` - Protected layout with user context
- `app/sign-in/[[...sign-in]]/page.tsx` - Sign-in page
- `app/sign-up/[[...sign-up]]/page.tsx` - Sign-up page

**Route Protection**:
```typescript
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)', 
  '/sign-up(.*)',
  '/portal(.*)',
  '/api/portal(.*)',
  '/api/clients/intake(.*)',
  // ... other public routes
]);
```

## File Storage & Media Management

### Cloudinary

**Purpose**: Primary file storage for images, PDFs, and documents

**Implementation**:
- **Package**: `cloudinary` v2.6.1
- **Storage Types**: Images, PDFs (raw), documents
- **Upload Methods**: Direct client uploads with signed parameters
- **Folder Organization**: Structured by client and file type

**Environment Variables**:
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Folder Structure**:
```
clients/
├── temp/                          # Temporary uploads
│   ├── vaccination-records/
│   ├── dog-photos/
│   └── liability-waivers/
├── client-{id}/                   # Client-specific folders
│   ├── vaccination-records/
│   ├── dog-photos/
│   └── liability-waivers/
└── qr-codes/                      # Generated QR codes
```

**Key Features**:
- Signed upload URLs for secure client-side uploads
- Automatic image optimization and transformation
- Folder-based organization with metadata
- Public delivery URLs with CDN

**API Endpoints**:
- `POST /api/upload` - Admin file uploads
- `POST /api/portal/sign-upload` - Generate signed upload parameters
- `POST /api/portal/delete-upload` - Delete temporary files
- `PUT /api/upload/update-metadata` - Move files between folders

**Implementation Files**:
- `app/api/upload/route.ts` - File upload handling
- `app/api/portal/sign-upload/route.ts` - Signed upload generation
- `next.config.mjs` - Image domain configuration

### Google Cloud Storage (Legacy)

**Purpose**: QR code storage (legacy system, being phased out)

**Implementation**:
- **Package**: `@google-cloud/storage` v7.16.0
- **Usage**: QR code image storage
- **Status**: Legacy, new files go to Cloudinary

**Environment Variables**:
```env
GOOGLE_CLIENT_EMAIL=service_account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_STORAGE_BUCKET=your_bucket_name
GOOGLE_STORAGE_URL=https://storage.googleapis.com/your_bucket_name
```

## Calendar Integration

### Google Calendar API

**Purpose**: Two-way calendar synchronization for scheduling and availability

**Implementation**:
- **Package**: `googleapis` v144.0.0
- **OAuth2 Flow**: Multi-account support with refresh token management
- **Integration Types**: User-specific and system-level connections

**Environment Variables**:
```env
GOOGLE_CLIENT_ID=your_oauth_client_id
GOOGLE_CLIENT_SECRET=your_oauth_client_secret
GOOGLE_REDIRECT_URI=http://localhost:7777/api/google-calendar/auth/callback
```

**Features**:

#### User-Level Integration
- **Purpose**: Admin calendar viewing in dashboard
- **Model**: `GoogleCalendarConnection`
- **Multi-Account**: Users can connect multiple Google accounts
- **Calendar Selection**: Choose specific calendars per account
- **Token Management**: Automatic refresh with error handling

#### System-Level Integration  
- **Purpose**: Public calendar availability for client booking
- **Model**: `SystemGoogleCalendarConnection`
- **Privacy**: Events shown as "Unavailable" without details
- **Booking Prevention**: Blocks client bookings during existing events

**OAuth2 Scopes**:
```javascript
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'openid'
];
```

**API Endpoints**:
- `GET /api/google-calendar/auth` - Initiate OAuth flow
- `GET /api/google-calendar/auth/callback` - Handle OAuth callback
- `GET /api/google-calendar/calendars` - List connected calendars
- `GET /api/google-calendar/events` - Fetch calendar events
- `PUT /api/google-calendar/preferences` - Update calendar selections
- `DELETE /api/google-calendar/disconnect` - Disconnect account

**Implementation Files**:
- `lib/google-calendar.ts` - Core integration functions
- `models/GoogleCalendarConnection.ts` - User connections model
- `models/SystemGoogleCalendarConnection.ts` - System connections model
- `components/GoogleCalendarManager.tsx` - Admin calendar management
- `components/GoogleCalendarInlineManager.tsx` - Inline calendar controls
- `components/SystemGoogleCalendarManager.tsx` - System calendar management

**Error Handling**:
- Automatic token refresh on expiry
- Graceful degradation when connections fail
- User-friendly reconnection prompts
- Inactive connection marking for expired tokens

## Email Services

### Resend

**Purpose**: Transactional email delivery for report cards and notifications

**Implementation**:
- **Package**: `resend` v4.6.0
- **Email Types**: Report card delivery, system notifications
- **Templates**: React-based email components

**Environment Variables**:
```env
RESEND_API_KEY=re_...
EMAIL_FROM=no-reply@daydreamersnyc.com
```

**Features**:
- HTML email templates using React components
- Multiple recipient support (TO, CC, BCC)
- Automatic text version generation
- Delivery tracking and analytics

**Email Templates**:
- `emails/ReportCardEmail.tsx` - Training report card email template

**API Integration**:
```typescript
// lib/email.ts
export async function sendEmail(opts: {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  html: string;
  text?: string;
})
```

**Implementation Files**:
- `lib/email.ts` - Email service wrapper
- `emails/ReportCardEmail.tsx` - Report card email template
- `app/api/report-cards/[id]/send-email/route.ts` - Report card email endpoint

## SMS Services

### Twilio

**Purpose**: SMS messaging for client notifications and reminders

**Implementation**:
- **Package**: `twilio` v5.7.2
- **Usage**: Appointment reminders, notifications
- **Status**: Implemented but not actively used

**Environment Variables**:
```env
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1234567890
```

**API Integration**:
```typescript
// lib/sms.ts
export async function sendSms(to: string, body: string)
```

**Implementation Files**:
- `lib/sms.ts` - SMS service wrapper
- `app/api/sms/route.ts` - SMS sending endpoint

## PDF Generation

### React-PDF

**Purpose**: Server-side PDF generation for liability waivers and reports

**Implementation**:
- **Package**: `@react-pdf/renderer` v4.3.0
- **Use Cases**: Liability waivers with e-signatures
- **Architecture**: Server-side rendering with Cloudinary storage

**Features**:
- React component-based PDF templates
- E-signature embedding (canvas to PNG)
- Audit trail information (timestamp, IP, User-Agent)
- Serverless-friendly (no Chromium dependency)

**PDF Types**:
- **Liability Waivers**: Generated with client signature and audit info
- **Report Cards**: Planned future implementation

**Implementation Files**:
- `app/api/portal/generate-liability-waiver/route.tsx` - Waiver PDF generation
- `guidelines/serverless-pdf-generation.md` - Implementation guidance

**Workflow**:
1. Client signs waiver in portal
2. Signature captured as canvas data
3. PDF generated server-side with signature embedded
4. PDF uploaded to Cloudinary with signed parameters
5. URL stored in client record

## QR Code Generation

### QRCode Libraries

**Purpose**: Generate QR codes for various business purposes

**Implementation**:
- **Packages**: `qrcode` v1.5.4, `qrcode.react` v4.1.0
- **Generation**: Server-side and client-side QR code creation
- **Storage**: Google Cloud Storage (legacy) and Cloudinary

**Features**:
- Dynamic QR code generation
- Custom styling options
- Multiple format support (PNG, SVG)
- URL tracking and analytics

**Implementation Files**:
- `components/qr-codes/qr-code-manager.tsx` - QR code management interface
- `app/api/qr-codes/route.ts` - QR code CRUD operations

## Date & Time Management

### Date-fns with Timezone Support

**Purpose**: Consistent date/time handling across timezones

**Implementation**:
- **Packages**: `date-fns` v4.1.0, `date-fns-tz` v3.2.0
- **Timezone**: Eastern Time (America/New_York) as primary
- **Usage**: Calendar scheduling, report dates, timestamps

**Key Functions**:
- `toZonedTime()` - Convert UTC to timezone
- `fromZonedTime()` - Convert timezone to UTC
- `format()` - Format dates for display
- Date arithmetic and validation

**Implementation Pattern**:
```typescript
const TIME_ZONE = "America/New_York";
const localTime = toZonedTime(utcDate, TIME_ZONE);
const utcTime = fromZonedTime(localTime, TIME_ZONE);
```

## UI Component Libraries

### Radix UI

**Purpose**: Accessible, unstyled component primitives

**Implementation**:
- **Packages**: Multiple `@radix-ui/react-*` packages
- **Components**: Dialog, Popover, Select, Checkbox, etc.
- **Styling**: Custom styled with Tailwind CSS

**Key Components**:
- `@radix-ui/react-dialog` - Modal dialogs
- `@radix-ui/react-popover` - Popovers and tooltips
- `@radix-ui/react-select` - Dropdown selectors
- `@radix-ui/react-checkbox` - Form checkboxes
- `@radix-ui/react-toast` - Notification toasts

### Rich Text Editing

**Purpose**: WYSIWYG text editing for report summaries

**Implementation**:
- **Packages**: `@tiptap/react` v2.10.3, `@tiptap/starter-kit` v2.10.3
- **Extensions**: Link support, placeholder text
- **Output**: HTML content stored in database

**Features**:
- Rich text formatting (bold, italic, lists)
- Link insertion and editing
- HTML output with consistent styling
- Mobile-friendly editing experience

**Implementation Files**:
- `components/ui/rich-text-editor.tsx` - Rich text editor component
- Used in report card forms and other content areas

## Database Connectivity

### MongoDB Native Driver

**Purpose**: Direct MongoDB database connectivity

**Implementation**:
- **Package**: `mongodb` v6.11.0
- **Connection**: Native driver with connection pooling
- **Models**: Mongoose for schema definition (types only)

**Features**:
- Connection pooling for performance
- Direct query capability
- Schema validation via Mongoose models
- Automatic reconnection handling

**Implementation Files**:
- `lib/db.ts` - Database connection utility
- `lib/mongodb.ts` - MongoDB client configuration

## Integration Security

### API Key Management
- All sensitive keys stored in environment variables
- Different keys for development and production
- No hardcoded credentials in codebase

### OAuth Security
- PKCE flow for Google OAuth2
- Secure token storage in database
- Automatic token refresh with error handling
- Scope limitation to minimum required permissions

### File Upload Security
- Signed upload URLs with expiration
- Folder-based access restrictions
- File type validation
- Temporary file cleanup

### Data Protection
- Input validation on all API endpoints
- SQL injection prevention via parameterized queries
- XSS prevention via React's built-in escaping
- CORS configuration for API endpoints

---

*Last updated: Recent*
*Owner: Engineering Team*
