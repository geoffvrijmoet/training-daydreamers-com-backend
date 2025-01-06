import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('training_daydreamers');
    
    const settings = await db.collection('settings').findOne({ type: 'training_options' });
    
    return NextResponse.json({ 
      success: true, 
      settings: settings || {
        keyConcepts: [],
        productRecommendations: [],
        gamesAndActivities: [],
        trainingSkills: [],
        homework: []
      }
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=5, stale-while-revalidate',
      },
    });
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
    const settings = await request.json();
    const client = await clientPromise;
    const db = client.db('training_daydreamers');
    
    await db.collection('settings').updateOne(
      { type: 'training_options' },
      { 
        $set: {
          type: 'training_options',
          keyConcepts: settings.keyConcepts || [],
          productRecommendations: settings.productRecommendations || [],
          gamesAndActivities: settings.gamesAndActivities || [],
          trainingSkills: settings.trainingSkills || [],
          homework: settings.homework || []
        } 
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save settings' },
      { status: 500 }
    );
  }
} 