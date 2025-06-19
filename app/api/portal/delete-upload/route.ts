import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function DELETE(request: Request) {
  try {
    const { publicId, resourceType } = await request.json();

    if (!publicId || typeof publicId !== 'string') {
      return NextResponse.json({ success: false, error: 'publicId required' }, { status: 400 });
    }

    // Only allow deletes for temp folders accessible by unauthenticated users
    if (!publicId.startsWith('clients/temp/') && !publicId.startsWith('clients/admin-temp/')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: (resourceType || 'image') as 'image' | 'raw' | 'video',
    });

    if (result.result === 'ok' || result.result === 'not_found') {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Cloudinary deletion failed' }, { status: 500 });
  } catch (error) {
    console.error('Error deleting temp upload:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
} 