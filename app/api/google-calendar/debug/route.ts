import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getAllConnectionsForUser, getUserCalendars } from '@/lib/google-calendar';

export async function GET() {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('🔍 Debug - Getting connections for userId:', userId);
    
    // Get raw connections from database
    const connections = await getAllConnectionsForUser(userId);
    console.log('📊 Raw connections from DB:', connections);

    // Get calendars from Google API
    let calendarData: Array<{
      googleUserId: string;
      googleEmail: string;
      calendars: Array<{
        id: string;
        summary: string;
        primary?: boolean;
        accessRole: string;
      }>;
    }> = [];
    
    try {
      calendarData = await getUserCalendars(userId);
      console.log('📅 Calendar data from Google API:', calendarData);
    } catch (error) {
      console.error('❌ Error fetching calendars:', error);
    }

    return NextResponse.json({ 
      success: true, 
      debug: {
        userId,
        connectionsCount: connections.length,
        connections: connections.map(c => ({
          googleUserId: c.googleUserId,
          googleEmail: c.googleEmail,
          calendarIds: c.calendarIds,
          isActive: c.isActive,
          tokenExpiry: c.tokenExpiry,
          lastSyncAt: c.lastSyncAt
        })),
        calendarData
      }
    });
  } catch (error) {
    console.error('❌ Debug endpoint error:', error);
    return NextResponse.json(
      { success: false, error: 'Debug failed', details: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
} 