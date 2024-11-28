import { NextResponse } from 'next/server';
import { createReportCard } from '@/lib/google-drive';
import clientPromise from '@/lib/mongodb';

// This handles POST requests to /api/report-cards
export async function POST(request: Request) {
  try {
    // 1. Get the data from the request body
    const data = await request.json();
    console.log('Creating report card for client:', data.clientName);

    // 2. Create the report card in Google Drive
    const reportCard = await createReportCard(data.sharedFolderId, {
      date: data.date,
      clientName: data.clientName,
      dogName: data.dogName,
      summary: data.summary,
      keyConcepts: data.keyConcepts,
      productRecommendations: data.productRecommendations,
    });

    // 3. Save reference to MongoDB
    const client = await clientPromise;
    const db = client.db('training_daydreamers');
    
    // Insert and get the new report card's ID
    const result = await db.collection('report_cards').insertOne({
      clientId: data.clientId,
      clientName: data.clientName,
      dogName: data.dogName,
      date: data.date,
      summary: data.summary,
      keyConcepts: data.keyConcepts,
      productRecommendations: data.productRecommendations,
      fileId: reportCard.fileId,
      webViewLink: reportCard.webViewLink,
      createdAt: new Date(),
    });

    // 4. Return success response
    return NextResponse.json({ 
      success: true, 
      reportCard,
      reportCardId: result.insertedId // Return the MongoDB ID of the new report card
    });

  } catch (error) {
    // 5. Handle errors
    console.error('Error creating report card:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create report card' },
      { status: 500 }
    );
  }
} 