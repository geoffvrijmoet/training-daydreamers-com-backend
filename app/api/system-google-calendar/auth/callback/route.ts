import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { exchangeCodeForSystemTokens, saveSystemCalendarConnection, createSystemOAuth2Client } from '@/lib/google-calendar';
import { calendar_v3 } from 'googleapis';

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    console.error('OAuth error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:7777'}/settings?google_error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:7777'}/settings?google_error=no_code`);
  }

  try {
    // Exchange code for tokens
    const { access_token, refresh_token, expiry_date, googleUserId, googleEmail } = await exchangeCodeForSystemTokens(code);
    
    // Get available calendars for this Google account
    const oauth2Client = createSystemOAuth2Client();
    oauth2Client.setCredentials({ access_token });
    
    const { google } = await import('googleapis');
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const response = await calendar.calendarList.list();
    const calendars = (response.data.items || [])
      .map((cal: calendar_v3.Schema$CalendarListEntry) => cal.id)
      .filter((id): id is string => Boolean(id));
    
    // Save system calendar connection
    // eslint-disable-next-line no-console
    console.log(`🔧 About to save system connection for ${googleEmail} with ${calendars.length} calendars`);
    const savedConnection = await saveSystemCalendarConnection(
      "Madeline's Primary Calendar", // Default connection name
      googleUserId,
      googleEmail,
      access_token,
      refresh_token,
      new Date(expiry_date),
      calendars // Auto-select all calendars
    );

    // eslint-disable-next-line no-console
    console.log(`✅ System Google Calendar connected: ${googleEmail} with ${calendars.length} calendars`);
    // eslint-disable-next-line no-console
    console.log(`📝 Saved connection ID: ${savedConnection._id}`);

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:7777'}/calendar?google_success=system_connected`);
  } catch (error) {
    console.error('Error in system OAuth callback:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:7777'}/calendar?google_error=callback_failed`);
  }
}
