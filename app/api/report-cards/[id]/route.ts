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
    
    const reportCard = await db.collection('report_cards').findOne({
      _id: new ObjectId(params.id)
    });

    if (!reportCard) {
      return NextResponse.json(
        { success: false, error: 'Report card not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      reportCard 
    });
  } catch (error) {
    console.error('Error fetching report card:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch report card' },
      { status: 500 }
    );
  }
} 