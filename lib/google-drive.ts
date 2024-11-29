import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import clientPromise from './mongodb';

const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/documents'
];

const CLIENTS_FOLDER_ID = '1_vgNNSoaO3p04vuZpeW6NsvMmH68PTPk';

const BUCKET_URL = process.env.GOOGLE_STORAGE_URL;
const LOGO_URL = `${BUCKET_URL}/logos/report-card-training-transp-bg.png`;

if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
  throw new Error('Missing required Google credentials in environment variables');
}

if (!BUCKET_URL) {
  throw new Error('Missing GOOGLE_STORAGE_URL environment variable');
}

// Initialize auth client
const auth = new JWT({
  email: process.env.GOOGLE_CLIENT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  scopes: SCOPES
});

// Initialize the drive and docs clients
const drive = google.drive({ version: 'v3', auth });
const docs = google.docs({ version: 'v1', auth });

interface KeyConcept {
  title: string;
  description: string;
}

// Helper function to calculate text length
function getTextLength(text: string): number {
  return text.length;
}

// First, modify the formatHtmlContent function to return both text and link positions
interface LinkPosition {
  text: string;
  url: string;
  startIndex: number;
  endIndex: number;
}

function formatHtmlContent(html: string): { text: string; links: LinkPosition[] } {
  const links: LinkPosition[] = [];
  
  // First, extract all links and their text
  const linkMatches = Array.from(
    html.matchAll(/<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>(.*?)<\/a>/g)
  );
  
  // Remove all HTML tags first to get clean text
  let text = html.replace(/<p>/g, '')
                 .replace(/<\/p>/g, '\n')
                 .replace(/<br\s*\/?>/g, '\n')
                 .replace(/<[^>]+>/g, '');  // Remove all remaining HTML tags
  
  // Clean up whitespace
  text = text.replace(/\n{3,}/g, '\n\n')
             .replace(/\s+/g, ' ')
             .trim();
  
  // Now find each link text in the cleaned text and record its position
  linkMatches.forEach(match => {
    const [fullMatch, url, linkText] = match;
    const cleanLinkText = linkText.replace(/<[^>]+>/g, '').trim();
    
    // Find the exact position of this text in the cleaned content
    const startIndex = text.indexOf(cleanLinkText);
    if (startIndex !== -1) {
      links.push({
        text: cleanLinkText,
        url: url,
        startIndex: startIndex,
        endIndex: startIndex + cleanLinkText.length
      });
    }
  });

  return { text, links };
}

async function retryOperation<T>(
  operation: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryOperation(operation, retries - 1, delay * 2);
    }
    throw error;
  }
}

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
    // First, we get the key concept descriptions from MongoDB
    const client = await clientPromise.catch(error => {
      console.error('MongoDB connection error:', error);
      throw new Error('Failed to connect to database');
    });
    const db = client.db('training_daydreamers');
    const settings = await db.collection('settings').findOne({ type: 'training_options' });

    // Create a Map for easy lookup of concept descriptions
    const conceptsMap = new Map(
      settings?.keyConcepts.map((c: KeyConcept) => [c.title, c.description]) || []
    );

    // Create document
    const doc = await retryOperation(() => 
      docs.documents.create({
        requestBody: {
          title: `Report Card - ${reportCardData.date} - ${reportCardData.clientName}`,
          body: {
            content: [{
              paragraph: {
                elements: [{ textRun: { content: '' } }]
              }
            }]
          }
        }
      })
    );

    const documentId = doc.data.documentId;
    if (!documentId) throw new Error('Failed to create Google Doc');

    // Move to client folder
    await drive.files.update({
      fileId: documentId,
      addParents: clientFolderId,
      fields: 'id, parents',
    });

    // Calculate initial content indices
    const headerContent = {
      dogsName: `Dog's Name: ${reportCardData.dogName}\n`,
      date: `Date: ${reportCardData.date}\n\n`,
      summary: `Summary:\n${reportCardData.summary}\n\n`,
      keyConcepts: `Key Concepts:\n`
    };

    const startIndex = 4; // After logo and spacing
    const dogsNameIndex = startIndex;
    const dateIndex = dogsNameIndex + getTextLength(headerContent.dogsName);
    const summaryIndex = dateIndex + getTextLength(headerContent.date);
    const keyConceptsIndex = summaryIndex + getTextLength(headerContent.summary);

    // Build requests array
    const requests = [
      // Document style
      {
        updateDocumentStyle: {
          documentStyle: {
            marginTop: { magnitude: 72, unit: 'PT' },
            marginBottom: { magnitude: 72, unit: 'PT' },
            marginRight: { magnitude: 72, unit: 'PT' },
            marginLeft: { magnitude: 72, unit: 'PT' },
            pageSize: {
              width: { magnitude: 612, unit: 'PT' },
              height: { magnitude: 792, unit: 'PT' }
            }
          },
          fields: 'marginTop,marginBottom,marginRight,marginLeft,pageSize'
        }
      },

      // Logo
      {
        insertInlineImage: {
          location: { index: 1 },
          uri: LOGO_URL,
          objectSize: {
            height: { magnitude: 100, unit: 'PT' },
            width: { magnitude: 400, unit: 'PT' }
          }
        }
      },
      {
        updateParagraphStyle: {
          range: { startIndex: 1, endIndex: 2 },
          paragraphStyle: {
            alignment: 'CENTER',
            spaceAbove: { magnitude: 0, unit: 'PT' },
            spaceBelow: { magnitude: 20, unit: 'PT' }
          },
          fields: 'alignment,spaceAbove,spaceBelow'
        }
      },

      // Spacing after logo
      {
        insertText: {
          location: { index: 2 },
          text: "\n\n"
        }
      },

      // Main content
      {
        insertText: {
          location: { index: startIndex },
          text: Object.values(headerContent).join('')
        }
      },

      // Style "Dog's Name:"
      {
        updateTextStyle: {
          range: { 
            startIndex: dogsNameIndex,
            endIndex: dogsNameIndex + "Dog's Name:".length
          },
          textStyle: { bold: true },
          fields: 'bold'
        }
      },

      // Style "Date:"
      {
        updateTextStyle: {
          range: { 
            startIndex: dateIndex,
            endIndex: dateIndex + "Date:".length
          },
          textStyle: { bold: true },
          fields: 'bold'
        }
      },

      // Style "Summary:"
      {
        updateTextStyle: {
          range: { 
            startIndex: summaryIndex,
            endIndex: summaryIndex + "Summary:".length
          },
          textStyle: { bold: true },
          fields: 'bold'
        }
      },

      // Add key concepts
      ...reportCardData.keyConcepts.map((concept, index) => {
        const description = conceptsMap.get(concept) ?? '';
        const { text: formattedDescription, links } = formatHtmlContent(description);
        const conceptText = `${concept}: ${formattedDescription}\n\n`;
        
        // Calculate current concept position
        let currentIndex = keyConceptsIndex + getTextLength(headerContent.keyConcepts);
        
        // Add length of previous concepts
        for (let i = 0; i < index; i++) {
          const prevConcept = reportCardData.keyConcepts[i];
          const prevDescription = conceptsMap.get(prevConcept) ?? '';
          const { text: formattedPrevDescription } = formatHtmlContent(prevDescription);
          currentIndex += getTextLength(`${prevConcept}: ${formattedPrevDescription}\n\n`);
        }

        const descriptionStartIndex = currentIndex + concept.length + 2; // +2 for ": "
        
        // Create requests for text and formatting
        const requests = [
          // Insert the concept and description
          {
            insertText: {
              location: { index: currentIndex },
              text: conceptText
            }
          },
          // Make concept name bold
          {
            updateTextStyle: {
              range: { 
                startIndex: currentIndex,
                endIndex: currentIndex + concept.length
              },
              textStyle: { bold: true },
              fields: 'bold'
            }
          },
          // Add link formatting for each link in the description
          ...links.map(link => {
            // Calculate the actual position of the link within the description
            const linkStartIndex = descriptionStartIndex + link.startIndex;
            const linkEndIndex = descriptionStartIndex + link.endIndex;

            console.log('Link Debug:', {
              text: link.text,
              url: link.url,
              linkStartIndex,
              linkEndIndex,
              descriptionStartIndex,
              originalStart: link.startIndex,
              originalEnd: link.endIndex
            });

            return {
              updateTextStyle: {
                range: {
                  startIndex: linkStartIndex,
                  endIndex: linkEndIndex
                },
                textStyle: {
                  link: {
                    url: link.url
                  },
                  foregroundColor: { color: { rgbColor: { blue: 0.8, red: 0.13, green: 0.13 } } },
                  underline: true
                },
                fields: 'link,foregroundColor,underline'
              }
            };
          })
        ];

        return requests;
      }).flat(),

      // Add product recommendations
      ...(reportCardData.productRecommendations.length > 0 ? [
        {
          insertText: {
            location: { 
              index: keyConceptsIndex + 
                getTextLength(headerContent.keyConcepts) + 
                reportCardData.keyConcepts.reduce((acc, concept) => {
                  const description = conceptsMap.get(concept) ?? '';
                  return acc + getTextLength(`${concept}: ${description}\n\n`);
                }, 0) + 2, // +2 for the newline and "Product Recommendations:" text
              text: `\nProduct Recommendations:\n`
            }
          }
        },
        {
          updateTextStyle: {
            range: { 
              startIndex: keyConceptsIndex + 
                getTextLength(headerContent.keyConcepts) + 
                reportCardData.keyConcepts.reduce((acc, concept) => {
                  const description = conceptsMap.get(concept) ?? '';
                  return acc + getTextLength(`${concept}: ${description}\n\n`);
                }, 0) + 2, // +2 for the newline and "Product Recommendations:" text
              endIndex: keyConceptsIndex + 
                getTextLength(headerContent.keyConcepts) + 
                reportCardData.keyConcepts.reduce((acc, concept) => {
                  const description = conceptsMap.get(concept) ?? '';
                  return acc + getTextLength(`${concept}: ${description}\n\n`);
                }, 0) + 2 + "Product Recommendations:".length
            },
            textStyle: { bold: true },
            fields: 'bold'
          }
        },
        ...reportCardData.productRecommendations.map((product, idx) => ({
          insertText: {
            location: { 
              index: keyConceptsIndex + 
                getTextLength(headerContent.keyConcepts) + 
                reportCardData.keyConcepts.reduce((acc, concept) => {
                  const description = conceptsMap.get(concept) ?? '';
                  return acc + getTextLength(`${concept}: ${description}\n\n`);
                }, 0) + 
                getTextLength("\nProduct Recommendations:\n") +
                idx * (product.length + 2) // +2 for bullet and newline
            },
            text: `• ${product}\n`
          }
        }))
      ] : [])
    ];

    // Apply updates
    await docs.documents.batchUpdate({
      documentId,
      requestBody: {
        requests,
        writeControl: {
          targetRevisionId: doc.data.revisionId
        }
      }
    });

    // Set permissions and get link
    await drive.permissions.create({
      fileId: documentId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
      fields: 'id'
    });

    const file = await drive.files.get({
      fileId: documentId,
      fields: 'webViewLink'
    });

    return {
      fileId: documentId,
      webViewLink: file.data.webViewLink,
    };
  } catch (error) {
    console.error('Error creating report card:', error);
    throw error;
  }
} 