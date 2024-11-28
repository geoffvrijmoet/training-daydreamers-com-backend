import { NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';

const storage = new Storage({
  projectId: 'daydreamers-dog-training',
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
});

const bucket = storage.bucket(process.env.GOOGLE_STORAGE_BUCKET!);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const path = formData.get('path') as string;

    if (!file || !path) {
      return NextResponse.json(
        { success: false, error: 'File and path are required' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const blob = bucket.file(path);

    await blob.save(buffer, {
      metadata: {
        contentType: file.type,
        cacheControl: 'public, max-age=31536000',
      },
    });

    // Make the file public
    await blob.makePublic();

    const publicUrl = `https://storage.googleapis.com/${process.env.GOOGLE_STORAGE_BUCKET}/${path}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload image' },
      { status: 500 }
    );
  }
} 