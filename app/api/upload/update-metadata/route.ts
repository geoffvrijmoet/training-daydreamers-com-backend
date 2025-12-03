import { NextResponse } from 'next/server';
import { copyFileInS3, deleteFileFromS3, generatePresignedDownloadUrl } from '@/lib/s3';

export async function POST(request: Request) {
  try {
    const { files, clientId } = await request.json();

    console.log('File move called with:', { files, clientId });

    if (!files || !Array.isArray(files) || !clientId) {
      return NextResponse.json(
        { error: 'Files array and clientId are required' },
        { status: 400 }
      );
    }

    const movePromises = files.map(async (file: { s3Key: string }) => {
      try {
        const { s3Key } = file;
        if (!s3Key || typeof s3Key !== 'string') {
          throw new Error('s3Key is required');
        }

        // Extract current path parts
        const pathParts = s3Key.split('/');
        console.log('Processing file:', { s3Key, pathParts });

        // Handle folder structure: clients/temp/ or clients/admin-temp/ -> clients/client-{id}/
        if (pathParts.length >= 3 && pathParts[0] === 'clients' && (pathParts[1] === 'temp' || pathParts[1] === 'admin-temp')) {
          const newPathParts = [...pathParts];
          newPathParts[1] = `client-${clientId}`;
          const newS3Key = newPathParts.join('/');
          console.log('Will move from:', s3Key, 'to:', newS3Key);

          // Copy file to new location
          const result = await copyFileInS3(s3Key, newS3Key);
          console.log('Copied file:', result);

          // Delete original file from temp folder
          try {
            await deleteFileFromS3(s3Key);
            console.log('Deleted temp file:', s3Key);
          } catch (delErr) {
            console.warn('Failed to delete temp file (non-fatal):', delErr);
            // Continue even if delete fails - file is already copied
          }

          // Generate download URL for the new location
          const newUrl = await generatePresignedDownloadUrl(newS3Key, 604800); // 7 days expiration (max allowed by S3)

          return {
            success: true,
            oldS3Key: s3Key,
            newS3Key: result.key,
            newUrl: result.url || newUrl,
          };
        } else {
          // File doesn't have temp path structure, no move needed
          // Just generate a download URL
          const url = await generatePresignedDownloadUrl(s3Key, 604800); // 7 days expiration (max allowed by S3)
          return {
            success: true,
            oldS3Key: s3Key,
            newS3Key: s3Key,
            newUrl: url,
          };
        }
      } catch (error) {
        console.error('Error moving file:', error);
        return {
          success: false,
          oldS3Key: file.s3Key,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    const results = await Promise.all(movePromises);

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    return NextResponse.json({
      success: true,
      message: `Moved ${successful.length} files, ${failed.length} failed`,
      results: {
        successful,
        failed
      }
    });

  } catch (error) {
    console.error('Error moving files:', error);
    return NextResponse.json(
      { error: 'Failed to move files' },
      { status: 500 }
    );
  }
}
