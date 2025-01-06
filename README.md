# Daydreamers Dog Training Admin

Admin dashboard for managing Daydreamers Dog Training clients and report cards.

## Environment Variables

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Clerk authentication publishable key
- `CLERK_SECRET_KEY`: Clerk authentication secret key
- `MONGODB_URI`: MongoDB connection string

### Google Cloud Storage (for QR codes)
- `GOOGLE_CLIENT_EMAIL`: Google service account email
- `GOOGLE_PRIVATE_KEY`: Google service account private key
- `GOOGLE_STORAGE_BUCKET`: Google Cloud Storage bucket name
- `GOOGLE_STORAGE_URL`: Google Cloud Storage base URL

## Features

- Client management
- Report card creation and management
- Key concepts and product recommendations management
- QR code generation and storage with Google Cloud Storage