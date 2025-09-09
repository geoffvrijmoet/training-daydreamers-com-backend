import { NextResponse } from 'next/server';
import { getSystemGoogleCalendarEvents } from '@/lib/google-calendar';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startStr = searchParams.get('start');
  const endStr = searchParams.get('end');

  console.log('🔍 System Google Calendar Events API called:', {
    startStr,
    endStr
  });

  if (!startStr || !endStr) {
    return NextResponse.json(
      { success: false, error: 'Missing start or end query parameters' }, 
      { status: 400 }
    );
  }

  try {
    const startDate = new Date(startStr);
    const endDate = new Date(endStr);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid date format' }, 
        { status: 400 }
      );
    }

    const events = await getSystemGoogleCalendarEvents(startDate, endDate);
    
    console.log('🎉 System Google Calendar events fetched:', {
      count: events.length,
      events: events.map(e => ({
        id: e.id,
        title: e.title,
        start: e.start,
        calendarId: e.calendarId,
        googleEmail: e.googleEmail
      }))
    });

    // Format events for portal calendar (as blocked/unavailable times)
    const formattedEvents = events.map(event => ({
      id: `system-google-${event.googleUserId}-${event.id}`,
      title: 'Unavailable', // Don't show event details to clients
      start: event.start.toISOString(),
      end: event.end.toISOString(),
      backgroundColor: '#f3f4f6', // Gray background for unavailable
      borderColor: '#9ca3af', // Gray border
      textColor: '#6b7280', // Gray text
      extendedProps: {
        source: 'system-google',
        calendarId: event.calendarId,
        calendarSummary: event.calendarSummary,
        description: event.description,
        location: event.location,
        googleUserId: event.googleUserId,
        googleEmail: event.googleEmail,
        isSystemBlocked: true // Flag to indicate this is a system-blocked time
      }
    }));

    console.log('✅ Formatted system events for portal calendar:', formattedEvents.length);

    return NextResponse.json({ success: true, events: formattedEvents });
  } catch (error) {
    console.error('❌ Error fetching system Google Calendar events:', error);
    
    // Check if this is a connection expired error
    if (error instanceof Error && error.message.includes('System Google Calendar connection expired')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'System Google Calendar connection expired. Please reconnect the system calendar.',
          requiresReauth: true
        }, 
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch system Google Calendar events' }, 
      { status: 500 }
    );
  }
}
