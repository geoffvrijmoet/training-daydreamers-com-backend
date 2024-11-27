import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const client = await clientPromise;
    const db = client.db('training_daydreamers');
    
    const clientData = await db.collection('clients').findOne({
      _id: new ObjectId(params.id)
    });

    if (!clientData) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, client: clientData });
  } catch (error) {
    console.error('Error fetching client:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch client' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, dogName, email, phone, notes } = body;

    const client = await clientPromise;
    const db = client.db('training_daydreamers');
    
    const result = await db.collection('clients').updateOne(
      { _id: new ObjectId(params.id) },
      { 
        $set: {
          name,
          dogName,
          email,
          phone,
          notes,
          updatedAt: new Date(),
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update client' },
      { status: 500 }
    );
  }
} 