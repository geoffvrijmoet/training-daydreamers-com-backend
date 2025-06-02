import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  try {
    const { files, clientId } = await request.json();

    console.log('Metadata update called with:', { files, clientId });

    if (!files || !Array.isArray(files) || !clientId) {
      return NextResponse.json(
        { error: 'Files array and clientId are required' },
        { status: 400 }
      );
    }

    const updatePromises = files.map(async (file: { publicId: string; resourceType: string }) => {
      try {
        // Extract current path parts
        const pathParts = file.publicId.split('/');
        console.log('Processing file:', { publicId: file.publicId, pathParts });
        
        // Handle new folder structure: clients/temp/ or clients/admin-temp/ -> clients/client-{id}/
        if (pathParts.length >= 3 && pathParts[0] === 'clients' && (pathParts[1] === 'temp' || pathParts[1] === 'admin-temp')) {
          console.log('Matched new folder structure for file:', file.publicId);
          const newPublicId = [...pathParts];
          newPublicId[1] = `client-${clientId}`;
          const newPath = newPublicId.join('/');

          // Rename the file in Cloudinary (this updates the path/folder)
          const renameResult = await cloudinary.uploader.rename(
            file.publicId,
            newPath,
            { 
              resource_type: file.resourceType || 'image',
              overwrite: false // Don't overwrite if target exists
            }
          );

          // Update tags - remove temp tags and add new client tag
          await cloudinary.uploader.add_tag(
            `client-${clientId}`,
            [newPath],
            { resource_type: file.resourceType || 'image' }
          );

          // Remove old tags
          const oldTag = pathParts[1]; // either 'temp' or 'admin-temp'
          await cloudinary.uploader.remove_tag(
            oldTag,
            [newPath],
            { resource_type: file.resourceType || 'image' }
          );

          // Update context metadata
          await cloudinary.uploader.explicit(
            newPath,
            {
              type: 'upload',
              resource_type: (file.resourceType || 'image') as 'image' | 'raw' | 'video',
              context: {
                client_id: clientId,
                status: 'completed'
              }
            }
          );

          return {
            success: true,
            oldPublicId: file.publicId,
            newPublicId: newPath,
            newUrl: renameResult.secure_url
          };
        } 
        // Handle legacy folder structure for backward compatibility
        else if (pathParts.length >= 2 && (pathParts[1] === 'client-temp' || pathParts[1] === 'admin-temp')) {
          const newPublicId = [...pathParts];
          newPublicId[1] = `client-${clientId}`;
          const newPath = newPublicId.join('/');

          // Rename the file in Cloudinary (this updates the path/folder)
          const renameResult = await cloudinary.uploader.rename(
            file.publicId,
            newPath,
            { 
              resource_type: file.resourceType || 'image',
              overwrite: false // Don't overwrite if target exists
            }
          );

          // Update tags - remove 'client-temp'/'admin-temp' and add new client tag
          await cloudinary.uploader.add_tag(
            `client-${clientId}`,
            [newPath],
            { resource_type: file.resourceType || 'image' }
          );

          // Remove old tags
          const oldTag = pathParts[1]; // either 'client-temp' or 'admin-temp'
          await cloudinary.uploader.remove_tag(
            oldTag,
            [newPath],
            { resource_type: file.resourceType || 'image' }
          );

          // Update context metadata
          await cloudinary.uploader.explicit(
            newPath,
            {
              type: 'upload',
              resource_type: (file.resourceType || 'image') as 'image' | 'raw' | 'video',
              context: {
                client_id: clientId,
                status: 'completed'
              }
            }
          );

          return {
            success: true,
            oldPublicId: file.publicId,
            newPublicId: newPath,
            newUrl: renameResult.secure_url
          };
        } else {
          // File doesn't have temp path structure, just update tags and context
          await cloudinary.uploader.add_tag(
            `client-${clientId}`,
            [file.publicId],
            { resource_type: file.resourceType || 'image' }
          );

          // Remove both possible temp tags
          try {
            await cloudinary.uploader.remove_tag(
              'client-temp',
              [file.publicId],
              { resource_type: file.resourceType || 'image' }
            );
          } catch (error) {
            // Ignore if tag doesn't exist
          }

          try {
            await cloudinary.uploader.remove_tag(
              'admin-temp',
              [file.publicId],
              { resource_type: file.resourceType || 'image' }
            );
          } catch (error) {
            // Ignore if tag doesn't exist
          }

          await cloudinary.uploader.explicit(
            file.publicId,
            {
              type: 'upload',
              resource_type: (file.resourceType || 'image') as 'image' | 'raw' | 'video',
              context: {
                client_id: clientId,
                status: 'completed'
              }
            }
          );

          return {
            success: true,
            oldPublicId: file.publicId,
            newPublicId: file.publicId,
            newUrl: null // URL stays the same
          };
        }
      } catch (error) {
        console.error('Error updating file metadata:', error);
        return {
          success: false,
          oldPublicId: file.publicId,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    const results = await Promise.all(updatePromises);
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    return NextResponse.json({
      success: true,
      message: `Updated ${successful.length} files, ${failed.length} failed`,
      results: {
        successful,
        failed
      }
    });

  } catch (error) {
    console.error('Error updating file metadata:', error);
    return NextResponse.json(
      { error: 'Failed to update file metadata' },
      { status: 500 }
    );
  }
} 