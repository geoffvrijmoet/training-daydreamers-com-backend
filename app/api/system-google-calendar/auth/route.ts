import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateSystemAuthUrl } from '@/lib/google-calendar';

export async function GET() {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const authUrl = generateSystemAuthUrl();
    return NextResponse.json({ success: true, authUrl });
  } catch (error) {
    console.error('Error generating system auth URL:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate auth URL' }, 
      { status: 500 }
    );
  }
}
