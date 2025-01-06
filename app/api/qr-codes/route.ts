import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import QRCode from "qrcode";
import { Storage } from "@google-cloud/storage";

// Initialize Google Cloud Storage
const storage = new Storage({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
});

const bucket = storage.bucket(process.env.GOOGLE_STORAGE_BUCKET!);

// Validate environment variables
if (!process.env.GOOGLE_CLIENT_EMAIL || 
    !process.env.GOOGLE_PRIVATE_KEY || 
    !process.env.GOOGLE_STORAGE_BUCKET ||
    !process.env.GOOGLE_STORAGE_URL) {
  throw new Error('Missing required Google Cloud Storage environment variables');
}

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();

    const qrCodes = await db
      .collection("qrCodes")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ success: true, qrCodes });
  } catch (error) {
    console.error("Error fetching QR codes:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch QR codes" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { name, type, url, description, style } = await request.json();

    // Input validation
    if (!name || !url) {
      return NextResponse.json(
        { success: false, error: "Name and URL are required" },
        { status: 400 }
      );
    }

    // Generate QR code with custom styling
    const qrCodeBuffer = await QRCode.toBuffer(url, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 1024,
      color: {
        dark: style?.darkColor || '#000000',
        light: style?.isTransparent ? '#00000000' : (style?.lightColor || '#ffffff'),
      },
    });

    // Create a unique filename with proper organization
    const timestamp = Date.now();
    const sanitizedName = name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const fileName = `qr-codes/${type}/${timestamp}-${sanitizedName}.png`;

    // Upload to Google Cloud Storage with retry logic
    const file = bucket.file(fileName);
    let uploadAttempts = 0;
    const maxAttempts = 3;

    while (uploadAttempts < maxAttempts) {
      try {
        await file.save(qrCodeBuffer, {
          metadata: {
            contentType: 'image/png',
            cacheControl: 'public, max-age=31536000', // Cache for 1 year
            metadata: {
              createdAt: new Date().toISOString(),
              generatedFor: name,
              type: type,
            }
          },
        });

        // Make the file public
        await file.makePublic();

        // Get the public URL
        const qrCodeUrl = `${process.env.GOOGLE_STORAGE_URL}/${fileName}`;

        // Save to MongoDB
        const client = await clientPromise;
        const db = client.db();

        const result = await db.collection("qrCodes").insertOne({
          name,
          type,
          url,
          description,
          qrCodeUrl,
          style,
          fileName, // Store the file name for potential cleanup later
          createdAt: new Date(),
        });

        return NextResponse.json({
          success: true,
          qrCodeUrl,
          id: result.insertedId,
        });
      } catch (error) {
        uploadAttempts++;
        if (uploadAttempts === maxAttempts) {
          throw error;
        }
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, uploadAttempts) * 1000));
      }
    }

    throw new Error('Failed to upload after maximum attempts');
  } catch (error) {
    console.error("Error generating QR code:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to generate QR code",
        details: error instanceof Error ? error.message : undefined
      },
      { status: 500 }
    );
  }
} 