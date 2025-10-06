# Database Schema Documentation

## Overview

The Training Daydreamers platform uses MongoDB as its primary database with collections organized around core business entities. The schema is designed to support a dog training business with client management, scheduling, report cards, and partner agency relationships.

## Collections Overview

| Collection | Purpose | Key Relationships |
|------------|---------|-------------------|
| `clients` | Client and dog information | → `report_cards`, `calendar_timeslots`, `sessions` |
| `report_cards` | Training session reports | ← `clients` |
| `calendar_timeslots` | Available/booked time slots | ← `clients`, → `sessions` |
| `settings` | System configuration | Used by report cards |
| `sessions` | Individual training sessions | ← `clients`, ← `calendar_timeslots` |
| `package_instances` | Training package bookings | ← `clients`, → `sessions` |
| `contact_form_submissions` | Website inquiries | Converts to `clients` |
| `qrCodes` | Generated QR codes | Standalone |
| `dog_training_agencies` | Partner agencies | Referenced in `clients` |
| `google_calendar_connections` | User calendar integrations | User-specific |
| `system_google_calendar_connections` | System calendar integration | System-wide |

## Detailed Schema Definitions

### Clients Collection

**Purpose**: Store client and dog information, contact details, and business relationship data.

```typescript
interface IClient {
  // Primary Information
  name: string;                    // Required: Client's full name
  dogName: string;                 // Required: Dog's name
  email: string;                   // Required: Primary email (lowercase)
  phone: string;                   // Required: Primary phone number
  
  // Personal Information
  pronouns?: string;                // Client's preferred pronouns
  
  // Optional Contact Information
  dogBirthdate?: Date;
  zipCode?: string;
  
  // Address Fields
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  addressZipCode?: string;
  
  // Business Information
  intakeSource?: 'direct' | 'agency';
  agencyName?: string;
  agencyRevenueShare?: number;     // Percentage (0-100)
  agencyHandlesTax?: boolean;
  sessionRate?: number;            // Per session rate in dollars
  
  // Package Information
  packageInfo?: {
    packageName?: string;
    totalSessions?: number;
    sessionsUsed?: number;
    packagePrice?: number;
  };
  
  // Emergency Contact
  emergencyContact?: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
  
  // Additional Contacts (Co-owners)
  additionalContacts?: Array<{
    name?: string;
    email?: string;
    phone?: string;
  }>;
  
  // Additional Dog Information (for multiple dogs)
  additionalDogs?: Array<{
    name?: string;
    birthdate?: Date;
    breed?: string;
    weight?: number;
    reproductiveStatus?: 'spayed' | 'neutered' | 'intact';
  }>;
  
  // Enhanced Dog Information
  dogInfo?: {
    breed?: string;
    weight?: number;
    spayedNeutered?: boolean;
    reproductiveStatus?: 'spayed' | 'neutered' | 'intact';
    behaviorConcerns?: string[];
    previousTraining?: boolean;
    previousTrainingDetails?: string;
    source?: string;                // Where they got the dog
    timeWithDog?: string;           // How long they've had the dog
    diet?: string;                  // What the dog eats
    favoriteThing?: string;         // For training motivation
  };
  
  // Household Information
  householdInfo?: {
    otherPets?: Array<{
      type?: string;
      name?: string;
      age?: string;
    }>;
    childrenInHousehold?: boolean;
    childrenAges?: string;
    allergies?: {
      human?: string[];
      dog?: string[];
    };
  };
  
  // Medical Information
  medicalInfo?: {
    veterinarian?: {
      name?: string;
      clinic?: string;
      phone?: string;
    };
    medicalIssues?: string[];
    currentMedications?: Array<{
      name?: string;
      dosage?: string;
      prescribedFor?: string;
    }>;
    pastBehavioralMedications?: Array<{
      name?: string;
      prescribedFor?: string;
    }>;
  };
  
  // Behavioral Information
  behavioralInfo?: {
    trainingGoals?: string;         // Primary reason for seeking training
    biteHistory?: {
      hasBitten?: boolean;
      incidents?: Array<{
        description?: string;
        date?: Date;
        severity?: string;
      }>;
    };
    behavioralIssues?: string[];
    additionalNotes?: string;      // "Anything else you'd like me to know"
  };
  
  // File Attachments
  vaccinationRecords?: Array<{
    name: string;
    url: string;
    uploadedAt: Date;
    publicId?: string;
    resourceType?: string;
  }>;
  
  dogPhoto?: {
    url?: string;
    uploadedAt?: Date;
    publicId?: string;
    resourceType?: string;
  };
  
  liabilityWaiver?: {
    url?: string;
    uploadedAt?: Date;
    publicId?: string;
    resourceType?: string;
  };
  
  // Status Fields
  waiverSigned?: {
    signed: boolean;
    signedAt: Date;
  };
  intakeCompleted?: boolean;
  adminNotes?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes**:
- `email` (unique)
- `phone`
- `createdAt`

### Report Cards Collection

**Purpose**: Store training session reports with selected training elements and goals.

```typescript
interface IReportCard {
  // Client Association
  clientId?: ObjectId;             // Reference to clients collection
  clientName?: string;
  dogName?: string;
  
  // Session Details
  date?: string;                   // Session date as string
  summary?: string;                // HTML content - session summary
  
  // Training Elements (New Structure)
  selectedItemGroups?: Array<{
    category: string;              // e.g., "Key Concepts", "Games & Activities"
    items: Array<{
      itemId: ObjectId;            // Reference to settings items
      customDescription?: string;   // Optional custom description
    }>;
  }>;
  
  // Product Recommendations
  productRecommendationIds?: ObjectId[];  // References to settings items
  
  // Goals
  shortTermGoals?: Array<{
    title: string;
    description: string;
  }>;
  
  // Additional Recipients
  additionalContacts?: Array<{
    name: string;
    email?: string;
    phone?: string;
  }>;
  
  // Status
  isDraft?: boolean;               // Default: true
  emailSentAt?: Date;
  
  // Legacy Fields (Deprecated)
  keyConcepts?: string[];          // Legacy: array of titles
  productRecommendations?: string[]; // Legacy: array of titles
  fileId?: string;                 // Legacy: Google Drive integration
  webViewLink?: string;            // Legacy: Google Drive integration
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes**:
- `clientId`
- `isDraft`
- `createdAt`

### Calendar Timeslots Collection

**Purpose**: Manage available time slots and bookings for training sessions.

```typescript
interface ICalendarTimeslot {
  // Time Information
  startTime: Date;                 // Required: Slot start time (UTC)
  endTime: Date;                   // Required: Slot end time (UTC)
  
  // Availability
  isAvailable: boolean;            // Default: true
  
  // Booking Information
  bookedByClientId?: ObjectId;     // Reference to clients collection
  sessionId?: ObjectId;            // Reference to sessions collection
  packageInstanceId?: ObjectId;    // Reference to package_instances collection
  
  // Integration
  googleCalendarEventId?: string;  // For Google Calendar sync
  
  // Metadata
  notes?: string;                  // Admin notes about the slot
  repeatingSeriesId?: string;      // Groups slots from same recurring event
}
```

**Indexes**:
- `{ startTime: 1, isAvailable: 1 }` (compound)
- `endTime`
- `repeatingSeriesId`

### Settings Collection

**Purpose**: Store system-wide configuration and training content options.

```typescript
interface ISettings {
  type: string;                    // Required: "training_options"
  
  // Training Content Arrays
  keyConcepts?: Array<{
    _id: ObjectId;
    legacyId?: string;             // Migration support
    title: string;
    description: string;           // HTML content
    url?: string;
  }>;
  
  productRecommendations?: Array<{
    _id: ObjectId;
    legacyId?: string;
    title: string;
    description?: string;
    url?: string;
  }>;
  
  gamesAndActivities?: Array<{
    _id: ObjectId;
    legacyId?: string;
    title: string;
    description: string;           // HTML content
    url?: string;
  }>;
  
  homework?: Array<{
    _id: ObjectId;
    legacyId?: string;
    title: string;
    description: string;           // HTML content
    url?: string;
  }>;
  
  trainingSkills?: Array<{
    _id: ObjectId;
    legacyId?: string;
    title: string;
    description: string;           // HTML content
    url?: string;
  }>;
  
  // Custom Categories
  customCategories?: Array<{
    _id: ObjectId;
    legacyId?: string;
    name: string;
    order: number;                 // Display order
    items: Array<{
      _id: ObjectId;
      legacyId?: string;
      title: string;
      description: string;         // HTML content
      url?: string;
    }>;
  }>;
  
  // Future Service Definitions
  sessionOfferings?: Array<{
    id: string;
    title: string;
    description?: string;
    durationMinutes: number;
    currentPrice: number;
    isActive: boolean;
  }>;
  
  packageDefinitions?: Array<{
    id: string;
    title: string;
    description?: string;
    numberOfSessions: number;
    currentTotalPrice: number;
    isActive: boolean;
  }>;
}
```

**Indexes**:
- `type` (unique)

### Sessions Collection

**Purpose**: Track individual training sessions with pricing and status.

```typescript
interface ISession {
  // Associations
  clientId: ObjectId;              // Required: Reference to clients
  calendarTimeslotId: ObjectId;    // Required: Reference to calendar_timeslots
  packageInstanceId?: ObjectId;    // Optional: Reference to package_instances
  
  // Status & Pricing
  status: 'pending_payment' | 'scheduled' | 'completed' | 
          'cancelled_by_client' | 'cancelled_by_admin' | 'rescheduled';
  quotedPrice: number;             // Required: Session price
  
  // Metadata
  sessionNotes?: string;           // Admin notes
  googleCalendarEventId?: string;  // Google Calendar integration
  isFirstSession: boolean;         // Required: Default false
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes**:
- `clientId`
- `calendarTimeslotId` (unique)
- `status`

### Package Instances Collection

**Purpose**: Track individual package purchases and session usage.

```typescript
interface IPackageInstance {
  // Client Association
  clientId: ObjectId;              // Required: Reference to clients
  
  // Package Details
  totalSessions: number;           // Required: Total sessions in package
  sessionsUsed: number;            // Required: Sessions consumed
  totalQuotedPrice: number;        // Required: Total package price
  
  // Session Tracking
  sessionIds: ObjectId[];          // References to sessions collection
  
  // Timestamps
  createdAt: Date;
}
```

**Indexes**:
- `clientId`

### Contact Form Submissions Collection

**Purpose**: Store website inquiries before conversion to clients.

```typescript
interface IContactFormSubmission {
  // Contact Information
  name: string;                    // Required
  email: string;                   // Required (lowercase)
  phone?: string;
  
  // Dog Information
  dogName?: string;
  dogBirthdate?: string;           // Stored as string
  
  // Address
  streetAddress?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  
  // Inquiry
  message: string;                 // Required
  
  // Workflow
  reviewed?: boolean;              // Default: false
  reviewedAt?: Date;
  reviewedBy?: string;
  notes?: string;                  // Admin notes
  
  // Timestamp
  submittedAt: Date;               // Auto-generated
}
```

**Indexes**:
- `email`
- `reviewed`
- `submittedAt`

### Google Calendar Connections Collection

**Purpose**: Store user-specific Google Calendar OAuth connections.

```typescript
interface IGoogleCalendarConnection {
  // User Association
  userId: string;                  // Required: Clerk user ID
  
  // Google Account Info
  googleUserId: string;            // Required: Google user ID
  googleEmail: string;             // Required: Google email
  
  // OAuth Tokens
  accessToken: string;             // Required
  refreshToken: string;            // Required
  tokenExpiry: Date;               // Required
  
  // Calendar Selection
  calendarIds: string[];           // Selected calendar IDs
  
  // Status
  isActive: boolean;               // Default: true
  lastSyncAt?: Date;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes**:
- `{ userId: 1, googleUserId: 1, isActive: 1 }` (compound)
- `{ userId: 1, isActive: 1 }` (compound)
- `googleUserId`

### System Google Calendar Connections Collection

**Purpose**: Store system-level Google Calendar connections for public portal.

```typescript
interface ISystemGoogleCalendarConnection {
  // Connection Info
  connectionName: string;          // Required: Human-readable name
  
  // Google Account Info
  googleUserId: string;            // Required: Google user ID
  googleEmail: string;             // Required: Google email
  
  // OAuth Tokens
  accessToken: string;             // Required
  refreshToken: string;            // Required
  tokenExpiry: Date;               // Required
  
  // Calendar Selection
  calendarIds: string[];           // Selected calendar IDs
  
  // Status
  isActive: boolean;               // Default: true
  lastSyncAt?: Date;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes**:
- `googleUserId`
- `isActive`

### QR Codes Collection

**Purpose**: Store generated QR codes for various purposes.

```typescript
interface IQrCode {
  // QR Code Details
  name: string;                    // Required
  type: string;                    // Required
  url: string;                     // Required: Target URL
  description?: string;
  qrCodeUrl?: string;              // Generated QR code image URL
  
  // Styling
  style?: {
    // QR code styling options
  };
  
  // Timestamp
  createdAt: Date;
}
```

### Dog Training Agencies Collection

**Purpose**: Manage partner agencies and revenue sharing.

```typescript
interface IDogTrainingAgency {
  // Basic Information
  name: string;                    // Required
  contactPerson?: string;
  phone?: string;
  email?: string;
  
  // Address
  address?: {
    street1?: string;
    street2?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  
  // Business Terms
  revenueSharePercentage?: number; // 0-100
  agencyHandlesTax?: boolean;
  
  // Additional Info
  website?: string;
  notes?: string;
  isActive: boolean;               // Default: true
}
```

**Indexes**:
- `name`
- `isActive`

## Data Relationships

### Primary Relationships

1. **Client → Report Cards** (1:many)
   - `clients._id` → `report_cards.clientId`

2. **Client → Calendar Bookings** (1:many)
   - `clients._id` → `calendar_timeslots.bookedByClientId`

3. **Client → Sessions** (1:many)
   - `clients._id` → `sessions.clientId`

4. **Calendar Timeslot → Session** (1:1)
   - `calendar_timeslots._id` → `sessions.calendarTimeslotId`

5. **Package Instance → Sessions** (1:many)
   - `package_instances._id` → `sessions.packageInstanceId`

### Reference Relationships

1. **Settings → Report Cards**
   - `settings.keyConcepts._id` → `report_cards.selectedItemGroups.items.itemId`
   - `settings.productRecommendations._id` → `report_cards.productRecommendationIds`

2. **Contact Form → Clients** (Conversion)
   - Contact form data used to pre-populate client creation

## Migration Considerations

### Legacy Field Support

Several collections include `legacyId` fields to support data migration:
- Settings items maintain both ObjectId `_id` and string `legacyId`
- Report cards support both new structured data and legacy arrays

### ID Normalization

The API layer normalizes IDs for frontend consumption:
- ObjectIds are converted to strings
- Legacy IDs are preserved as fallbacks
- Frontend receives consistent `id` field

---

*Last updated: Recent*
*Owner: Engineering Team*
