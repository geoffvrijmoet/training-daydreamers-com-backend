import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { exchangeCodeForTokens, saveCalendarConnection } from '@/lib/google-calendar';
import { google } from 'googleapis';

export async function GET(request: Request) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    console.error('OAuth error:', error);
    return NextResponse.redirect(new URL('/calendar?error=oauth_failed', request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/calendar?error=no_code', request.url));
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    
    // Fetch all calendars for this Google account to auto-select them
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID!,
      process.env.GOOGLE_CLIENT_SECRET!,
      process.env.GOOGLE_REDIRECT_URI!
    );
    oauth2Client.setCredentials({ access_token: tokens.access_token });
    
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const response = await calendar.calendarList.list();
    
    // Get all calendar IDs to auto-select them
    const allCalendarIds = (response.data.items || [])
      .filter(cal => cal.id) // Only calendars with valid IDs
      .map(cal => cal.id!);
    
    console.log(`🎉 Auto-selecting ${allCalendarIds.length} calendars for ${tokens.googleEmail}:`, allCalendarIds);
    
    await saveCalendarConnection(
      userId,
      tokens.googleUserId,
      tokens.googleEmail,
      tokens.access_token,
      tokens.refresh_token,
      new Date(tokens.expiry_date),
      allCalendarIds // Auto-select all calendars
    );

    return NextResponse.redirect(new URL('/calendar?success=connected', request.url));
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    return NextResponse.redirect(new URL('/calendar?error=token_exchange_failed', request.url));
  }
} 