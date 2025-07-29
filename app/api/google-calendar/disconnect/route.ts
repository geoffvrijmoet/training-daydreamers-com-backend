import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { disconnectCalendar } from '@/lib/google-calendar';

export async function POST(request: Request) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { googleUserId } = body;

    if (!googleUserId) {
      return NextResponse.json(
        { success: false, error: 'googleUserId is required' }, 
        { status: 400 }
      );
    }

    await disconnectCalendar(userId, googleUserId);
    return NextResponse.json({ 
      success: true, 
      message: 'Google Calendar account disconnected successfully' 
    });
  } catch (error) {
    console.error('Error disconnecting calendar:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to disconnect calendar' }, 
      { status: 500 }
    );
  }
} 