# Security Architecture & Practices

## Overview

The Training Daydreamers platform implements a comprehensive security architecture to protect client data, maintain system integrity, and ensure compliance with privacy regulations. This document outlines security practices, threat mitigation strategies, and compliance measures.

## Security Architecture

### Multi-Layer Security Model

```
┌─────────────────────────────────────────────────────────────┐
│                     Edge Layer (Vercel)                     │
│  • HTTPS/TLS Termination  • DDoS Protection  • CDN Security │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                  Application Layer (Next.js)                │
│  • Route Protection  • Input Validation  • CORS Controls   │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                Authentication Layer (Clerk)                 │
│  • Session Management  • OAuth Integration  • MFA Support  │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                   Data Layer (MongoDB)                      │
│  • Encryption at Rest  • Network Security  • Access Control│
└─────────────────────────────────────────────────────────────┘
```

## Authentication & Authorization

### Admin Authentication (Clerk)

**Implementation**: Clerk-based authentication for administrative users

**Security Features**:
- **Session-based Authentication**: Secure session management with automatic expiration
- **Multi-Factor Authentication**: Optional MFA for enhanced security
- **Social Login**: Secure OAuth integration with Google, GitHub, etc.
- **Password Policies**: Enforced strong password requirements
- **Session Security**: Automatic session invalidation on suspicious activity

**Route Protection**:
```typescript
// middleware.ts - Route protection configuration
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)', 
  '/sign-up(.*)',
  '/portal(.*)',           // Client portal - no auth required
  '/api/portal(.*)',       // Portal API endpoints
  '/api/clients/intake(.*)', // Public intake endpoint
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect(); // Require authentication
  }
});
```

**Session Management**:
- **Automatic Expiration**: Sessions expire after inactivity
- **Secure Cookies**: HttpOnly, Secure, SameSite cookies
- **Token Rotation**: Automatic token refresh
- **Device Tracking**: Monitor and manage user sessions

### Client Portal Access

**Model**: Self-service identification without traditional authentication

**Security Approach**:
- **Email + Phone Verification**: Dual-factor identification
- **No Persistent Sessions**: Each access requires re-verification
- **Limited Data Access**: Only client's own data accessible
- **No Administrative Functions**: Read-only access to personal information

**Implementation**:
```typescript
// Client identification endpoint
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  const phone = searchParams.get('phone');
  
  // Validate both email and phone match
  const client = await Client.findOne({ 
    email: email?.toLowerCase(), 
    phone: normalizePhone(phone) 
  });
  
  if (!client) {
    return NextResponse.json({ success: false }, { status: 404 });
  }
  
  // Return limited client data
  return NextResponse.json({ 
    success: true, 
    client: sanitizeClientData(client) 
  });
}
```

## Data Protection

### Encryption

#### Data in Transit
- **HTTPS Everywhere**: All communications encrypted with TLS 1.2+
- **API Security**: All API endpoints served over HTTPS
- **Third-Party Integrations**: Encrypted connections to all external services
- **Certificate Management**: Automatic SSL certificate provisioning and renewal

#### Data at Rest
- **MongoDB Encryption**: Atlas provides encryption at rest by default
- **File Storage Encryption**: Cloudinary encrypts stored files
- **Environment Variables**: Vercel encrypts environment variables
- **Database Backups**: Encrypted backup storage

### Data Classification

#### Highly Sensitive Data
- **Client Personal Information**: Names, addresses, phone numbers, emails
- **Payment Information**: Session rates, package pricing (no credit card data stored)
- **Health Information**: Dog behavioral concerns, training notes
- **Legal Documents**: Liability waivers, signed agreements

**Protection Measures**:
- Encrypted storage and transmission
- Access logging and monitoring
- Regular access reviews
- Data retention policies

#### Sensitive Data
- **Training Records**: Session notes, progress reports
- **Scheduling Information**: Appointment times and locations
- **Communication Records**: Email and SMS logs

**Protection Measures**:
- Role-based access control
- Audit trails for data access
- Secure backup procedures

#### Internal Data
- **System Configuration**: Settings, training options
- **Application Logs**: Error logs, performance metrics
- **Analytics Data**: Usage patterns, performance data

### Data Minimization

**Principles**:
- **Collect Only Necessary Data**: Limit data collection to business requirements
- **Purpose Limitation**: Use data only for stated purposes
- **Retention Limits**: Delete data when no longer needed
- **Access Controls**: Limit access to authorized personnel only

**Implementation**:
```typescript
// Example: Sanitize client data for portal access
function sanitizeClientData(client: IClient) {
  return {
    _id: client._id,
    name: client.name,
    dogName: client.dogName,
    email: client.email,
    // Exclude sensitive fields like adminNotes, sessionRate, etc.
  };
}
```

## Input Validation & Sanitization

### API Input Validation

**Mongoose Schema Validation**:
```typescript
// Example: Client schema with validation
const clientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: (v: string) => /^\(\d{3}\) \d{3}-\d{4}$/.test(v),
      message: 'Phone must be in format (123) 456-7890'
    }
  }
});
```

**API Endpoint Validation**:
```typescript
// Example: Validate request parameters
export async function POST(request: Request) {
  const body = await request.json();
  
  // Validate required fields
  if (!body.name || !body.email || !body.dogName) {
    return NextResponse.json(
      { error: 'Missing required fields' }, 
      { status: 400 }
    );
  }
  
  // Validate email format
  if (!isValidEmail(body.email)) {
    return NextResponse.json(
      { error: 'Invalid email format' }, 
      { status: 400 }
    );
  }
  
  // Sanitize input
  const sanitizedData = {
    name: body.name.trim(),
    email: body.email.toLowerCase().trim(),
    dogName: body.dogName.trim()
  };
  
  // Process sanitized data
}
```

### XSS Prevention

**React Built-in Protection**:
- Automatic HTML escaping in JSX
- Safe rendering of user content
- Dangerous HTML requires explicit `dangerouslySetInnerHTML`

**Rich Text Content**:
```typescript
// Safe HTML rendering for rich text content
function SafeHTMLContent({ content }: { content: string }) {
  return (
    <div 
      className="prose [&>p]:mb-3 [&>p:last-child]:mb-0"
      dangerouslySetInnerHTML={{ __html: sanitizeHTML(content) }}
    />
  );
}
```

### SQL Injection Prevention

**MongoDB Protection**:
- **Parameterized Queries**: All queries use MongoDB driver's parameterization
- **Schema Validation**: Mongoose schemas prevent malformed data
- **Type Safety**: TypeScript ensures type correctness

```typescript
// Safe MongoDB query pattern
const client = await Client.findOne({ 
  _id: new ObjectId(clientId),  // Type-safe ObjectId conversion
  email: email.toLowerCase()    // Sanitized input
});
```

## File Upload Security

### Cloudinary Security

**Upload Security**:
- **Signed Uploads**: All uploads use signed parameters with expiration
- **Folder Restrictions**: Uploads restricted to specific folder patterns
- **File Type Validation**: Server-side file type checking
- **Size Limits**: Maximum file size enforcement

**Implementation**:
```typescript
// Generate signed upload parameters
export async function POST(request: Request) {
  const { folder, resourceType } = await request.json();
  
  // Validate folder path
  if (!folder.startsWith('clients/temp/') && !folder.startsWith('clients/client-')) {
    return NextResponse.json({ error: 'Invalid folder path' }, { status: 400 });
  }
  
  // Generate signed parameters with expiration
  const timestamp = Math.round(Date.now() / 1000);
  const params = {
    timestamp,
    folder,
    resource_type: resourceType,
    expires_at: timestamp + 3600 // 1 hour expiration
  };
  
  const signature = cloudinary.utils.api_sign_request(params, apiSecret);
  
  return NextResponse.json({
    signature,
    timestamp,
    cloudName,
    apiKey,
    folder,
    resource_type: resourceType
  });
}
```

**File Organization**:
```
clients/
├── temp/                    # Temporary uploads (auto-cleanup)
│   ├── vaccination-records/
│   ├── dog-photos/
│   └── liability-waivers/
└── client-{id}/            # Client-specific permanent storage
    ├── vaccination-records/
    ├── dog-photos/
    └── liability-waivers/
```

### File Access Control

**Public Access**: Files are publicly accessible via Cloudinary URLs
**Security Measures**:
- **Unpredictable URLs**: Cloudinary generates unique public IDs
- **Folder Isolation**: Client files separated by folders
- **Metadata Tracking**: File ownership tracked in database
- **Cleanup Procedures**: Temporary files automatically removed

## OAuth & Third-Party Security

### Google Calendar Integration

**OAuth2 Security**:
- **PKCE Flow**: Proof Key for Code Exchange for enhanced security
- **Minimal Scopes**: Request only necessary permissions
- **Token Security**: Secure storage and automatic refresh
- **Error Handling**: Graceful handling of expired/revoked tokens

**Scopes Requested**:
```javascript
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',        // Read calendar events
  'https://www.googleapis.com/auth/calendar.events.readonly', // Read event details
  'https://www.googleapis.com/auth/userinfo.email',          // User identification
  'openid'                                                   // OpenID Connect
];
```

**Token Management**:
```typescript
// Secure token refresh with error handling
export async function getValidAccessToken(userId: string, googleUserId: string): Promise<string> {
  const connection = await GoogleCalendarConnectionModel.findOne({ 
    userId, 
    googleUserId, 
    isActive: true 
  });
  
  if (!connection) {
    throw new Error('No active Google Calendar connection found');
  }
  
  // Check if token needs refresh
  if (connection.tokenExpiry <= new Date()) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      
      // Update stored tokens
      connection.accessToken = credentials.access_token!;
      connection.tokenExpiry = new Date(credentials.expiry_date!);
      await connection.save();
      
      return credentials.access_token!;
    } catch (error) {
      // Handle expired refresh tokens
      if (error instanceof Error && error.message.includes('invalid_grant')) {
        connection.isActive = false;
        await connection.save();
        throw new Error('Google Calendar connection expired. Please reconnect.');
      }
      throw error;
    }
  }
  
  return connection.accessToken;
}
```

### API Key Security

**Environment Variable Management**:
- **No Hardcoded Keys**: All secrets in environment variables
- **Different Environments**: Separate keys for dev/staging/production
- **Key Rotation**: Regular rotation of API keys
- **Access Monitoring**: Monitor API key usage for anomalies

**Key Protection**:
```env
# Production keys (never commit to git)
RESEND_API_KEY=re_live_...
CLOUDINARY_API_SECRET=secret_key_here
GOOGLE_CLIENT_SECRET=oauth_secret_here
TWILIO_AUTH_TOKEN=auth_token_here
```

## Database Security

### MongoDB Atlas Security

**Network Security**:
- **IP Whitelist**: Restrict database access to authorized IPs
- **VPC Peering**: Private network connections (for enterprise)
- **Encryption in Transit**: TLS encryption for all connections
- **Encryption at Rest**: Automatic encryption of stored data

**Access Control**:
- **Database Users**: Separate users with minimal required permissions
- **Role-Based Access**: Specific roles for different access levels
- **Connection Strings**: Secure connection string management
- **Audit Logging**: Track database access and operations

**Connection Security**:
```typescript
// Secure MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

// Connection options for security
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  ssl: true,                    // Enforce SSL
  sslValidate: true,           // Validate SSL certificates
  maxPoolSize: 10,             // Connection pool limit
  serverSelectionTimeoutMS: 5000, // Timeout for server selection
  socketTimeoutMS: 45000,      // Socket timeout
};
```

### Data Backup Security

**Backup Encryption**:
- **Atlas Backups**: Encrypted backups with point-in-time recovery
- **Access Control**: Restricted access to backup restoration
- **Retention Policies**: Appropriate backup retention periods
- **Testing**: Regular backup restoration testing

## Logging & Monitoring

### Security Logging

**Application Logs**:
```typescript
// Security-relevant event logging
function logSecurityEvent(event: {
  type: 'login' | 'logout' | 'access_denied' | 'data_access' | 'file_upload';
  userId?: string;
  clientId?: string;
  ip?: string;
  userAgent?: string;
  details?: any;
}) {
  console.log('SECURITY_EVENT:', {
    ...event,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
}

// Usage examples
logSecurityEvent({
  type: 'data_access',
  userId: 'user_123',
  clientId: 'client_456',
  ip: request.ip,
  details: { action: 'view_report_card', reportCardId: 'report_789' }
});
```

**Access Monitoring**:
- **Failed Login Attempts**: Track and alert on suspicious login activity
- **Data Access Patterns**: Monitor unusual data access patterns
- **File Upload Activity**: Log all file uploads and downloads
- **API Usage**: Monitor API endpoint usage for anomalies

### Error Handling

**Secure Error Responses**:
```typescript
// Don't expose internal details in error messages
export async function POST(request: Request) {
  try {
    // Application logic
  } catch (error) {
    // Log detailed error internally
    console.error('Internal error:', {
      error: error.message,
      stack: error.stack,
      userId: auth.userId,
      timestamp: new Date().toISOString()
    });
    
    // Return generic error to client
    return NextResponse.json(
      { error: 'An unexpected error occurred' }, 
      { status: 500 }
    );
  }
}
```

## Compliance & Privacy

### Data Privacy Principles

**GDPR Compliance Considerations**:
- **Lawful Basis**: Process data based on legitimate business interest
- **Data Minimization**: Collect only necessary data
- **Purpose Limitation**: Use data only for stated purposes
- **Storage Limitation**: Delete data when no longer needed
- **Data Subject Rights**: Provide mechanisms for data access and deletion

**Privacy by Design**:
- **Default Privacy Settings**: Secure defaults for all configurations
- **Data Protection**: Built-in protection mechanisms
- **Transparency**: Clear data usage policies
- **User Control**: Mechanisms for users to control their data

### Data Retention

**Retention Policies**:
- **Active Clients**: Data retained while client relationship is active
- **Inactive Clients**: Data retention for legal/business requirements
- **Temporary Data**: Automatic cleanup of temporary files and drafts
- **Log Data**: Application logs retained for operational needs

**Implementation**:
```typescript
// Automatic cleanup of temporary files
export async function cleanupTemporaryFiles() {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  // Find and delete old temporary uploads
  const tempFiles = await cloudinary.api.resources({
    type: 'upload',
    prefix: 'clients/temp/',
    max_results: 500
  });
  
  for (const file of tempFiles.resources) {
    if (new Date(file.created_at) < oneDayAgo) {
      await cloudinary.uploader.destroy(file.public_id, {
        resource_type: file.resource_type
      });
    }
  }
}
```

## Incident Response

### Security Incident Types

**Data Breach**: Unauthorized access to client data
**System Compromise**: Unauthorized access to application systems
**Service Disruption**: Denial of service or system unavailability
**Integration Compromise**: Security issues with third-party services

### Response Procedures

**Immediate Response** (0-1 hour):
1. **Assess Impact**: Determine scope and severity of incident
2. **Contain Threat**: Isolate affected systems or disable compromised accounts
3. **Document**: Record all actions taken and evidence
4. **Notify**: Alert key stakeholders and team members

**Investigation** (1-24 hours):
1. **Root Cause Analysis**: Determine how incident occurred
2. **Impact Assessment**: Identify affected data and users
3. **Evidence Collection**: Preserve logs and forensic evidence
4. **Containment Verification**: Ensure threat is fully contained

**Recovery** (24-72 hours):
1. **System Restoration**: Restore services to normal operation
2. **Security Patches**: Apply necessary security updates
3. **Monitoring Enhancement**: Implement additional monitoring
4. **Communication**: Notify affected users if required

**Post-Incident** (1-2 weeks):
1. **Lessons Learned**: Document lessons and improvements
2. **Security Enhancements**: Implement preventive measures
3. **Policy Updates**: Update security policies and procedures
4. **Training**: Provide additional security training if needed

### Contact Information

**Internal Contacts**:
- **Engineering Team**: Primary technical response
- **Business Owner**: Decision making and communications
- **Legal Counsel**: Compliance and legal requirements

**External Contacts**:
- **Vercel Support**: Platform-related incidents
- **MongoDB Atlas Support**: Database-related incidents
- **Third-Party Vendors**: Service-specific incidents

## Security Best Practices

### Development Security

**Secure Coding Practices**:
- **Input Validation**: Validate all user inputs
- **Output Encoding**: Properly encode output data
- **Error Handling**: Secure error handling and logging
- **Dependency Management**: Regular security updates

**Code Review Process**:
- **Security Review**: Include security considerations in code reviews
- **Automated Scanning**: Use tools to detect security vulnerabilities
- **Dependency Audits**: Regular audit of third-party dependencies
- **Testing**: Include security testing in QA process

### Operational Security

**Access Management**:
- **Principle of Least Privilege**: Grant minimum necessary permissions
- **Regular Access Reviews**: Periodic review of user access
- **Strong Authentication**: Enforce strong passwords and MFA
- **Session Management**: Proper session timeout and invalidation

**Infrastructure Security**:
- **Regular Updates**: Keep all systems and dependencies updated
- **Security Monitoring**: Continuous monitoring for security threats
- **Backup Security**: Secure backup procedures and testing
- **Disaster Recovery**: Comprehensive disaster recovery planning

---

*Last updated: Recent*
*Owner: Engineering Team*
