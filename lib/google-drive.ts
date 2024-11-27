import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file'
];

const CLIENTS_FOLDER_ID = '1_vgNNSoaO3p04vuZpeW6NsvMmH68PTPk';

// Initialize auth client
const auth = new JWT({
  email: process.env.GOOGLE_CLIENT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  scopes: SCOPES
});

// Initialize the drive client
const drive = google.drive({ 
  version: 'v3',
  auth
});

export async function createClientFolder(clientName: string, dogName: string) {
  try {
    // Split client name into first and last names
    const nameParts = clientName.trim().split(' ');
    const lastName = nameParts.length > 1 ? nameParts.pop()! : '';
    const firstName = nameParts.join(' ');
    
    const folderName = `${dogName} ${lastName} - ${firstName} ${lastName}`;
    console.log('Starting folder creation for:', folderName);

    // Create main client folder
    const clientFolder = await drive.files.create({
      requestBody: {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [CLIENTS_FOLDER_ID],
      },
      fields: 'id, webViewLink'
    });

    if (!clientFolder.data.id) {
      throw new Error('Failed to create client folder');
    }

    const clientFolderId = clientFolder.data.id;
    const clientFolderLink = clientFolder.data.webViewLink;
    console.log('Created main folder with ID:', clientFolderId);

    // Create "Client Folder" subfolder
    const sharedFolder = await drive.files.create({
      requestBody: {
        name: 'Client Folder',
        mimeType: 'application/vnd.google-apps.folder',
        parents: [clientFolderId],
      },
      fields: 'id, webViewLink',
    });

    // Create "Private" subfolder
    const privateFolder = await drive.files.create({
      requestBody: {
        name: 'Private',
        mimeType: 'application/vnd.google-apps.folder',
        parents: [clientFolderId],
      },
      fields: 'id, webViewLink',
    });

    // Set permissions for the shared folder to be accessible by anyone with the link
    await drive.permissions.create({
      fileId: sharedFolder.data.id!,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      }
    });

    return {
      mainFolderId: clientFolderId,
      mainFolderLink: clientFolderLink,
      sharedFolderId: sharedFolder.data.id,
      sharedFolderLink: sharedFolder.data.webViewLink,
      privateFolderId: privateFolder.data.id,
      privateFolderLink: privateFolder.data.webViewLink,
    };
  } catch (error: unknown) {
    console.error('Error creating folders:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
    }
    throw error;
  }
}

export async function createReportCard(
  clientFolderId: string, 
  reportCardData: {
    date: string;
    clientName: string;
    dogName: string;
    summary: string;
    keyConcepts: string[];
    productRecommendations: string[];
  }
) {
  try {
    const content = `
      Date: ${reportCardData.date}
      Client: ${reportCardData.clientName}
      Dog: ${reportCardData.dogName}
      
      Summary:
      ${reportCardData.summary}
      
      Key Concepts:
      ${reportCardData.keyConcepts.map(concept => `- ${concept}`).join('\n')}
      
      Product Recommendations:
      ${reportCardData.productRecommendations.map(product => `- ${product}`).join('\n')}
    `;

    const reportCard = await drive.files.create({
      requestBody: {
        name: `Report Card - ${reportCardData.date} - ${reportCardData.clientName}`,
        mimeType: 'application/vnd.google-apps.document',
        parents: [clientFolderId],
      },
      media: {
        mimeType: 'text/plain',
        body: content,
      },
      fields: 'id, webViewLink',
    });

    return {
      fileId: reportCard.data.id,
      webViewLink: reportCard.data.webViewLink,
    };
  } catch (error) {
    console.error('Error creating report card:', error);
    throw error;
  }
} 