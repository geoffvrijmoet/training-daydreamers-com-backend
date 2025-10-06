import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const publicId = searchParams.get('publicId');
    const resourceType = searchParams.get('resourceType') || 'raw';

    if (!publicId) {
      return NextResponse.json({ success: false, error: 'Missing publicId parameter' }, { status: 400 });
    }

    // Generate the proper Cloudinary URL for raw resources
    const url = cloudinary.url(publicId, {
      resource_type: resourceType,
      secure: true,
      sign_url: false, // Don't sign the URL for public access
    });

    // Fetch the PDF from Cloudinary
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('Failed to fetch PDF from Cloudinary:', response.status, response.statusText);
      return NextResponse.json({ success: false, error: 'PDF not found' }, { status: 404 });
    }

    const pdfBuffer = await response.arrayBuffer();

    // Return the PDF with proper headers
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="liability-waiver.pdf"',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });

  } catch (error) {
    console.error('Error serving liability waiver PDF:', error);
    return NextResponse.json({ success: false, error: 'Failed to serve PDF' }, { status: 500 });
  }
}
