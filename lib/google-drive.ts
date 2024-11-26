import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.folders'
];

const CLIENTS_FOLDER_ID = '1_vgNNSoaO3p04vuZpeW6NsvMmH68PTPk';

const auth = new JWT({
  email: process.env.GOOGLE_CLIENT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY,
  scopes: SCOPES,
});

const drive = google.drive({ 
  version: 'v3', 
  auth,
  retry: true
});

export async function createClientFolder(clientName: string) {
  try {
    // Verify authentication
    await auth.authorize();
    
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
    console.error('Error creating client folders:', error);
    throw new Error(`Failed to create folders: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
} 