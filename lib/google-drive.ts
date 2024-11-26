import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.folders'
];

const CLIENTS_FOLDER_ID = '1_vgNNSoaO3p04vuZpeW6NsvMmH68PTPk';

// Fix private key formatting
const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!process.env.GOOGLE_CLIENT_EMAIL || !privateKey) {
  throw new Error('Missing Google Drive credentials');
}

const auth = new JWT({
  email: process.env.GOOGLE_CLIENT_EMAIL,
  key: privateKey,
  scopes: SCOPES,
});

auth.authorize()
  .then(() => {
    console.log('Successfully authenticated with Google Drive');
  })
  .catch(error => {
    console.error('Google Drive authentication failed:', error);
    throw new Error('Failed to authenticate with Google Drive');
  });

const drive = google.drive({ 
  version: 'v3', 
  auth,
});

export async function createClientFolder(clientName: string) {
  try {
    // Verify authentication first
    const credentials = await auth.authorize();
    console.log('Authentication successful:', credentials.access_token ? 'Token received' : 'No token');

    // Create main client folder
    const clientFolder = await drive.files.create({
      requestBody: {
        name: clientName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [CLIENTS_FOLDER_ID],
      },
      fields: 'id',
    });

    if (!clientFolder.data.id) {
      throw new Error('Failed to create client folder');
    }

    const clientFolderId = clientFolder.data.id;

    // Create "Client Folder" subfolder
    const sharedFolder = await drive.files.create({
      requestBody: {
        name: 'Client Folder',
        mimeType: 'application/vnd.google-apps.folder',
        parents: [clientFolderId],
      },
      fields: 'id',
    });

    // Create "Private" subfolder
    const privateFolder = await drive.files.create({
      requestBody: {
        name: 'Private',
        mimeType: 'application/vnd.google-apps.folder',
        parents: [clientFolderId],
      },
      fields: 'id',
    });

    return {
      mainFolderId: clientFolderId,
      sharedFolderId: sharedFolder.data.id,
      privateFolderId: privateFolder.data.id,
    };
  } catch (error) {
    console.error('Detailed Google Drive error:', error);
    if (error instanceof Error) {
      const details = JSON.stringify(error, Object.getOwnPropertyNames(error), 2);
      console.error('Full error details:', details);
    }
    throw error;
  }
} 