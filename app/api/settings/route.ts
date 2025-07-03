/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('training_daydreamers');
    
    const raw = await db.collection('settings').findOne({ type: 'training_options' });
    
    const clone = raw ? JSON.parse(JSON.stringify(raw)) : null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const extractId = (val: any) => {
      if (!val) return undefined;
      // If it's already a string (e.g., legacyId), return as is
      if (typeof val === 'string') return val;
      // When coming from JSON.stringify(ObjectId) it becomes { $oid: 'hex' }
      if (typeof val === 'object' && val.$oid) return val.$oid;
      // Fallback to toString (for live ObjectId instances)
      if (typeof val.toString === 'function') return val.toString();
      return undefined;
    };

    // Ensure each item gets a stable `id` string, preferring ObjectId hex, then legacyId
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const addIdField = (arr?: any[]) => Array.isArray(arr) ? arr.map((it: any)=> ({ ...it, id: extractId(it._id) || it.legacyId || it.id })) : arr;

    if (clone) {
      clone.keyConcepts = addIdField(clone.keyConcepts);
      clone.productRecommendations = addIdField(clone.productRecommendations);
      clone.gamesAndActivities = addIdField(clone.gamesAndActivities);
      clone.homework = addIdField(clone.homework);
      clone.trainingSkills = addIdField(clone.trainingSkills);
      if (Array.isArray(clone.customCategories)) {
        clone.customCategories = clone.customCategories.map((cat: any) => ({ ...cat, id: cat._id?.toString?.() || cat.legacyId, items: addIdField(cat.items) }));
      }
    }

    return NextResponse.json({ 
      success: true, 
      settings: clone || {
        keyConcepts: [],
        productRecommendations: [],
        gamesAndActivities: [],
        trainingSkills: [],
        homework: []
      }
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache'
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
          homework: settings.homework || [],
          customCategories: settings.customCategories || []
        } 
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving settings:', error);
    console.error('Error details:', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { success: false, error: 'Failed to save settings' },
      { status: 500 }
    );
  }
} 