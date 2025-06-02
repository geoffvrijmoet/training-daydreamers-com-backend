import { NextResponse } from 'next/server';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'vaccination', 'dogPhoto', or 'liabilityWaiver'
    const clientId = formData.get('clientId') as string;

    console.log('Upload API called with:', {
      fileName: file?.name,
      type,
      clientId,
      fileType: file?.type
    });

    if (!file || !type || !clientId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create folder structure and public ID
    const timestamp = Date.now();
    const sanitizedClientId = clientId.replace(/[^a-zA-Z0-9-]/g, '');
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    
    // New organized folder structure: clients/temp/ or clients/admin-temp/
    let subfolder = '';
    switch (type) {
      case 'vaccination':
        subfolder = 'vaccination-records';
        break;
      case 'dogPhoto':
        subfolder = 'dog-photos';
        break;
      case 'liabilityWaiver':
        subfolder = 'liability-waivers';
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid file type' },
          { status: 400 }
        );
    }
    
    // Set folder structure based on whether it's temp or real client
    let folder;
    if (clientId === 'temp' || clientId === 'admin-temp') {
      folder = `clients/${clientId}/${subfolder}`;
    } else {
      folder = `clients/client-${sanitizedClientId}/${subfolder}`;
    }
    const publicId = `${timestamp}${fileExtension ? `.${fileExtension}` : ''}`;

    console.log('Upload parameters:', {
      folder,
      publicId,
      fullPath: `${folder}/${publicId}`,
      resourceType: (type === 'vaccination' || type === 'liabilityWaiver') && file.type === 'application/pdf' ? 'raw' : 'image'
    });

    // Determine resource type based on file type
    const resourceType = (type === 'vaccination' || type === 'liabilityWaiver') && file.type === 'application/pdf' ? 'raw' : 'image';
    
    // Upload to Cloudinary
    const uploadResponse = await new Promise<UploadApiResponse>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: resourceType,
          public_id: publicId,
          folder: folder,
          // Add format for better file recognition
          format: fileExtension || undefined,
          tags: [
            clientId === 'temp' || clientId === 'admin-temp' ? clientId : `client-${sanitizedClientId}`
          ],
          context: {
            client_id: clientId,
            file_type: type,
            original_name: file.name,
            uploaded_at: new Date().toISOString()
          }
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else if (result) {
            console.log('Cloudinary upload success:', {
              public_id: result.public_id,
              secure_url: result.secure_url,
              resource_type: result.resource_type
            });
            resolve(result);
          } else {
            console.error('Cloudinary upload failed: no result');
            reject(new Error('Upload failed'));
          }
        }
      ).end(buffer);
    });

    console.log('Final upload response:', {
      url: uploadResponse.secure_url,
      publicId: uploadResponse.public_id,
      resourceType: uploadResponse.resource_type
    });

    return NextResponse.json({ 
      url: uploadResponse.secure_url,
      publicId: uploadResponse.public_id,
      resourceType: uploadResponse.resource_type
    });
  } catch (error) {
    console.error('Error uploading file to Cloudinary:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
} 