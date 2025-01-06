import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const uploadPath = formData.get('path') as string;

    if (!file || !uploadPath) {
      return NextResponse.json(
        { success: false, error: 'File and path are required' },
        { status: 400 }
      );
    }

    // Create a unique filename
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name}`;
    const filepath = path.join(uploadsDir, uploadPath, filename);

    // Convert File to Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Save file to local storage
    await writeFile(filepath, buffer);

    // Generate public URL
    const publicUrl = `/uploads/${uploadPath}/${filename}`;

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