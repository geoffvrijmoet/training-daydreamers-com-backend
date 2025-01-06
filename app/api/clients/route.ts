import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, dogName, email, phone, notes } = body;

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db('training_daydreamers');
    
    // Create client document
    const result = await db.collection('clients').insertOne({
      name,
      dogName,
      email,
      phone,
      notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({ 
      success: true, 
      clientId: result.insertedId
    });
  } catch (error) {
    console.error('Detailed error in POST handler:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create client',
        details: error
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const client = await clientPromise;
    
    const db = client.db('training_daydreamers');
    
    const clients = await db.collection('clients')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    
    return NextResponse.json({ success: true, clients });
  } catch (error) {
    console.error('Detailed error in GET handler:', error);
    // Check if it's a connection error
    if (error instanceof Error && 
        (error.message.includes('EADDRNOTAVAIL') || 
         error.message.includes('connect'))) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database connection error. Please try again in a few moments.',
          details: error.message
        },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch clients',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 