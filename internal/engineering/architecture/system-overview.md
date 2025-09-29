# System Architecture Overview

## Technology Stack

### Core Framework
- **Next.js 14.2.16** - React framework with App Router
- **React 18** - Frontend UI library
- **TypeScript** - Type-safe JavaScript development

### Database & Storage
- **MongoDB** - Primary database using native MongoDB driver (v6.11.0)
- **Mongoose** - ODM for data modeling and validation (types only)
- **Cloudinary** - Cloud storage for images, PDFs, and documents
- **Google Cloud Storage** - QR code storage (legacy)

### Authentication & Authorization
- **Clerk** - User authentication and session management
- **Middleware Protection** - Route-based access control

### Styling & UI
- **Tailwind CSS** - Utility-first CSS framework with custom brand colors
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library
- **Custom Fonts** - Fredoka family fonts

### Third-Party Integrations
- **Google Calendar API** - Calendar synchronization
- **Google OAuth2** - Authentication for calendar access
- **Resend** - Email delivery service
- **Twilio** - SMS messaging
- **React-PDF** - Server-side PDF generation
- **QR Code** - QR code generation

### Development Tools
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Date-fns** - Date manipulation with timezone support

## Application Architecture

### Route Structure

The application uses Next.js App Router with route groups for organization:

#### Admin Routes (`app/(main)/`)
Protected routes requiring authentication:
- `/` - Dashboard home
- `/clients` - Client management
- `/report-cards` - Report card creation and management
- `/calendar` - Calendar and scheduling
- `/settings` - System configuration
- `/qr-codes` - QR code management
- `/new-training-inquiries` - Contact form submissions
- `/dog-training-agencies` - Partner agency management

#### Public Portal Routes (`app/portal/`)
Public-facing client portal:
- `/portal` - Client identification page
- `/portal/clients/[id]` - Client dashboard
- `/portal/calendar/[id]` - Booking calendar
- `/portal/report-cards/[id]` - Report card viewing
- `/portal/intake` - New client intake form

#### API Routes (`app/api/`)
RESTful API endpoints organized by feature:
- `/api/clients` - Client CRUD operations
- `/api/report-cards` - Report card management
- `/api/calendar-timeslots` - Calendar scheduling
- `/api/settings` - System settings management
- `/api/google-calendar` - Google Calendar integration
- `/api/portal` - Public portal endpoints
- `/api/upload` - File upload handling

### Data Architecture

#### Database Collections
- **clients** - Client information and contact details
- **report_cards** - Training session reports
- **calendar_timeslots** - Available and booked time slots
- **settings** - System configuration and training options
- **contact_form_submissions** - Website inquiries
- **qrCodes** - Generated QR codes
- **package_instances** - Training package bookings
- **sessions** - Individual training sessions
- **dog_training_agencies** - Partner agencies
- **google_calendar_connections** - User calendar integrations
- **system_google_calendar_connections** - System-level calendar connections

#### Key Data Relationships
- **Client → Report Cards** (1:many)
- **Client → Calendar Timeslots** (1:many via bookings)
- **Client → Sessions** (1:many)
- **Package Instance → Sessions** (1:many)
- **Calendar Timeslot → Session** (1:1 when booked)

### Security Architecture

#### Authentication Flow
1. **Admin Access** - Clerk authentication required for all `(main)` routes
2. **Public Portal** - No authentication required, client identification via email/phone
3. **API Protection** - Middleware enforces authentication on protected endpoints

#### Data Protection
- **Environment Variables** - Sensitive keys stored securely
- **Input Validation** - Mongoose schemas and API validation
- **File Upload Security** - Cloudinary signed uploads with folder restrictions
- **CORS Configuration** - Restricted to authorized domains

### Integration Architecture

#### Google Calendar Integration
- **OAuth2 Flow** - Secure calendar access authorization
- **Multi-Account Support** - Users can connect multiple Google accounts
- **System-Level Integration** - Public calendar visibility for booking
- **Token Management** - Automatic refresh and error handling

#### Email System
- **Resend Integration** - Reliable email delivery
- **Template System** - React-based email templates
- **Report Card Distribution** - Automated client notifications

#### File Storage
- **Cloudinary Primary** - Images, PDFs, documents with folder organization
- **Google Cloud Storage** - QR codes (legacy system)
- **Temporary Storage** - Intake uploads before client association

### Performance Considerations

#### Caching Strategy
- **API Routes** - Disabled caching for dynamic content (`force-dynamic`)
- **Static Assets** - Next.js automatic optimization
- **Database Queries** - Indexed fields for common lookups

#### Scalability
- **Serverless Deployment** - Vercel-optimized functions
- **Database Connections** - Connection pooling via MongoDB driver
- **File Processing** - Client-side uploads to reduce server load

### Deployment Architecture

#### Hosting Platform
- **Vercel** - Primary hosting with serverless functions
- **Custom Domain** - Production domain configuration
- **Environment Management** - Separate staging and production environments

#### Build Process
- **TypeScript Compilation** - Type checking and compilation
- **Tailwind Processing** - CSS optimization and purging
- **Asset Optimization** - Image and font optimization

### Monitoring & Logging

#### Error Handling
- **API Error Responses** - Consistent error formatting
- **Client-Side Logging** - Console logging for debugging
- **Database Error Handling** - Connection and query error management

#### Performance Monitoring
- **Next.js Analytics** - Built-in performance tracking
- **API Response Times** - Server-side logging
- **User Experience Metrics** - Client-side monitoring

## Development Workflow

### Code Organization
- **Components** - Reusable UI components in `components/`
- **Models** - Database schemas in `models/`
- **Utilities** - Shared functions in `lib/`
- **Types** - TypeScript definitions
- **Hooks** - Custom React hooks

### Development Standards
- **TypeScript First** - All code written in TypeScript
- **Component Composition** - Modular, reusable components
- **API Design** - RESTful conventions with proper HTTP methods
- **Error Handling** - Consistent error responses and user feedback

### Testing Strategy
- **Manual Testing** - Primary testing approach
- **Type Safety** - TypeScript compile-time validation
- **API Testing** - Manual endpoint validation

---

*Last updated: Recent*
*Owner: Engineering Team*
