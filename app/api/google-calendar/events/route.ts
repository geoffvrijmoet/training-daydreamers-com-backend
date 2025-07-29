import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getCalendarEvents } from '@/lib/google-calendar';

export async function GET(request: Request) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const startStr = searchParams.get('start');
  const endStr = searchParams.get('end');
  const calendarSelectionsParam = searchParams.get('calendarSelections');

  console.log('🔍 Google Calendar Events API called:', {
    userId,
    startStr,
    endStr,
    calendarSelectionsParam
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

    // Parse calendar selections if provided
    let calendarSelections: Array<{ googleUserId: string; calendarIds: string[] }> | undefined;
    if (calendarSelectionsParam) {
      try {
        calendarSelections = JSON.parse(decodeURIComponent(calendarSelectionsParam));
        console.log('📅 Parsed calendar selections:', calendarSelections);
      } catch (error) {
        console.error('Error parsing calendar selections:', error);
        // Continue without selections - will use all calendars from all accounts
      }
    } else {
      console.log('📅 No calendar selections provided - will use default calendars');
    }

    const events = await getCalendarEvents(userId, startDate, endDate, calendarSelections);
    
    console.log('🎉 Google Calendar events fetched:', {
      count: events.length,
      events: events.map(e => ({
        id: e.id,
        title: e.title,
        start: e.start,
        calendarId: e.calendarId,
        googleEmail: e.googleEmail
      }))
    });

    // Format events for FullCalendar
    const formattedEvents = events.map(event => ({
      id: `google-${event.googleUserId}-${event.id}`,
      title: event.title,
      start: event.start.toISOString(),
      end: event.end.toISOString(),
      backgroundColor: '#e0f2fe', // Light blue-50 background
      borderColor: '#0284c7', // Blue-600 border for contrast
      textColor: '#0c4a6e', // Blue-900 text for readability
      extendedProps: {
        source: 'google',
        calendarId: event.calendarId,
        calendarSummary: event.calendarSummary,
        description: event.description,
        location: event.location,
        googleUserId: event.googleUserId,
        googleEmail: event.googleEmail
      }
    }));

    console.log('✅ Formatted events for FullCalendar:', formattedEvents.length);

    return NextResponse.json({ success: true, events: formattedEvents });
  } catch (error) {
    console.error('❌ Error fetching Google Calendar events:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch events' }, 
      { status: 500 }
    );
  }
} 