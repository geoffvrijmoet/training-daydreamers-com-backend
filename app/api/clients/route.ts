import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { createClientFolder } from '@/lib/google-drive';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, dogName, email, phone, notes } = body;

    console.log('Creating folders for client:', name);
    
    // Create Google Drive folders
    let folders;
    try {
      folders = await createClientFolder(name);
      console.log('Created folders:', folders);
    } catch (error) {
      console.error('Detailed Google Drive error:', error);
      throw error;
    }

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
      folders,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({ 
      success: true, 
      clientId: result.insertedId,
      folders 
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
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch clients' },
      { status: 500 }
    );
  }
} 