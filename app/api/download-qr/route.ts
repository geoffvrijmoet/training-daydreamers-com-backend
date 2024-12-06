import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const qrCodeUrl = url.searchParams.get('url');
  
  if (!qrCodeUrl) {
    return new NextResponse('Missing URL parameter', { status: 400 });
  }

  try {
    const response = await fetch(qrCodeUrl);
    const blob = await response.blob();

    return new NextResponse(blob, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="qr-code-${Date.now()}.png"`,
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    return new NextResponse('Failed to download QR code', { status: 500 });
  }
} 