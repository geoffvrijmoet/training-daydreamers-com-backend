import { Storage } from '@google-cloud/storage';
import fs from 'fs';
import path from 'path';

if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_STORAGE_BUCKET) {
  throw new Error('Missing required Google credentials in environment variables');
}

const storage = new Storage({
  projectId: 'daydreamers-dog-training',
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  },
});

async function uploadLogos() {
  const bucket = storage.bucket(process.env.GOOGLE_STORAGE_BUCKET!);

  // Upload left logo
  const leftLogo = fs.readFileSync(path.join(process.cwd(), 'public/images/dog-logo-left.webp'));
  const leftBlob = bucket.file('logos/dog-logo-left.webp');
  await leftBlob.save(leftLogo, {
    metadata: {
      contentType: 'image/webp',
      cacheControl: 'public, max-age=31536000',
    },
  });
  await leftBlob.makePublic();

  // Upload right logo
  const rightLogo = fs.readFileSync(path.join(process.cwd(), 'public/images/dog-logo-right.webp'));
  const rightBlob = bucket.file('logos/dog-logo-right.webp');
  await rightBlob.save(rightLogo, {
    metadata: {
      contentType: 'image/webp',
      cacheControl: 'public, max-age=31536000',
    },
  });
  await rightBlob.makePublic();

  console.log('Logos uploaded successfully!');
}

uploadLogos().catch(console.error); 