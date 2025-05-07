# PDF Generation with Custom Fonts in Serverless Environments

This guide explains how to implement PDF generation with custom fonts in a Next.js application deployed to serverless environments like Vercel.

## Problem Overview

Serverless environments like Vercel have limitations that make working with custom fonts in PDF generation challenging:

1. The filesystem is read-only once deployed
2. The Lambda execution environment doesn't maintain state between executions
3. Standard approaches to font loading often assume persistent filesystem access

## Solution Architecture

Our solution uses a pre-build font copying step combined with runtime font registration. This approach works well in serverless environments by:

1. Making fonts available in the deployed application
2. Using proper runtime path resolution
3. Registering fonts just before PDF generation

## Implementation Steps

### 1. Install Required Dependencies

```bash
npm install @react-pdf/renderer @fontsource/{your-font-family}
```

For example, with Quicksand:

```bash
npm install @react-pdf/renderer @fontsource/quicksand
```

### 2. Create a Font Copying Script

Create a script to copy font files from node_modules to the public directory:

```javascript
// scripts/copy-fonts.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Adjust the source path based on your font package
const sourceDir = path.join(__dirname, '../node_modules/@fontsource/quicksand/files');
const targetDir = path.join(__dirname, '../public/fonts');

// Create fonts directory if it doesn't exist
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// List of font files to copy - adjust based on your needs
const fontFiles = [
  'quicksand-latin-400-normal.woff',
  'quicksand-latin-700-normal.woff'
];

// Copy font files
fontFiles.forEach(file => {
  const sourcePath = path.join(sourceDir, file);
  const targetPath = path.join(targetDir, file);
  fs.copyFileSync(sourcePath, targetPath);
  console.log(`Copied ${file} to public/fonts/`);
});
```

### 3. Update package.json Scripts

Add scripts to run the font copying process during development and build:

```json
"scripts": {
  "dev": "node scripts/copy-fonts.js && next dev",
  "build": "npm run copy-fonts && next build",
  "start": "next start",
  "copy-fonts": "node scripts/copy-fonts.js"
}
```

### 4. Create a Font Registration Module

Create a utility to register fonts at runtime:

```typescript
// lib/fonts.ts
import { Font } from '@react-pdf/renderer';
import path from 'path';

export function registerFonts() {
  // Use process.cwd() to get the correct base path in serverless environments
  const fontPath = path.join(process.cwd(), 'public', 'fonts', 'quicksand-latin-400-normal.woff');
  
  // Register regular weight
  Font.register({
    family: 'Quicksand',
    src: fontPath
  });

  // Register bold weight if needed
  Font.register({
    family: 'Quicksand-Bold',
    src: path.join(process.cwd(), 'public', 'fonts', 'quicksand-latin-700-normal.woff'),
    fontWeight: 700
  });
}
```

### 5. Create PDF Generation Module

```typescript
// lib/pdf.ts
import { renderToStream } from '@react-pdf/renderer';
import { createPDF } from '@/components/pdf-template';
import { registerFonts } from '@/lib/fonts';

export async function generatePDF(data: any) {
  try {
    // Register fonts before generating PDF
    registerFonts();

    // Create PDF document using your template
    const doc = createPDF(data);
    
    // Generate PDF stream
    const pdfStream = await renderToStream(doc);
    
    // Convert stream to buffer
    const chunks: Buffer[] = [];
    for await (const chunk of pdfStream) {
      chunks.push(Buffer.from(chunk));
    }
    
    return Buffer.concat(chunks);
  } catch (error) {
    console.error('Error in generatePDF:', error);
    throw error;
  }
}
```

### 6. Create a PDF Template Component

```tsx
// components/pdf-template.tsx
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Define styles using custom fonts
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Quicksand',
    fontSize: 12,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Quicksand-Bold',
    marginBottom: 20,
  },
  // Add more styles as needed
});

export function createPDF(data: any) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Your Document Title</Text>
        {/* Add more PDF content based on your data */}
      </Page>
    </Document>
  );
}
```

### 7. Create an API Endpoint to Serve the PDF

```typescript
// app/api/generate-pdf/route.ts
import { NextResponse } from 'next/server';
import { generatePDF } from '@/lib/pdf';

export async function POST(request: Request) {
  try {
    // Parse request body
    const data = await request.json();
    
    // Generate PDF with data
    const pdfBuffer = await generatePDF(data);
    
    // Return PDF as download
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="document.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return new NextResponse('Error generating PDF', { status: 500 });
  }
}
```

### 8. Create a Client-Side Component to Trigger PDF Generation

```tsx
// components/pdf-download-button.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface PDFDownloadButtonProps {
  data: any;
  filename?: string;
}

export function PDFDownloadButton({ data, filename = 'document.pdf' }: PDFDownloadButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    if (!data) return;
    
    setLoading(true);
    try {
      // Make request to PDF generation endpoint
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) throw new Error('Failed to generate PDF');
      
      // Get filename from content-disposition header if available
      const contentDisposition = response.headers.get('Content-Disposition');
      const serverFilename = contentDisposition?.split('filename="')[1]?.split('"')[0] || filename;
      
      // Download the PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = serverFilename;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading PDF:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      onClick={handleDownload}
      disabled={loading}
    >
      <Download className="h-4 w-4 mr-2" />
      {loading ? 'Generating...' : 'Download PDF'}
    </Button>
  );
}
```

## Why This Works in Serverless Environments

1. **Pre-Building Font Assets**: The copy-fonts script ensures fonts are available in the public directory, which is included in the deployment.

2. **Runtime Path Resolution**: Using `process.cwd()` ensures fonts can be found at runtime in the serverless environment.

3. **Just-in-Time Font Registration**: Fonts are registered immediately before PDF generation, ensuring they're available within the same execution context.

4. **Stateless Processing**: The entire process happens within a single request lifecycle, avoiding reliance on persistent file systems.

## Troubleshooting

### Common Issues:

1. **Font files not copying correctly**:
   - Check that the font paths in your copy script match the actual paths in node_modules

2. **Fonts not displaying in PDF**:
   - Verify that font registration is happening before PDF generation
   - Check that the font family names in your styles match the registered names

3. **PDF generation failing in production**:
   - Add detailed error logging in your generatePDF function
   - Verify that the public/fonts directory is included in your deployment

4. **"Cannot find module" errors**:
   - Make sure your module resolution is correct for ESM or CJS
   - Check that all imports are correctly specified

## Conclusion

This approach allows reliable PDF generation with custom fonts in serverless environments by ensuring fonts are available at build time and correctly registered at runtime. The same principles can be applied to other file-based resources needed for serverless functions. 