import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

// Update the interfaces
interface DescribedItem {
  title: string;
  description: string;
}

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
          { title: "Loose Leash Walking", description: "Walking without pulling" },
          { title: "Recall", description: "Coming when called" },
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
          { title: "Freedom Harness", description: "Front and back clip harness for better control" },
          { title: "Gentle Leader", description: "Head halter for pulling prevention" },
          "Long Line",
          "Treat Pouch",
          "Clicker",
          "Kong",
          "Snuffle Mat",
          "Licki Mat",
        ],
        gamesAndActivities: [
          { title: "Find It", description: "Scent work game to build focus" },
          { title: "Hide and Seek", description: "Recall game with high rewards" },
          "Tug with Rules",
          "Fetch with Impulse Control",
          "Name Game",
          "Touch/Target Training",
        ],
        trainingSkills: [
          { title: "Marker Timing", description: "Precise timing of clicks/markers" },
          { title: "Treat Delivery", description: "Efficient reward placement" },
          "Leash Handling",
          "Body Language",
          "Voice Control",
        ],
        homework: [
          { title: "Practice Recall 2x Daily", description: "In low-distraction areas first" },
          { title: "5-Minute Training Sessions", description: "Short, focused practice" },
          "Structured Walks",
          "Place Command Duration",
          "Impulse Control Games",
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
    const { 
      keyConcepts, 
      productRecommendations,
      gamesAndActivities,
      trainingSkills,
      homework 
    } = body;

    const client = await clientPromise;
    const db = client.db('training_daydreamers');
    
    await db.collection('settings').updateOne(
      { type: 'training_options' },
      { 
        $set: {
          keyConcepts,
          productRecommendations,
          gamesAndActivities,
          trainingSkills,
          homework,
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