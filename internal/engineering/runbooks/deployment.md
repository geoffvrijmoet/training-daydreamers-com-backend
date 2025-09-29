# Deployment Guide

## Overview

The Training Daydreamers platform is deployed on Vercel with a serverless architecture. This guide covers deployment procedures, environment configuration, and infrastructure management.

## Deployment Platform

### Vercel Hosting

**Platform**: Vercel (Recommended for Next.js applications)
**Architecture**: Serverless functions with edge optimization
**Regions**: Automatic global CDN distribution
**Build System**: Next.js build with automatic optimization

**Key Benefits**:
- Zero-config Next.js deployments
- Automatic HTTPS with custom domains
- Edge functions for optimal performance
- Built-in analytics and monitoring
- Automatic preview deployments for branches

## Environment Configuration

### Required Environment Variables

#### Core Application
```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...

# Base URL
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

#### File Storage (Cloudinary)
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

#### Google Calendar Integration
```env
GOOGLE_CLIENT_ID=your_oauth_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_oauth_client_secret
GOOGLE_REDIRECT_URI=https://your-domain.com/api/google-calendar/auth/callback
```

#### Email Services (Resend)
```env
RESEND_API_KEY=re_...
EMAIL_FROM=no-reply@yourdomain.com
```

#### SMS Services (Twilio) - Optional
```env
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1234567890
```

#### Google Cloud Storage (Legacy QR Codes)
```env
GOOGLE_CLIENT_EMAIL=service_account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_STORAGE_BUCKET=your_bucket_name
GOOGLE_STORAGE_URL=https://storage.googleapis.com/your_bucket_name
```

### Environment Management

#### Development Environment
- **File**: `.env.local` (not committed to git)
- **Database**: Development MongoDB cluster
- **Services**: Test/sandbox accounts for all integrations
- **Domain**: `localhost:7777`

#### Staging Environment
- **Platform**: Vercel preview deployment
- **Database**: Staging MongoDB cluster (separate from production)
- **Services**: Test/sandbox accounts
- **Domain**: Auto-generated Vercel preview URL

#### Production Environment
- **Platform**: Vercel production deployment
- **Database**: Production MongoDB cluster
- **Services**: Live/production accounts
- **Domain**: Custom domain with SSL

## Deployment Process

### Automatic Deployment

#### Git-based Deployment
1. **Main Branch**: Automatically deploys to production
2. **Feature Branches**: Create preview deployments
3. **Pull Requests**: Generate preview URLs for testing

#### Deployment Triggers
- Push to `main` branch → Production deployment
- Push to any branch → Preview deployment
- Pull request creation → Preview deployment with comment

### Manual Deployment

#### Using Vercel CLI
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Deploy preview
vercel
```

#### Using Git
```bash
# Deploy to production
git push origin main

# Create preview deployment
git push origin feature-branch
```

## Build Configuration

### Next.js Configuration

**File**: `next.config.mjs`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
```

### Build Scripts

**File**: `package.json`

```json
{
  "scripts": {
    "dev": "next dev -p 7777",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

### Build Process
1. **Dependency Installation**: `npm install`
2. **TypeScript Compilation**: Type checking and compilation
3. **Next.js Build**: Static generation and optimization
4. **Asset Optimization**: Image and CSS optimization
5. **Function Bundling**: Serverless function preparation

## Database Setup

### MongoDB Atlas Configuration

#### Cluster Setup
1. Create MongoDB Atlas account
2. Create cluster (M0 free tier for development, M10+ for production)
3. Configure network access (IP whitelist or 0.0.0.0/0 for Vercel)
4. Create database user with read/write permissions
5. Generate connection string

#### Database Security
- **Network Access**: Configure IP whitelist (Vercel IPs or 0.0.0.0/0)
- **Database Access**: Create dedicated user with minimal required permissions
- **Connection String**: Store in environment variables, never in code

#### Backup Strategy
- **Atlas Backups**: Enable continuous backups
- **Retention**: Configure appropriate retention period
- **Point-in-Time Recovery**: Available for M10+ clusters

### Collection Indexes

**Critical Indexes for Performance**:

```javascript
// Clients collection
db.clients.createIndex({ "email": 1 }, { unique: true })
db.clients.createIndex({ "phone": 1 })
db.clients.createIndex({ "createdAt": 1 })

// Calendar timeslots collection  
db.calendar_timeslots.createIndex({ "startTime": 1, "isAvailable": 1 })
db.calendar_timeslots.createIndex({ "endTime": 1 })
db.calendar_timeslots.createIndex({ "repeatingSeriesId": 1 })

// Report cards collection
db.report_cards.createIndex({ "clientId": 1 })
db.report_cards.createIndex({ "isDraft": 1 })
db.report_cards.createIndex({ "createdAt": 1 })

// Sessions collection
db.sessions.createIndex({ "clientId": 1 })
db.sessions.createIndex({ "calendarTimeslotId": 1 }, { unique: true })
db.sessions.createIndex({ "status": 1 })

// Google Calendar connections
db.google_calendar_connections.createIndex({ "userId": 1, "googleUserId": 1, "isActive": 1 })
db.google_calendar_connections.createIndex({ "userId": 1, "isActive": 1 })

// Contact form submissions
db.contact_form_submissions.createIndex({ "email": 1 })
db.contact_form_submissions.createIndex({ "reviewed": 1 })
db.contact_form_submissions.createIndex({ "submittedAt": 1 })
```

## Domain Configuration

### Custom Domain Setup

#### Vercel Domain Configuration
1. **Add Domain**: In Vercel dashboard, add custom domain
2. **DNS Configuration**: Point domain to Vercel's servers
3. **SSL Certificate**: Automatically provisioned by Vercel
4. **Redirects**: Configure www → non-www or vice versa

#### DNS Records
```
Type: A
Name: @
Value: 76.76.19.61

Type: CNAME  
Name: www
Value: cname.vercel-dns.com
```

### SSL/TLS Configuration
- **Automatic HTTPS**: Vercel provides automatic SSL certificates
- **Certificate Renewal**: Automatic renewal via Let's Encrypt
- **HSTS**: HTTP Strict Transport Security enabled by default
- **TLS Version**: TLS 1.2+ enforced

## Monitoring & Observability

### Vercel Analytics
- **Performance Metrics**: Core Web Vitals tracking
- **Function Metrics**: Serverless function performance
- **Error Tracking**: Runtime error monitoring
- **Usage Analytics**: Traffic and usage patterns

### Application Monitoring

#### Error Logging
```typescript
// Consistent error logging pattern
console.error('Error context:', {
  userId,
  action: 'create_client',
  error: error.message,
  timestamp: new Date().toISOString()
});
```

#### Performance Monitoring
- **API Response Times**: Track endpoint performance
- **Database Query Performance**: Monitor slow queries
- **File Upload Performance**: Track upload success rates

### Health Checks

#### Database Connectivity
**Endpoint**: `/api/test-db`
```typescript
// Simple database connectivity check
export async function GET() {
  try {
    await connectDB();
    return NextResponse.json({ status: 'healthy', database: 'connected' });
  } catch (error) {
    return NextResponse.json({ status: 'error', database: 'disconnected' }, { status: 500 });
  }
}
```

#### Integration Health
- **Google Calendar**: Token validity checks
- **Cloudinary**: Upload capability tests
- **Email Service**: Send test emails
- **SMS Service**: Connection verification

## Performance Optimization

### Caching Strategy

#### API Caching
```typescript
// Disable caching for dynamic content
export const dynamic = 'force-dynamic';

// Enable caching for static content
export const revalidate = 3600; // 1 hour
```

#### Image Optimization
- **Next.js Image Component**: Automatic optimization
- **Cloudinary Transformations**: Dynamic image resizing
- **WebP Format**: Modern image format support
- **Lazy Loading**: Automatic lazy loading

### Database Optimization
- **Connection Pooling**: MongoDB driver handles connection pooling
- **Query Optimization**: Use appropriate indexes
- **Lean Queries**: Use `.lean()` for read-only operations
- **Projection**: Select only required fields

### Bundle Optimization
- **Code Splitting**: Automatic with Next.js App Router
- **Tree Shaking**: Remove unused code
- **Dynamic Imports**: Load components on demand
- **Font Optimization**: Preload critical fonts

## Security Configuration

### Environment Security
- **Environment Variables**: Never commit secrets to git
- **Vercel Environment Variables**: Encrypted at rest
- **Secret Rotation**: Regular rotation of API keys and tokens

### Application Security
- **HTTPS Only**: Enforce HTTPS in production
- **CORS Configuration**: Restrict cross-origin requests
- **Input Validation**: Validate all user inputs
- **SQL Injection Prevention**: Use parameterized queries

### Third-Party Security
- **OAuth Scopes**: Minimal required permissions
- **API Key Restrictions**: Limit API key permissions
- **Token Expiration**: Implement appropriate token lifetimes

## Rollback Procedures

### Vercel Rollback
1. **Vercel Dashboard**: Navigate to deployments
2. **Select Previous Deployment**: Choose stable deployment
3. **Promote to Production**: Click "Promote to Production"
4. **Verify Rollback**: Test critical functionality

### Database Rollback
1. **Atlas Backup**: Restore from point-in-time backup
2. **Data Migration**: Run any necessary migration scripts
3. **Index Rebuild**: Recreate indexes if necessary
4. **Application Restart**: Restart application to clear caches

### Emergency Procedures
1. **Immediate Rollback**: Use Vercel dashboard for quick rollback
2. **Database Issues**: Restore from most recent backup
3. **Integration Failures**: Disable problematic integrations
4. **Communication**: Notify stakeholders of issues and resolution

## Maintenance Procedures

### Regular Maintenance
- **Dependency Updates**: Monthly security and feature updates
- **Database Maintenance**: Monitor performance and storage
- **Certificate Renewal**: Automatic via Vercel
- **Backup Verification**: Regular backup restore tests

### Scheduled Maintenance Windows
- **Time**: Sunday 2-4 AM EST (low traffic period)
- **Frequency**: Monthly for major updates
- **Communication**: Advance notice to users
- **Rollback Plan**: Always have rollback plan ready

## Troubleshooting

### Common Issues

#### Build Failures
```bash
# Check build logs
vercel logs --app your-app-name

# Local build test
npm run build

# Type checking
npx tsc --noEmit
```

#### Database Connection Issues
- Verify MongoDB URI format
- Check network access configuration
- Verify database user permissions
- Test connection from local environment

#### Environment Variable Issues
- Verify all required variables are set
- Check for typos in variable names
- Ensure proper escaping of special characters
- Test in preview deployment first

#### Integration Failures
- Check API key validity and permissions
- Verify OAuth configuration and redirect URIs
- Test integrations in isolation
- Review service status pages

---

*Last updated: Recent*
*Owner: Engineering Team*
