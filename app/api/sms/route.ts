import { NextResponse } from 'next/server';
import { sendSms } from '@/lib/sms';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { to, body } = await req.json();
  if (!to || !body) return NextResponse.json({ error: 'Invalid' }, { status: 400 });
  await sendSms(to, body);
  return NextResponse.json({ success: true });
}
