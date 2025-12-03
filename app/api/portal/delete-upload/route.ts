import { NextResponse } from 'next/server';
import { deleteFileFromS3 } from '@/lib/s3';

export async function DELETE(request: Request) {
  try {
    const { s3Key } = await request.json();

    if (!s3Key || typeof s3Key !== 'string') {
      return NextResponse.json({ success: false, error: 's3Key required' }, { status: 400 });
    }

    // Only allow deletes for temp folders accessible by unauthenticated users
    if (!s3Key.startsWith('clients/temp/') && !s3Key.startsWith('clients/admin-temp/')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    try {
      await deleteFileFromS3(s3Key);
      return NextResponse.json({ success: true });
    } catch (error) {
      // If file doesn't exist, treat as success (idempotent)
      if (error instanceof Error && error.name === 'NoSuchKey') {
        return NextResponse.json({ success: true });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error deleting temp upload:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
} 