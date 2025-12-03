import { S3Client, PutObjectCommand, DeleteObjectCommand, CopyObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Validate required environment variables
if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_S3_BUCKET_NAME) {
  console.warn('⚠️  AWS S3 environment variables not fully configured. File uploads will fail.');
  console.warn('Required: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET_NAME');
}

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || '';

// Helper to check if S3 is properly configured
function isS3Configured(): boolean {
  return !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_S3_BUCKET_NAME);
}

export interface S3FileInfo {
  key: string;
  url: string;
}

/**
 * Generate a presigned URL for uploading a file to S3
 * @param key - S3 object key (path)
 * @param contentType - MIME type of the file
 * @param expiresIn - URL expiration time in seconds (default: 3600 = 1 hour)
 * @returns Presigned URL for PUT operation
 */
export async function generatePresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn: number = 3600
): Promise<string> {
  if (!isS3Configured()) {
    throw new Error('AWS S3 is not properly configured. Please set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_S3_BUCKET_NAME environment variables.');
  }

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Generate a presigned URL for downloading/viewing a file from S3
 * @param key - S3 object key (path)
 * @param expiresIn - URL expiration time in seconds (default: 3600 = 1 hour)
 * @returns Presigned URL for GET operation
 */
export async function generatePresignedDownloadUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  if (!isS3Configured()) {
    const missing = [];
    if (!process.env.AWS_ACCESS_KEY_ID) missing.push('AWS_ACCESS_KEY_ID');
    if (!process.env.AWS_SECRET_ACCESS_KEY) missing.push('AWS_SECRET_ACCESS_KEY');
    if (!process.env.AWS_S3_BUCKET_NAME) missing.push('AWS_S3_BUCKET_NAME');
    throw new Error(`AWS S3 is not properly configured. Missing: ${missing.join(', ')}`);
  }

  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
  } catch (error) {
    console.error('Error generating presigned download URL:', {
      key,
      bucket: BUCKET_NAME,
      region: process.env.AWS_REGION,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

/**
 * Upload a file directly to S3 (server-side)
 * @param key - S3 object key (path)
 * @param body - File buffer or stream
 * @param contentType - MIME type of the file
 * @returns S3 file info with key and URL
 */
export async function uploadFileToS3(
  key: string,
  body: Buffer | Uint8Array | string,
  contentType: string
): Promise<S3FileInfo> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: contentType,
  });

  await s3Client.send(command);

  // Generate a presigned URL for the uploaded file
  const url = await generatePresignedDownloadUrl(key, 604800); // 7 days expiration (max allowed by S3)

  return {
    key,
    url,
  };
}

/**
 * Delete a file from S3
 * @param key - S3 object key (path)
 */
export async function deleteFileFromS3(key: string): Promise<void> {
  if (!isS3Configured()) {
    throw new Error('AWS S3 is not properly configured. Please set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_S3_BUCKET_NAME environment variables.');
  }

  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
}

/**
 * Copy a file within S3 (used for moving files from temp to final location)
 * @param sourceKey - Source S3 object key
 * @param destinationKey - Destination S3 object key
 * @returns S3 file info for the new location
 */
export async function copyFileInS3(
  sourceKey: string,
  destinationKey: string
): Promise<S3FileInfo> {
  if (!isS3Configured()) {
    throw new Error('AWS S3 is not properly configured. Please set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_S3_BUCKET_NAME environment variables.');
  }

  const command = new CopyObjectCommand({
    Bucket: BUCKET_NAME,
    CopySource: `${BUCKET_NAME}/${sourceKey}`,
    Key: destinationKey,
  });

  await s3Client.send(command);

  // Generate a presigned URL for the copied file
  const url = await generatePresignedDownloadUrl(destinationKey, 604800); // 7 days expiration (max allowed by S3)

  return {
    key: destinationKey,
    url,
  };
}

/**
 * Generate S3 key path for a file
 * @param clientId - Client ID or 'temp' for temporary files
 * @param fileType - Type of file (vaccination, dogPhoto, liabilityWaiver)
 * @param fileName - Name of the file
 * @returns S3 key path
 */
export function generateS3Key(
  clientId: string,
  fileType: 'vaccination' | 'dogPhoto' | 'liabilityWaiver',
  fileName: string
): string {
  const subfolderMap: Record<typeof fileType, string> = {
    vaccination: 'vaccination-records',
    dogPhoto: 'dog-photos',
    liabilityWaiver: 'liability-waivers',
  };

  const folder = clientId === 'temp' || clientId === 'admin-temp'
    ? `clients/${clientId}/${subfolderMap[fileType]}`
    : `clients/client-${clientId}/${subfolderMap[fileType]}`;

  return `${folder}/${fileName}`;
}

/**
 * Generate a unique filename with timestamp
 * @param originalName - Original filename
 * @returns Unique filename with timestamp
 */
export function generateUniqueFileName(originalName: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const random = Math.random().toString(36).substring(2, 10);
  const extension = originalName.split('.').pop() || '';
  const baseName = originalName.replace(/\.[^/.]+$/, '');
  return `${timestamp}-${random}-${baseName}.${extension}`;
}

