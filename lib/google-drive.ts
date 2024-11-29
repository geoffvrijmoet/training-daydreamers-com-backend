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

// Add this helper function at the top with the other helpers
function formatDateForDoc(dateString: string): string {
  const date = new Date(dateString);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);  // Get last 2 digits of year
  return `${month}/${day}/${year}`;
}

// Add helper function to get last name (same as in preview component)
function getLastName(fullName: string): string {
  const nameParts = fullName.trim().split(' ');
  return nameParts.length > 1 ? nameParts[nameParts.length - 1] : fullName;
}

export async function createReportCard(
  clientFolderId: string, 
  reportCardData: {
    date: string;
    clientName: string;
    dogName: string;
    summary: string;
    keyConcepts: KeyConcept[];
    productRecommendations: string[];
  }
) {
  try {
    const clientLastName = getLastName(reportCardData.clientName);

    // Create document
    const doc = await docs.documents.create({
      requestBody: {
        title: `Report Card - ${reportCardData.date} - ${reportCardData.dogName} ${clientLastName}`,
      }
    });

    if (!doc.data.documentId) {
      throw new Error('Failed to create Google Doc');
    }

    const documentId = doc.data.documentId;

    // Move to client folder
    await drive.files.update({
      fileId: documentId,
      addParents: clientFolderId,
      fields: 'id, parents',
    });

    // Update the headerContent object
    const headerContent = {
      dogsName: `Dog's Name: ${reportCardData.dogName} ${clientLastName}\n`,
      date: `Date: ${formatDateForDoc(reportCardData.date)}\n\n`,
      summary: `Summary:\n${reportCardData.summary}\n\n`,
      keyConcepts: `Key Concepts:\n`
    };

    // Calculate initial content indices
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

      // Logo - keep centered
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
      {
        updateParagraphStyle: {
          range: { 
            startIndex: startIndex, 
            endIndex: startIndex + Object.values(headerContent).join('').length 
          },
          paragraphStyle: {
            alignment: 'START',
            spaceAbove: { magnitude: 0, unit: 'PT' },
            spaceBelow: { magnitude: 0, unit: 'PT' },
            lineSpacing: 115
          },
          fields: 'alignment,spaceAbove,spaceBelow,lineSpacing'
        }
      },

      // First, set default text to Fredoka Light
      {
        updateTextStyle: {
          range: { 
            startIndex: startIndex,
            endIndex: startIndex + Object.values(headerContent).join('').length
          },
          textStyle: { 
            weightedFontFamily: {
              fontFamily: "Fredoka",
              weight: 300  // Light
            }
          },
          fields: 'weightedFontFamily'
        }
      },

      // Then apply Fredoka Medium to specific labels
      {
        updateTextStyle: {
          range: { 
            startIndex: dogsNameIndex,
            endIndex: dogsNameIndex + "Dog's Name: ".length
          },
          textStyle: { 
            weightedFontFamily: {
              fontFamily: "Fredoka",
              weight: 500  // Medium
            }
          },
          fields: 'weightedFontFamily'
        }
      },

      // Style "Date:" with Fredoka Medium
      {
        updateTextStyle: {
          range: { 
            startIndex: dateIndex,
            endIndex: dateIndex + "Date: ".length  // Note the space after colon
          },
          textStyle: { 
            weightedFontFamily: {
              fontFamily: "Fredoka",
              weight: 500  // Medium
            }
          },
          fields: 'weightedFontFamily'
        }
      },

      // Style "Summary:" with Fredoka Medium
      {
        updateTextStyle: {
          range: { 
            startIndex: summaryIndex,
            endIndex: summaryIndex + "Summary: ".length  // Note the space after colon
          },
          textStyle: { 
            weightedFontFamily: {
              fontFamily: "Fredoka",
              weight: 500  // Medium
            }
          },
          fields: 'weightedFontFamily'
        }
      },

      // Style "Key Concepts:" with Fredoka Medium
      {
        updateTextStyle: {
          range: { 
            startIndex: keyConceptsIndex,
            endIndex: keyConceptsIndex + "Key Concepts: ".length  // Note the space after colon
          },
          textStyle: { 
            weightedFontFamily: {
              fontFamily: "Fredoka",
              weight: 500  // Medium
            }
          },
          fields: 'weightedFontFamily'
        }
      },

      // Add key concepts
      ...reportCardData.keyConcepts.map((concept, index) => {
        const { text: formattedDescription, links } = formatHtmlContent(concept.description);
        const conceptText = `${concept.title}: ${formattedDescription}\n\n`;
        
        // Calculate current concept position
        let currentIndex = keyConceptsIndex + getTextLength(headerContent.keyConcepts);
        
        // Add length of previous concepts
        for (let i = 0; i < index; i++) {
          const prevConcept = reportCardData.keyConcepts[i];
          const { text: formattedPrevDescription } = formatHtmlContent(prevConcept.description);
          currentIndex += getTextLength(`${prevConcept.title}: ${formattedPrevDescription}\n\n`);
        }

        const descriptionStartIndex = currentIndex + concept.title.length + 2; // +2 for ": "
        
        // Create requests for text and formatting
        const requests = [
          // Insert the concept and description
          {
            insertText: {
              location: { index: currentIndex },
              text: conceptText
            }
          },
          // Add bullet
          {
            createParagraphBullets: {
              range: {
                startIndex: currentIndex,
                endIndex: currentIndex + conceptText.length - 1
              },
              bulletPreset: 'BULLET_ARROW_DIAMOND_DISC'
            }
          },
          // Title in Fredoka Medium
          {
            updateTextStyle: {
              range: { 
                startIndex: currentIndex,
                endIndex: currentIndex + concept.title.length
              },
              textStyle: { 
                weightedFontFamily: {
                  fontFamily: "Fredoka",
                  weight: 500  // Medium
                }
              },
              fields: 'weightedFontFamily'
            }
          },
          // Description in Fredoka Light
          {
            updateTextStyle: {
              range: { 
                startIndex: currentIndex + concept.title.length + 2, // +2 for ": "
                endIndex: currentIndex + conceptText.length
              },
              textStyle: { 
                weightedFontFamily: {
                  fontFamily: "Fredoka",
                  weight: 300  // Light
                }
              },
              fields: 'weightedFontFamily'
            }
          },
          // Ensure left alignment for the entire concept paragraph
          {
            updateParagraphStyle: {
              range: {
                startIndex: currentIndex,
                endIndex: currentIndex + conceptText.length
              },
              paragraphStyle: {
                alignment: 'START',
                spaceAbove: { magnitude: 0, unit: 'PT' },
                spaceBelow: { magnitude: 0, unit: 'PT' },
                lineSpacing: 115
              },
              fields: 'alignment,spaceAbove,spaceBelow,lineSpacing'
            }
          },
          // Add link formatting for each link in the description
          ...links.map(link => ({
            updateTextStyle: {
              range: {
                startIndex: descriptionStartIndex + link.startIndex,
                endIndex: descriptionStartIndex + link.endIndex
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
          }))
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
                  return acc + getTextLength(`→ ${concept.title}: ${concept.description}\n\n`);
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
                  return acc + getTextLength(`→ ${concept.title}: ${concept.description}\n\n`);
                }, 0) + 2, // +2 for the newline and "Product Recommendations:" text
              endIndex: keyConceptsIndex + 
                getTextLength(headerContent.keyConcepts) + 
                reportCardData.keyConcepts.reduce((acc, concept) => {
                  return acc + getTextLength(`→ ${concept.title}: ${concept.description}\n\n`);
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
                  return acc + getTextLength(`→ ${concept.title}: ${concept.description}\n\n`);
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
      documentId: documentId,
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