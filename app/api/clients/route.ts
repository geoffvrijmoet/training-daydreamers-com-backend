import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { createClientFolder } from '@/lib/google-drive';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, dogName, email, phone, notes } = body;

    // Create Google Drive folders
    const folders = await createClientFolder(name);

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
    console.error('Error creating client:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create client' },
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