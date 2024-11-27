import { NextResponse } from 'next/server';
import { createReportCard } from '@/lib/google-drive';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      clientId,
      date,
      summary,
      keyConcepts,
      productRecommendations,
      clientName,
      dogName,
      mainFolderId
    } = body;

    console.log('Creating report card for client:', clientName);
    
    // Create report card in Google Drive
    const reportCard = await createReportCard(
      mainFolderId,
      {
        date,
        clientName,
        dogName,
        summary,
        keyConcepts,
        productRecommendations,
      }
    );

    return NextResponse.json({ 
      success: true, 
      reportCard
    });
  } catch (error) {
    console.error('Error creating report card:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create report card'
      },
      { status: 500 }
    );
  }
} 