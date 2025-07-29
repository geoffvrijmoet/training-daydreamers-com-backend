import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { updateCalendarPreferences, getAllConnectionsForUser } from '@/lib/google-calendar';

export async function GET() {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const connections = await getAllConnectionsForUser(userId);
    const preferences = connections.map(conn => ({
      googleUserId: conn.googleUserId,
      googleEmail: conn.googleEmail,
      calendarIds: conn.calendarIds
    }));
    
    return NextResponse.json({ 
      success: true, 
      preferences
    });
  } catch (error) {
    console.error('Error fetching calendar preferences:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch preferences' }, 
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { accountPreferences } = body; // Array of { googleUserId, calendarIds }

    if (!Array.isArray(accountPreferences)) {
      return NextResponse.json(
        { success: false, error: 'accountPreferences must be an array' }, 
        { status: 400 }
      );
    }

    // Update preferences for each account
    const results = [];
    for (const pref of accountPreferences) {
      if (!pref.googleUserId || !Array.isArray(pref.calendarIds)) {
        continue; // Skip invalid entries
      }
      
      const connection = await updateCalendarPreferences(
        userId, 
        pref.googleUserId, 
        pref.calendarIds
      );
      results.push({
        googleUserId: connection.googleUserId,
        googleEmail: connection.googleEmail,
        calendarIds: connection.calendarIds
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Calendar preferences updated successfully',
      accounts: results
    });
  } catch (error) {
    console.error('Error updating calendar preferences:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update preferences' }, 
      { status: 500 }
    );
  }
} 