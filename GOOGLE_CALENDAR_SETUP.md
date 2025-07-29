# Google Calendar Integration Setup

This guide will help you set up Google Calendar integration for the training daydreamers application.

## Prerequisites

1. A Google Cloud Platform account
2. Access to the Google Cloud Console

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Calendar API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click on it and press "Enable"

## Step 2: Configure OAuth2 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application" as the application type
4. Add the following authorized redirect URIs:
   - For development: `http://localhost:7777/api/google-calendar/auth/callback`
   - For production: `https://yourdomain.com/api/google-calendar/auth/callback`
5. Click "Create"
6. Note down your **Client ID** and **Client Secret**

## Step 3: Configure Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:7777/api/google-calendar/auth/callback
```

For production, update the `GOOGLE_REDIRECT_URI` to your production domain.

## Step 4: Test the Integration

1. Start your development server: `npm run dev`
2. Navigate to the calendar page
3. Click "Connect Google Calendar"
4. Complete the OAuth flow
5. Select which calendars you want to sync
6. Your Google Calendar events should now appear in green on your training calendar

## Features

- **Multi-calendar support**: Connect and sync multiple Google Calendars
- **Automatic token refresh**: Tokens are automatically refreshed when they expire
- **Calendar preferences**: Choose which calendars to sync
- **Visual distinction**: Google Calendar events appear in green to distinguish them from training timeslots
- **Real-time sync**: Events are fetched when the calendar view changes

## Troubleshooting

### Common Issues

1. **"Invalid redirect URI" error**: Make sure your redirect URI exactly matches what's configured in Google Cloud Console
2. **"Access denied" error**: Ensure the Google Calendar API is enabled in your Google Cloud project
3. **Events not appearing**: Check that you've selected calendars in the Google Calendar Settings dialog

### Debug Mode

To enable debug logging, add this to your environment variables:
```bash
DEBUG=googleapis:*
```

## Security Notes

- Never commit your Google OAuth credentials to version control
- Use environment variables for all sensitive configuration
- The application only requests read-only access to calendars
- Tokens are stored securely in the database and automatically refreshed 