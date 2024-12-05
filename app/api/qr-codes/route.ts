import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import QRCode from "qrcode";
import { Storage } from "@google-cloud/storage";

const storage = new Storage({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  projectId: process.env.GOOGLE_PROJECT_ID,
});

const bucket = storage.bucket(process.env.GOOGLE_STORAGE_BUCKET || '');

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

    // Upload to Google Cloud Storage
    const fileName = `qr-codes/${Date.now()}-${name.toLowerCase().replace(/\s+/g, '-')}.png`;
    const file = bucket.file(fileName);
    
    await file.save(qrCodeBuffer, {
      metadata: {
        contentType: 'image/png',
      },
    });

    // Make the file public
    await file.makePublic();

    const qrCodeUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

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
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      qrCodeUrl,
      id: result.insertedId,
    });
  } catch (error) {
    console.error("Error generating QR code:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate QR code" },
      { status: 500 }
    );
  }
} 