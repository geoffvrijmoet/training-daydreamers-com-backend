import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('training_daydreamers');
    
    const settings = await db.collection('settings').findOne({ type: 'training_options' });
    
    if (!settings) {
      // Initialize with default values if not found
      const defaultSettings = {
        type: 'training_options',
        keyConcepts: [
          "Loose Leash Walking",
          "Recall",
          "Place Command",
          "Sit/Stay",
          "Down/Stay",
          "Leave It",
          "Drop It",
          "Heel",
          "Focus/Watch Me",
          "Door Manners",
        ],
        productRecommendations: [
          "Freedom Harness",
          "Gentle Leader",
          "Long Line",
          "Treat Pouch",
          "Clicker",
          "Kong",
          "Snuffle Mat",
          "Licki Mat",
        ]
      };
      
      await db.collection('settings').insertOne(defaultSettings);
      return NextResponse.json({ success: true, settings: defaultSettings });
    }

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { keyConcepts, productRecommendations } = body;

    const client = await clientPromise;
    const db = client.db('training_daydreamers');
    
    await db.collection('settings').updateOne(
      { type: 'training_options' },
      { 
        $set: {
          keyConcepts,
          productRecommendations,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update settings' },
      { status: 500 }
    );
  }
} 