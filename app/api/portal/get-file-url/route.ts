import { NextResponse } from 'next/server';
import { generatePresignedDownloadUrl } from '@/lib/s3';

export async function POST(request: Request) {
  try {
    const { s3Key } = await request.json();

    if (!s3Key || typeof s3Key !== 'string') {
      return NextResponse.json({ success: false, error: 's3Key required' }, { status: 400 });
    }

    console.log('Generating presigned URL for s3Key:', s3Key);

    // Generate presigned download URL (7 days expiration - max allowed by S3)
    const url = await generatePresignedDownloadUrl(s3Key, 604800); // 7 days = 604800 seconds

    console.log('Successfully generated presigned URL');

    return NextResponse.json({
      success: true,
      url,
    });
  } catch (error) {
    console.error('Error generating file URL:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      success: false, 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 });
  }
}

