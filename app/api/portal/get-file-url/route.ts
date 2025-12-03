import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { generatePresignedDownloadUrl } from '@/lib/s3';
import { rateLimit } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  // Rate limiting: 30 requests per minute per IP
  const limit = rateLimit(request, {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
  });

  if (!limit.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((limit.resetTime - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': '30',
          'X-RateLimit-Remaining': limit.remaining.toString(),
          'X-RateLimit-Reset': limit.resetTime.toString(),
          'Retry-After': Math.ceil((limit.resetTime - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const s3Key = searchParams.get('s3Key');

    if (!s3Key || typeof s3Key !== 'string') {
      return NextResponse.json({ success: false, error: 's3Key parameter required' }, { status: 400 });
    }

    // Generate presigned download URL and redirect
    const url = await generatePresignedDownloadUrl(s3Key, 604800); // 7 days = 604800 seconds

    // Redirect to the presigned URL
    return NextResponse.redirect(url);
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

export async function POST(request: Request) {
  // Rate limiting: 30 requests per minute per IP
  const limit = rateLimit(request, {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
  });

  if (!limit.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((limit.resetTime - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': '30',
          'X-RateLimit-Remaining': limit.remaining.toString(),
          'X-RateLimit-Reset': limit.resetTime.toString(),
          'Retry-After': Math.ceil((limit.resetTime - Date.now()) / 1000).toString(),
        },
      }
    );
  }

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

