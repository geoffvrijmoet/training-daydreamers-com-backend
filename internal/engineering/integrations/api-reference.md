# API Reference Documentation

## Overview

The Training Daydreamers API is built on Next.js App Router with RESTful conventions. All endpoints return JSON responses and use standard HTTP status codes for error handling.

## Authentication

### Admin Endpoints
- **Authentication**: Clerk session required
- **Middleware**: Protects all routes except those in `isPublicRoute` matcher
- **Headers**: Session handled automatically by Clerk middleware

### Public Portal Endpoints
- **Path Pattern**: `/api/portal/*`
- **Authentication**: None required
- **Access**: Open for client self-service features

## Base URL

- **Development**: `http://localhost:7777`
- **Production**: `https://your-domain.com`

## API Endpoints

### Clients API

#### GET /api/clients
List all clients with optional filtering and pagination.

**Authentication**: Required  
**Method**: `GET`

**Response**:
```json
{
  "clients": [
    {
      "_id": "ObjectId",
      "name": "John Doe",
      "dogName": "Buddy",
      "email": "john@example.com",
      "phone": "(555) 123-4567",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### POST /api/clients
Create a new client.

**Authentication**: Required  
**Method**: `POST`

**Request Body**:
```json
{
  "name": "John Doe",
  "dogName": "Buddy", 
  "email": "john@example.com",
  "phone": "(555) 123-4567",
  "additionalContacts": [
    {
      "name": "Jane Doe",
      "email": "jane@example.com",
      "phone": "(555) 123-4568"
    }
  ]
}
```

**Response**: `201 Created`
```json
{
  "success": true,
  "client": { /* full client object */ }
}
```

#### GET /api/clients/[id]
Get a specific client by ID.

**Authentication**: Required  
**Method**: `GET`

**Parameters**:
- `id` (string): Client ObjectId

**Response**: `200 OK`
```json
{
  "success": true,
  "client": { /* full client object */ }
}
```

#### PUT /api/clients/[id]
Update a specific client.

**Authentication**: Required  
**Method**: `PUT`

**Parameters**:
- `id` (string): Client ObjectId

**Request Body**: Partial client object with fields to update

**Response**: `200 OK`
```json
{
  "success": true,
  "client": { /* updated client object */ }
}
```

#### DELETE /api/clients/[id]
Delete a specific client.

**Authentication**: Required  
**Method**: `DELETE`

**Parameters**:
- `id` (string): Client ObjectId

**Response**: `200 OK`
```json
{
  "success": true,
  "message": "Client deleted successfully"
}
```

#### POST /api/clients/intake
Public client intake endpoint for portal registration.

**Authentication**: None  
**Method**: `POST`

**Request Body**:
```json
{
  "name": "John Doe",
  "dogName": "Buddy",
  "email": "john@example.com",
  "phone": "(555) 123-4567",
  "dogBirthdate": "2020-01-01",
  "zipCode": "10001",
  "addressLine1": "123 Main St",
  "city": "New York",
  "state": "NY"
}
```

### Report Cards API

#### GET /api/report-cards
List all report cards with optional filtering.

**Authentication**: Required  
**Method**: `GET`

**Query Parameters**:
- `clientId` (optional): Filter by client ID
- `isDraft` (optional): Filter by draft status

**Response**:
```json
{
  "reportCards": [
    {
      "_id": "ObjectId",
      "clientId": "ObjectId",
      "clientName": "John Doe",
      "dogName": "Buddy",
      "date": "2024-01-15",
      "summary": "<p>Great session today...</p>",
      "isDraft": false,
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

#### POST /api/report-cards
Create a new report card.

**Authentication**: Required  
**Method**: `POST`

**Request Body**:
```json
{
  "clientId": "ObjectId",
  "clientName": "John Doe",
  "dogName": "Buddy",
  "date": "2024-01-15",
  "summary": "<p>Session summary with HTML formatting</p>",
  "selectedItemGroups": [
    {
      "category": "Key Concepts",
      "items": [
        {
          "itemId": "ObjectId",
          "customDescription": "Custom notes about this concept"
        }
      ]
    }
  ],
  "productRecommendationIds": ["ObjectId1", "ObjectId2"],
  "shortTermGoals": [
    {
      "title": "Sit Command",
      "description": "Practice sit command daily for 5 minutes"
    }
  ],
  "isDraft": false
}
```

#### GET /api/report-cards/[id]
Get a specific report card.

**Authentication**: Required  
**Method**: `GET`

**Parameters**:
- `id` (string): Report card ObjectId

#### PUT /api/report-cards/[id]
Update a specific report card.

**Authentication**: Required  
**Method**: `PUT`

#### DELETE /api/report-cards/[id]
Delete a specific report card.

**Authentication**: Required  
**Method**: `DELETE`

#### POST /api/report-cards/[id]/send-email
Send report card via email to client.

**Authentication**: Required  
**Method**: `POST`

**Parameters**:
- `id` (string): Report card ObjectId

**Response**: `200 OK`
```json
{
  "success": true,
  "message": "Email sent successfully"
}
```

#### POST /api/report-cards/draft
Save/update report card draft.

**Authentication**: Required  
**Method**: `POST`

**Request Body**: Same as create report card with `isDraft: true`

### Calendar & Scheduling API

#### GET /api/calendar-timeslots
List calendar timeslots for admin calendar view.

**Authentication**: Required  
**Method**: `GET`

**Query Parameters**:
- `start` (required): ISO date string for range start
- `end` (required): ISO date string for range end

**Response**:
```json
{
  "success": true,
  "timeslots": [
    {
      "_id": "ObjectId",
      "startTime": "2024-01-15T14:00:00.000Z",
      "endTime": "2024-01-15T15:00:00.000Z",
      "isAvailable": true,
      "bookedByClientId": null,
      "notes": "Park location"
    }
  ]
}
```

#### POST /api/calendar-timeslots
Create new calendar timeslots.

**Authentication**: Required  
**Method**: `POST`

**Request Body**:
```json
{
  "startTime": "2024-01-15T14:00:00.000Z",
  "endTime": "2024-01-15T16:00:00.000Z",
  "notes": "Available for booking",
  "repeating": {
    "enabled": true,
    "frequency": "weekly",
    "count": 4
  }
}
```

#### GET /api/portal/calendar-timeslots
Public endpoint for client booking calendar.

**Authentication**: None  
**Method**: `GET`

**Query Parameters**:
- `start` (required): ISO date string
- `end` (required): ISO date string  
- `clientId` (optional): Show client's bookings

**Response**:
```json
{
  "success": true,
  "timeslots": [
    {
      "_id": "ObjectId",
      "startTime": "2024-01-15T14:00:00.000Z",
      "endTime": "2024-01-15T16:00:00.000Z",
      "isAvailable": true,
      "duration": 120
    }
  ],
  "googleCalendarEvents": [
    {
      "id": "google_event_id",
      "title": "Unavailable",
      "start": "2024-01-15T10:00:00.000Z",
      "end": "2024-01-15T11:00:00.000Z"
    }
  ]
}
```

#### POST /api/portal/book-timeslot
Book a timeslot from the client portal.

**Authentication**: None  
**Method**: `POST`

**Request Body**:
```json
{
  "selectedStartTime": "2024-01-15T14:00:00.000Z",
  "clientId": "ObjectId",
  "clientName": "John Doe",
  "dogName": "Buddy"
}
```

**Response**: `200 OK`
```json
{
  "success": true,
  "message": "Timeslot booked successfully",
  "bookedSlot": {
    "_id": "ObjectId",
    "startTime": "2024-01-15T14:00:00.000Z",
    "endTime": "2024-01-15T15:00:00.000Z",
    "isAvailable": false,
    "bookedByClientId": "ObjectId"
  }
}
```

### Settings API

#### GET /api/settings
Get system settings and training options.

**Authentication**: Required  
**Method**: `GET`

**Response**:
```json
{
  "type": "training_options",
  "keyConcepts": [
    {
      "id": "ObjectId_string",
      "_id": "ObjectId",
      "title": "Positive Reinforcement",
      "description": "<p>Using rewards to encourage good behavior</p>",
      "url": "https://example.com/positive-reinforcement"
    }
  ],
  "productRecommendations": [...],
  "gamesAndActivities": [...],
  "homework": [...],
  "trainingSkills": [...],
  "customCategories": [
    {
      "id": "ObjectId_string",
      "_id": "ObjectId",
      "name": "Advanced Techniques",
      "order": 1,
      "items": [...]
    }
  ]
}
```

#### PUT /api/settings
Update system settings.

**Authentication**: Required  
**Method**: `PUT`

**Request Body**: Partial settings object with arrays to update

#### PUT /api/settings/items/[id]
Update a specific settings item.

**Authentication**: Required  
**Method**: `PUT`

**Parameters**:
- `id` (string): Item ObjectId

**Request Body**:
```json
{
  "title": "Updated Title",
  "description": "<p>Updated description</p>",
  "url": "https://updated-url.com"
}
```

#### DELETE /api/settings/items/[id]
Delete a specific settings item.

**Authentication**: Required  
**Method**: `DELETE`

### Google Calendar Integration API

#### GET /api/google-calendar/auth
Initiate Google Calendar OAuth flow.

**Authentication**: Required  
**Method**: `GET`

**Response**: `302 Redirect` to Google OAuth consent screen

#### GET /api/google-calendar/auth/callback
Handle Google OAuth callback.

**Authentication**: Required  
**Method**: `GET`

**Query Parameters**:
- `code` (string): OAuth authorization code from Google

#### GET /api/google-calendar/calendars
List connected Google calendars.

**Authentication**: Required  
**Method**: `GET`

**Response**:
```json
{
  "success": true,
  "accounts": [
    {
      "googleUserId": "google_user_id",
      "googleEmail": "user@gmail.com",
      "calendars": [
        {
          "id": "calendar_id",
          "summary": "Primary Calendar",
          "primary": true,
          "accessRole": "owner"
        }
      ]
    }
  ]
}
```

#### GET /api/google-calendar/events
Get Google Calendar events for selected calendars.

**Authentication**: Required  
**Method**: `GET`

**Query Parameters**:
- `start` (required): ISO date string
- `end` (required): ISO date string
- `calendarSelections` (optional): JSON string of calendar selections

**Response**:
```json
{
  "success": true,
  "events": [
    {
      "id": "google_event_id",
      "title": "Meeting",
      "start": "2024-01-15T10:00:00.000Z",
      "end": "2024-01-15T11:00:00.000Z",
      "calendarId": "calendar_id",
      "googleEmail": "user@gmail.com"
    }
  ]
}
```

#### PUT /api/google-calendar/preferences
Update calendar selection preferences.

**Authentication**: Required  
**Method**: `PUT`

**Request Body**:
```json
{
  "preferences": [
    {
      "googleUserId": "google_user_id",
      "calendarIds": ["calendar_id_1", "calendar_id_2"]
    }
  ]
}
```

#### DELETE /api/google-calendar/disconnect
Disconnect a Google account.

**Authentication**: Required  
**Method**: `DELETE`

**Request Body**:
```json
{
  "googleUserId": "google_user_id"
}
```

### File Upload API

#### POST /api/upload
Upload files to Cloudinary.

**Authentication**: Required  
**Method**: `POST`

**Request Body**: `FormData`
- `file`: File to upload
- `folder`: Target folder path
- `resourceType`: 'image', 'raw', or 'video'

**Response**:
```json
{
  "success": true,
  "url": "https://res.cloudinary.com/...",
  "publicId": "folder/filename",
  "resourceType": "image"
}
```

#### POST /api/portal/sign-upload
Generate signed upload parameters for client portal.

**Authentication**: None  
**Method**: `POST`

**Request Body**:
```json
{
  "folder": "clients/temp/vaccination-records",
  "resourceType": "raw"
}
```

**Response**:
```json
{
  "signature": "signed_params",
  "timestamp": 1234567890,
  "cloudName": "your_cloud_name",
  "apiKey": "your_api_key"
}
```

### Contact Form Submissions API

#### GET /api/contact-form-submissions
List contact form submissions.

**Authentication**: Required  
**Method**: `GET`

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search query
- `reviewed` (optional): Filter by reviewed status

**Response**:
```json
{
  "submissions": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 47,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### GET /api/contact-form-submissions/[id]
Get a specific contact form submission.

**Authentication**: Required  
**Method**: `GET`

#### PUT /api/contact-form-submissions/[id]
Update a contact form submission (mark as reviewed, add notes).

**Authentication**: Required  
**Method**: `PUT`

**Request Body**:
```json
{
  "reviewed": true,
  "notes": "Follow up scheduled for next week"
}
```

### Portal Client Access API

#### GET /api/portal/find-client
Find client by email and phone for portal access.

**Authentication**: None  
**Method**: `GET`

**Query Parameters**:
- `email` (required): Client email
- `phone` (required): Client phone

**Response**:
```json
{
  "success": true,
  "client": {
    "_id": "ObjectId",
    "name": "John Doe",
    "dogName": "Buddy",
    "email": "john@example.com"
  }
}
```

#### GET /api/portal/clients/[id]
Get client information for portal view.

**Authentication**: None  
**Method**: `GET`

**Parameters**:
- `id` (string): Client ObjectId

#### GET /api/portal/report-cards/[id]
Get report card for portal viewing.

**Authentication**: None  
**Method**: `GET`

**Parameters**:
- `id` (string): Report card ObjectId

## Error Handling

### Standard Error Response Format

```json
{
  "success": false,
  "error": "Error message description"
}
```

### HTTP Status Codes

- `200 OK` - Successful request
- `201 Created` - Resource created successfully  
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Access denied
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict (e.g., booking collision)
- `500 Internal Server Error` - Server error

### Common Error Scenarios

#### Authentication Errors
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

#### Validation Errors
```json
{
  "success": false,
  "error": "Missing required fields: name, email"
}
```

#### Resource Not Found
```json
{
  "success": false,
  "error": "Client not found"
}
```

#### Booking Conflicts
```json
{
  "success": false,
  "error": "This time slot has already been booked"
}
```

## Rate Limiting

Currently no rate limiting is implemented, but consider implementing for:
- Portal endpoints to prevent abuse
- File upload endpoints
- Email sending endpoints

## Versioning

The API currently does not use versioning. Future versions should consider:
- URL versioning: `/api/v1/clients`
- Header versioning: `Accept: application/vnd.api+json;version=1`

---

*Last updated: Recent*
*Owner: Engineering Team*
