import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface RequestBody {
  type: 'vaccination' | 'dogPhoto';
}

const SUBFOLDER_MAP: Record<RequestBody['type'], string> = {
  vaccination: 'vaccination-records',
  dogPhoto: 'dog-photos',
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<RequestBody>;
    const { type } = body;

    if (!type || !(type in SUBFOLDER_MAP)) {
      return NextResponse.json({ success: false, error: 'Invalid or missing file type' }, { status: 400 });
    }

    const folder = `clients/temp/${SUBFOLDER_MAP[type]}`; // unauth users always go to temp
    const timestamp = Math.floor(Date.now() / 1000);
    const publicId = `${timestamp}-${Math.random().toString(36).substring(2, 10)}`;

    const paramsToSign: Record<string, string | number> = {
      timestamp,
      folder,
      public_id: publicId,
    };

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET as string
    );

    return NextResponse.json({
      success: true,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      timestamp,
      folder,
      publicId,
      signature,
      resourceType: type === 'vaccination' ? 'auto' : 'image',
    });
  } catch (error) {
    console.error('Error creating Cloudinary signature:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
} 