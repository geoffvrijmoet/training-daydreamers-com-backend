import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserCalendars } from '@/lib/google-calendar';

export async function GET() {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const calendarData = await getUserCalendars(userId);
    return NextResponse.json({ success: true, accounts: calendarData });
  } catch (error) {
    console.error('Error fetching calendars:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch calendars' }, 
      { status: 500 }
    );
  }
} 