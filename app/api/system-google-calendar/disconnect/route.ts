import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { disconnectSystemCalendar } from '@/lib/google-calendar';

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { googleUserId } = await request.json();
    
    if (!googleUserId) {
      return NextResponse.json(
        { success: false, error: 'Google User ID is required' }, 
        { status: 400 }
      );
    }

    await disconnectSystemCalendar(googleUserId);
    
    return NextResponse.json({ success: true, message: 'System calendar disconnected successfully' });
  } catch (error) {
    console.error('Error disconnecting system calendar:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to disconnect system calendar' }, 
      { status: 500 }
    );
  }
}
