import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
// const PARENT_FOLDER_ID = '1lvbkXMSo5Tu7Cri3Y4cgj8taLMx2mEbx';
const CLIENTS_FOLDER_ID = '1_vgNNSoaO3p04vuZpeW6NsvMmH68PTPk';

const auth = new JWT({
  email: process.env.GOOGLE_CLIENT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  scopes: SCOPES,
});

const drive = google.drive({ version: 'v3', auth });

export async function createClientFolder(clientName: string) {
  try {
    // Create main client folder
    const clientFolder = await drive.files.create({
      requestBody: {
        name: clientName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [CLIENTS_FOLDER_ID],
      },
    });

    const clientFolderId = clientFolder.data.id;

    // Create "Client Folder" subfolder
    const sharedFolder = await drive.files.create({
      requestBody: {
        name: 'Client Folder',
        mimeType: 'application/vnd.google-apps.folder',
        parents: [clientFolderId],
      },
    });

    // Create "Private" subfolder
    const privateFolder = await drive.files.create({
      requestBody: {
        name: 'Private',
        mimeType: 'application/vnd.google-apps.folder',
        parents: [clientFolderId],
      },
    });

    return {
      mainFolderId: clientFolderId,
      sharedFolderId: sharedFolder.data.id,
      privateFolderId: privateFolder.data.id,
    };
  } catch (error) {
    console.error('Error creating client folders:', error);
    throw error;
  }
} 