# Integrations Documentation Index

## API & Integration Documentation

### Core API Documentation
- **API Reference**: `api-reference.md` - Complete REST API documentation with endpoints, request/response formats, and authentication

### Third-Party Integrations
- **Service Integrations**: `third-party-services.md` - Comprehensive guide to all external service integrations

## Integration Overview

### Authentication & User Management
- **Clerk** - Admin authentication and session management
- **OAuth2** - Google Calendar and social login integration

### File Storage & Media
- **Cloudinary** - Primary file storage for images, PDFs, documents
- **Google Cloud Storage** - Legacy QR code storage

### Communication Services
- **Resend** - Email delivery for report cards and notifications
- **Twilio** - SMS messaging (optional)

### Calendar & Scheduling
- **Google Calendar API** - Two-way calendar synchronization
- **Multi-account Support** - User and system-level calendar connections

### Document Generation
- **React-PDF** - Server-side PDF generation
- **QR Code Libraries** - Dynamic QR code generation

### Development Tools
- **Date-fns** - Timezone-aware date handling
- **Radix UI** - Accessible component primitives
- **Tiptap** - Rich text editing

## Quick Start Integration Checklist

### Required Environment Variables
```env
# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Database
MONGODB_URI=

# File Storage
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Google Calendar
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Email
RESEND_API_KEY=
EMAIL_FROM=
```

### Optional Integrations
```env
# SMS (Optional)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Legacy QR Storage (Optional)
GOOGLE_CLIENT_EMAIL=
GOOGLE_PRIVATE_KEY=
GOOGLE_STORAGE_BUCKET=
```

---

*Owner: Engineering Team*
*Last updated: Recent*
