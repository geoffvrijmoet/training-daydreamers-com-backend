import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateAuthUrl } from '@/lib/google-calendar';

export async function GET() {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const authUrl = generateAuthUrl();
    return NextResponse.json({ success: true, authUrl });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate authorization URL' }, 
      { status: 500 }
    );
  }
} 