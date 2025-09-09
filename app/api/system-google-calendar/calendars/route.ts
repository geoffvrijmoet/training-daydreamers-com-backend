import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSystemCalendarConnections } from '@/lib/google-calendar';

export async function GET() {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const connections = await getSystemCalendarConnections();
    return NextResponse.json({ success: true, connections });
  } catch (error) {
    console.error('Error fetching system calendars:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch system calendars' }, 
      { status: 500 }
    );
  }
}
