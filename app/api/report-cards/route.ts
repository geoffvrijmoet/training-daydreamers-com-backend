import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

// This handles GET requests to /api/report-cards
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    
    const client = await clientPromise;
    const db = client.db('training_daydreamers');
    
    let query = {};
    if (clientId) {
      query = { clientId };
    }
    
    const reportCards = await db.collection('report_cards')
      .find(query)
      .sort({ date: -1, createdAt: -1 })
      .toArray();

    return NextResponse.json({ 
      success: true, 
      reportCards 
    });
  } catch (error) {
    console.error('Error fetching report cards:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch report cards' },
      { status: 500 }
    );
  }
}

// This handles POST requests to /api/report-cards
export async function POST(request: Request) {
  try {
    // 1. Get the data from the request body
    const data = await request.json();

    // 2. Save to MongoDB
    const client = await clientPromise;
    const db = client.db('training_daydreamers');
    
    // Insert and get the new report card's ID
    const result = await db.collection('report_cards').insertOne({
      clientId: data.clientId,
      clientName: data.clientName,
      dogName: data.dogName,
      date: data.date,
      summary: data.summary,
      selectedItems: data.selectedItems,
      productRecommendations: data.productRecommendations,
      shortTermGoals: data.shortTermGoals || [],
      createdAt: new Date(),
    });

    // 3. Return success response
    return NextResponse.json({ 
      success: true, 
      reportCardId: result.insertedId
    });

  } catch (error) {
    // 4. Handle errors
    console.error('Error creating report card:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create report card' },
      { status: 500 }
    );
  }
} 