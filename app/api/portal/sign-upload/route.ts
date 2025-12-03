import { NextResponse } from 'next/server';
import { generatePresignedUploadUrl, generateS3Key, generateUniqueFileName } from '@/lib/s3';
import { rateLimit } from '@/lib/rate-limit';

interface RequestBody {
  type: 'vaccination' | 'dogPhoto' | 'liabilityWaiver';
  fileName?: string; // Optional filename for better organization
  contentType?: string; // Optional content type
}

export async function POST(request: Request) {
  // Rate limiting: 10 requests per minute per IP
  const limit = rateLimit(request, {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
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
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': limit.remaining.toString(),
          'X-RateLimit-Reset': limit.resetTime.toString(),
          'Retry-After': Math.ceil((limit.resetTime - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  try {
    const body = (await request.json()) as Partial<RequestBody>;
    const { type, fileName, contentType } = body;

    if (!type || !['vaccination', 'dogPhoto', 'liabilityWaiver'].includes(type)) {
      return NextResponse.json({ success: false, error: 'Invalid or missing file type' }, { status: 400 });
    }

    // Generate unique filename
    const uniqueFileName = fileName
      ? generateUniqueFileName(fileName)
      : generateUniqueFileName(`file.${type === 'liabilityWaiver' ? 'pdf' : type === 'vaccination' ? 'pdf' : 'jpg'}`);

    // Generate S3 key for temp folder (unauth users always go to temp)
    const s3Key = generateS3Key('temp', type, uniqueFileName);

    // Determine content type based on file type if not provided
    const fileContentType = contentType || (
      type === 'liabilityWaiver' ? 'application/pdf' :
      type === 'vaccination' ? 'application/pdf' :
      'image/jpeg'
    );

    // Generate presigned URL for upload
    const presignedUrl = await generatePresignedUploadUrl(s3Key, fileContentType, 3600); // 1 hour expiration

    return NextResponse.json({
      success: true,
      presignedUrl,
      s3Key,
      fileName: uniqueFileName,
      contentType: fileContentType,
    });
  } catch (error) {
    console.error('Error creating S3 presigned URL:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
} 