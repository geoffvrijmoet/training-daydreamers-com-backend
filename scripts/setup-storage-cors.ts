import { Storage } from '@google-cloud/storage';

const storage = new Storage({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  projectId: process.env.GOOGLE_PROJECT_ID,
});

const bucketName = process.env.GOOGLE_STORAGE_BUCKET || '';

async function setCors() {
  await storage.bucket(bucketName).setCorsConfiguration([
    {
      origin: ['*'], // In production, replace with your specific domain
      method: ['GET', 'HEAD', 'OPTIONS'],
      responseHeader: ['Content-Type'],
      maxAgeSeconds: 3600,
    },
  ]);
  
}

setCors().catch(console.error); 